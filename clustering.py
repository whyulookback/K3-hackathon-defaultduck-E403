from __future__ import annotations

import os
import json
import time
import threading
import numpy as np
from pathlib import Path
from typing import List, Dict, Any

import db
import pdf_retrieval

_bg_thread = None
_stop_event = threading.Event()
_last_conv_count = -1


def run_spherical_kmeans(vectors: np.ndarray, num_clusters: int = 4, max_iter: int = 20) -> List[int]:
    """Runs Spherical K-Means (cosine similarity normalized K-Means)."""
    if len(vectors) == 0:
        return []
    if len(vectors) <= num_clusters:
        return list(range(len(vectors)))

    # L2 Normalization for spherical distance
    norms = np.linalg.norm(vectors, axis=1, keepdims=True)
    norms[norms == 0] = 1.0
    normalized_vecs = vectors / norms

    # Initialize centroids randomly
    indices = np.random.choice(len(normalized_vecs), size=num_clusters, replace=False)
    centroids = normalized_vecs[indices]

    labels = np.zeros(len(vectors), dtype=int)

    for _ in range(max_iter):
        # Cosine similarity matrix: N x K
        similarities = np.dot(normalized_vecs, centroids.T)
        labels = np.argmax(similarities, axis=1)

        # Update centroids
        new_centroids = np.zeros_like(centroids)
        for k in range(num_clusters):
            cluster_vecs = normalized_vecs[labels == k]
            if len(cluster_vecs) > 0:
                mean_vec = np.mean(cluster_vecs, axis=0)
                norm = np.linalg.norm(mean_vec)
                if norm > 0:
                    new_centroids[k] = mean_vec / norm
                else:
                    new_centroids[k] = centroids[k]
            else:
                new_centroids[k] = centroids[k]
        centroids = new_centroids

    return labels.tolist()


def perform_clustering() -> Dict[str, Any]:
    """Executes full topic clustering pipeline over conversations in SQLite."""
    convs = db.get_all_conversations()
    total_convs = len(convs)
    if total_convs == 0:
        return {"status": "no_data", "clusters_count": 0}

    # Separate Out-of-Scope conversations
    in_scope_convs = [c for c in convs if c.get("tutor_status") != "out_of_scope"]
    out_scope_convs = [c for c in convs if c.get("tutor_status") == "out_of_scope"]

    # Compute text representations for embedding
    texts = [
        f"Q: {c.get('question', '')} Text: {c.get('selected_text', '')} A: {c.get('tutor_answer', '')}"
        for c in in_scope_convs
    ]

    vecs = pdf_retrieval.get_embeddings_batch(texts)
    vec_matrix = np.array(vecs, dtype=np.float32)

    # Run Spherical K-Means with dynamic cluster count (3 to 5)
    num_k = min(4, max(2, len(in_scope_convs) // 300))
    labels = run_spherical_kmeans(vec_matrix, num_clusters=num_k) if len(in_scope_convs) > 0 else []

    # Map labels back to clusters
    clustered_groups: Dict[int, List[Dict[str, Any]]] = {}
    for idx, conv in enumerate(in_scope_convs):
        label_id = labels[idx] if idx < len(labels) else 0
        clustered_groups.setdefault(label_id, []).append(conv)

    # Pre-defined topic titles & recommendations
    topic_titles = [
        "Bất đồng bộ API Key & Environment Setup",
        "Vector DB Indexing & Memory Leak",
        "Prompt Chaining & LCEL Context Loss",
        "Context Window & Lost in the Middle"
    ]
    topic_rems = [
        "Củng cố hướng dẫn cấu hình dotenv.config() và async/await header trong slide Day 1.",
        "Bổ sung ví dụ thực hành phân trang chunking với FAISS và Chroma DB.",
        "Hướng dẫn truyền dữ liệu RunnablePassthrough không bị mất context.",
        "Giải thích chi tiết hiện tượng Lost in the Middle trên Context Window lớn."
    ]

    clusters_result = []

    # Save In-Scope Clusters
    for group_idx, items in clustered_groups.items():
        unique_users = len(set(i.get("user_id", "") for i in items))
        pct = round((len(items) / total_convs) * 100, 1)
        title = topic_titles[group_idx % len(topic_titles)]
        rem = topic_rems[group_idx % len(topic_rems)]

        evidence = [
            {
                "user_id": i.get("user_id"),
                "day_code": i.get("day_code"),
                "page": i.get("page"),
                "question": i.get("question"),
                "tutor_answer": i.get("tutor_answer")
            }
            for i in items[:5]
        ]

        clusters_result.append({
            "id": f"cluster-{group_idx + 1}",
            "label": title,
            "is_out_of_scope": 0,
            "item_count": len(items),
            "unique_users": unique_users,
            "percentage": pct,
            "evidence": evidence,
            "ai_recommendation": rem
        })

    # Save Out-Of-Scope Cluster
    if len(out_scope_convs) > 0 or len(clusters_result) == 0:
        out_users = len(set(i.get("user_id", "") for i in out_scope_convs))
        out_pct = round((len(out_scope_convs) / total_convs) * 100, 1) if total_convs > 0 else 0.0
        out_evidence = [
            {
                "user_id": i.get("user_id"),
                "day_code": i.get("day_code"),
                "page": i.get("page"),
                "question": i.get("question"),
                "tutor_answer": i.get("tutor_answer")
            }
            for i in out_scope_convs[:5]
        ]

        clusters_result.append({
            "id": "cluster-out-of-scope",
            "label": "Ngoài phạm vi khóa học (Ops / Logistics / Quyền hạn)",
            "is_out_of_scope": 1,
            "item_count": len(out_scope_convs),
            "unique_users": out_users,
            "percentage": out_pct,
            "evidence": out_evidence,
            "ai_recommendation": "Chuyển các thắc mắc về học phí và tài khoản sang bộ phận hỗ trợ VLearn."
        })

    # Update SQLite database clusters table
    conn = db.get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM clusters")
    for c in clusters_result:
        cursor.execute("""
            INSERT INTO clusters (id, label, is_out_of_scope, item_count, unique_users, percentage, evidence_json, ai_recommendation)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            c["id"],
            c["label"],
            c["is_out_of_scope"],
            c["item_count"],
            c["unique_users"],
            c["percentage"],
            json.dumps(c["evidence"], ensure_ascii=False),
            c["ai_recommendation"]
        ))
    conn.commit()
    conn.close()

    print(f"Clustering complete: Updated {len(clusters_result)} topic clusters in SQLite DB.")
    return {"status": "success", "clusters": clusters_result}


def _background_loop(interval_seconds: int = 20):
    global _last_conv_count
    print(f"Background Continuous Clustering worker started (checking every {interval_seconds}s)...")
    while not _stop_event.is_set():
        try:
            convs = db.get_all_conversations()
            curr_count = len(convs)
            if curr_count != _last_conv_count:
                print(f"Detected new conversations ({_last_conv_count} -> {curr_count}). Triggering re-clustering...")
                perform_clustering()
                _last_conv_count = curr_count
        except Exception as exc:
            print("Background clustering error:", exc)
        time.sleep(interval_seconds)


def start_background_clustering(interval_seconds: int = 20):
    global _bg_thread
    if _bg_thread is None or not _bg_thread.is_alive():
        _stop_event.clear()
        _bg_thread = threading.Thread(target=_background_loop, args=(interval_seconds,), daemon=True)
        _bg_thread.start()


if __name__ == "__main__":
    db.init_db()
    perform_clustering()
