from __future__ import annotations

import sqlite3
import os
import json
import pandas as pd
from pathlib import Path
from typing import Any, List, Dict

ROOT = Path(__file__).parent
DB_PATH = ROOT / "vlearn.db"
CSV_PATH = ROOT / "data" / "vlearn-pack" / "chatlog" / "chat_history_anonymized_for_hackathon.csv"


def get_db_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL;")
    return conn


def init_db() -> None:
    conn = get_db_connection()
    cursor = conn.cursor()

    # Create conversations table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS conversations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT,
            day_code TEXT,
            page INTEGER DEFAULT 1,
            selected_text TEXT,
            question TEXT NOT NULL,
            tutor_answer TEXT,
            tutor_status TEXT DEFAULT 'answered',
            citation_page INTEGER,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    """)

    # Create clusters table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS clusters (
            id TEXT PRIMARY KEY,
            label TEXT NOT NULL,
            is_out_of_scope INTEGER DEFAULT 0,
            item_count INTEGER DEFAULT 0,
            unique_users INTEGER DEFAULT 0,
            percentage REAL DEFAULT 0.0,
            evidence_json TEXT,
            ai_recommendation TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    """)

    # Create synthetic_pairs table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS synthetic_pairs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            day_code TEXT,
            page INTEGER,
            question TEXT,
            answer TEXT,
            intent TEXT
        );
    """)

    conn.commit()

    # Seed conversations from 1,261 chatlogs if empty
    cursor.execute("SELECT COUNT(*) FROM conversations")
    count = cursor.fetchone()[0]
    if count == 0 and CSV_PATH.exists():
        try:
            df = pd.read_csv(CSV_PATH)
            student_df = df[df['role'] == 'student'] if 'role' in df.columns else df
            rows_to_insert = []
            for _, row in student_df.iterrows():
                rows_to_insert.append((
                    str(row.get('author_id', 'anon_user')),
                    str(row.get('day_code', 'Day1')),
                    int(row.get('page', 1)) if pd.notnull(row.get('page')) else 1,
                    str(row.get('selected_text', '')) if pd.notnull(row.get('selected_text')) else '',
                    str(row.get('content', '')),
                    "AI Teacher Copilot: Đã giải đáp thắc mắc của học viên.",
                    "answered",
                    int(row.get('page', 1)) if pd.notnull(row.get('page')) else 1
                ))
            cursor.executemany("""
                INSERT INTO conversations (user_id, day_code, page, selected_text, question, tutor_answer, tutor_status, citation_page)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, rows_to_insert)
            conn.commit()
            print(f"Seeded {len(rows_to_insert)} conversations from chatlog CSV into SQLite DB.")
        except Exception as e:
            print("Error seeding conversations:", e)

    # Seed initial clusters if empty
    cursor.execute("SELECT COUNT(*) FROM clusters")
    cluster_count = cursor.fetchone()[0]
    if cluster_count == 0:
        initial_clusters = [
            ("cluster-1", "Bất đồng bộ API Key & Environment Setup", 0, 431, 149, 34.2, json.dumps([{"user_id": "U0151", "day_code": "Day1", "page": 8, "question": "Pass API Key vào .env bị lỗi 401 Unauthorized"}]), "Củng cố hướng dẫn dotenv.config() và async/await header trong slide Day 1."),
            ("cluster-2", "Vector DB Indexing & Memory Leak", 0, 320, 118, 25.4, json.dumps([{"user_id": "U0312", "day_code": "Day2", "page": 9, "question": "Cụm Vector DB bị tràn RAM khi ingest 100k chunk"}]), "Bổ sung ví dụ thực hành phân trang chunking với FAISS."),
            ("cluster-3", "Prompt Chaining & LCEL Context Loss", 0, 149, 96, 11.8, json.dumps([{"user_id": "U0099", "day_code": "Day2", "page": 12, "question": "Prompt Chaining bị mất context qua RunnablePassthrough"}]), "Hướng dẫn truyền dữ liệu RunnablePassthrough không bị mất context."),
            ("cluster-4", "Ngoài phạm vi khóa học (Ops / Logistics / Quyền hạn)", 1, 361, 85, 28.6, json.dumps([{"user_id": "U0005", "day_code": "Other", "page": 1, "question": "Đóng tiền học phí ở đâu ạ?"}]), "Chuyển các thắc mắc về học phí và tài khoản sang bộ phận hỗ trợ VLearn.")
        ]
        cursor.executemany("""
            INSERT INTO clusters (id, label, is_out_of_scope, item_count, unique_users, percentage, evidence_json, ai_recommendation)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, initial_clusters)
        conn.commit()
        print("Seeded 4 initial topic clusters into SQLite DB.")

    conn.close()


def save_conversation(user_id: str, day_code: str, page: int, selected_text: str, question: str, tutor_answer: str, tutor_status: str, citation_page: int | None) -> int:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO conversations (user_id, day_code, page, selected_text, question, tutor_answer, tutor_status, citation_page)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (user_id, day_code, page, selected_text, question, tutor_answer, tutor_status, citation_page))
    cid = cursor.lastrowid
    conn.commit()
    conn.close()
    return cid


def get_all_conversations() -> List[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM conversations ORDER BY id DESC")
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]


if __name__ == "__main__":
    init_db()
    print("Database initialized successfully.")
