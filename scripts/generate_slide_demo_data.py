"""Create an explicitly synthetic Q&A dataset grounded in the two demo PDFs."""

from __future__ import annotations

import csv
import re
from datetime import datetime, timedelta, timezone
from pathlib import Path

from pypdf import PdfReader


ROOT = Path(__file__).resolve().parents[1]
SLIDES_DIR = ROOT / "data" / "vlearn-pack" / "slides"
OUTPUT_PATH = (
    ROOT
    / "data"
    / "vlearn-pack"
    / "chatlog"
    / "synthetic_chat_history_from_slides.csv"
)


def clean_text(value: str) -> str:
    value = re.sub(r"[\ue000-\uf8ff]", " ", value)
    value = re.sub(r"\s+", " ", value)
    return value.strip()


def topic_hint(text: str, page_number: int) -> str:
    cleaned = re.sub(
        r"(?i)AI IN ACTION(?:\s*-\s*HACKATHON)?|DAY\s*0?\d|Trang\s*\d+",
        " ",
        text,
    )
    words = re.findall(r"[\wÀ-ỹ][\wÀ-ỹ+./-]*", cleaned, flags=re.UNICODE)
    hint = " ".join(words[:14]).strip(" .:-")
    return hint or f"Nội dung trang {page_number}"


def build_rows() -> list[dict[str, str | int]]:
    rows: list[dict[str, str | int]] = []
    base_time = datetime(2026, 7, 29, 1, 0, tzinfo=timezone.utc)
    counter = 0
    for pdf_path in sorted(SLIDES_DIR.glob("*.pdf")):
        reader = PdfReader(str(pdf_path))
        for page_index, page in enumerate(reader.pages, start=1):
            content = clean_text(page.extract_text() or "")
            if not content:
                continue
            hint = topic_hint(content, page_index)
            excerpt = content[:900]
            samples = [
                (
                    f"Bạn giải thích ngắn gọn nội dung chính về “{hint}” được không?",
                    f"Trang {page_index} trình bày trọng tâm về {hint}. "
                    f"Dựa trên slide: {excerpt[:520]}",
                    "explain",
                ),
                (
                    f"Vì sao phần “{hint}” quan trọng khi xây dựng sản phẩm AI?",
                    f"Ý nghĩa của phần này nằm ở cách nó kết nối kiến thức với quyết định "
                    f"sản phẩm. Slide trang {page_index} nêu: {excerpt[:500]}",
                    "why",
                ),
                (
                    f"Cho mình một cách áp dụng hoặc ghi nhớ phần “{hint}”.",
                    f"Cách ghi nhớ là tách khái niệm, cơ chế và tình huống áp dụng. "
                    f"Nội dung gốc ở trang {page_index}: {excerpt[:500]}",
                    "apply",
                ),
            ]
            for question, answer, intent in samples:
                counter += 1
                created_at = base_time + timedelta(minutes=counter * 3)
                rows.append(
                    {
                        "sample_id": f"SYN-SLIDE-{counter:04d}",
                        "source": "synthetic_slide",
                        "is_synthetic": "true",
                        "slide_filename": pdf_path.name,
                        "page_number": page_index,
                        "topic_hint": hint,
                        "intent": intent,
                        "user_id": f"SYN-U{((counter - 1) % 60) + 1:03d}",
                        "conversation_id": f"SYN-C{((counter - 1) // 3) + 1:03d}",
                        "question": question,
                        "tutor_answer": answer,
                        "created_at": created_at.isoformat(),
                    }
                )
    return rows


def main() -> None:
    rows = build_rows()
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    fieldnames = [
        "sample_id",
        "source",
        "is_synthetic",
        "slide_filename",
        "page_number",
        "topic_hint",
        "intent",
        "user_id",
        "conversation_id",
        "question",
        "tutor_answer",
        "created_at",
    ]
    with OUTPUT_PATH.open("w", encoding="utf-8-sig", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)
    print(f"Created {len(rows)} synthetic rows at {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
