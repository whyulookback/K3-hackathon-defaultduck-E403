from __future__ import annotations

import csv
import json
import re
import sys
import unicodedata
from collections import Counter, defaultdict
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
LABCOACH_PATH = ROOT / "labcoach.csv"
STUDENT_PATH = ROOT / "student.csv"
CHATLOG_PATH = (
    ROOT
    / "data"
    / "vlearn-pack"
    / "chatlog"
    / "chat_history_anonymized_for_hackathon.csv"
)

EXAMPLE_TURN_IDS = ["T0014", "T0036", "T0065", "T0128", "T1261"]


def read_csv(path: Path) -> list[dict[str, str]]:
    with path.open(encoding="utf-8-sig", newline="") as handle:
        return list(csv.DictReader(handle))


def find_header(rows: list[dict[str, str]], phrase: str) -> str:
    phrase = phrase.casefold()
    for header in rows[0]:
        if phrase in header.strip().casefold():
            return header
    raise KeyError(f"Không tìm thấy cột chứa: {phrase}")


def contains_any(value: str, choices: tuple[str, ...]) -> bool:
    normalized = value.casefold()
    return any(choice.casefold() in normalized for choice in choices)


def empty_jsonish(value: str | None) -> bool:
    return (value or "").strip() in {"", "[]", "{}", "null", "None"}


def compact(value: str, limit: int) -> str:
    return re.sub(r"\s+", " ", value).strip()[:limit]


def is_k3_response(value: str) -> bool:
    normalized = unicodedata.normalize("NFKD", value)
    normalized = "".join(
        character
        for character in normalized
        if not unicodedata.combining(character)
    )
    normalized = re.sub(r"\s+", "", normalized.casefold())
    return normalized in {"3", "k3", "khoa3"}


def analyze() -> dict[str, object]:
    labcoach = read_csv(LABCOACH_PATH)
    students = read_csv(STUDENT_PATH)
    chatlog = read_csv(CHATLOG_PATH)

    lab_difficulty = find_header(
        labcoach, "có gặp khó khăn trong việc xác định"
    )
    lab_would_use = find_header(labcoach, "có sử dụng không")
    lab_wants = find_header(labcoach, "muốn công cụ cung cấp")
    lab_format = find_header(labcoach, "muốn nhận báo cáo")

    student_unclear = find_header(students, "còn nội dung chưa hiểu")
    student_ai = find_header(students, "sẵn sàng sử dụng")
    student_action = find_header(students, "thường làm gì")
    student_course = find_header(students, "đang học khóa học nào")
    valid_students = [
        row for row in students if is_k3_response(row[student_course])
    ]

    meaningful_frequency = ("Thỉnh thoảng", "Thường xuyên", "Luôn luôn")
    lab_problem_count = sum(
        contains_any(row[lab_difficulty], meaningful_frequency)
        for row in labcoach
    )
    student_problem_count = sum(
        contains_any(row[student_unclear], meaningful_frequency)
        for row in students
    )
    valid_student_problem_count = sum(
        contains_any(row[student_unclear], meaningful_frequency)
        for row in valid_students
    )
    survey_total = len(labcoach) + len(students)
    survey_problem_count = lab_problem_count + student_problem_count

    tutor_rows = [row for row in chatlog if row["role"] == "tutor"]
    student_rows = [row for row in chatlog if row["role"] == "student"]
    tutor_without_citations = [
        row for row in tutor_rows if empty_jsonish(row.get("citations"))
    ]
    student_with_page_marker = [
        row
        for row in student_rows
        if re.search(r"(?i)\(Trang\s+\d+", row["content"])
    ]

    turns: dict[str, dict[str, dict[str, str]]] = defaultdict(dict)
    for row in chatlog:
        turns[row["turn_id"]][row["role"]] = row

    examples = []
    for turn_id in EXAMPLE_TURN_IDS:
        pair = turns[turn_id]
        tutor = pair["tutor"]
        student = pair["student"]
        if not empty_jsonish(tutor.get("citations")):
            raise AssertionError(f"{turn_id} không còn là ví dụ citation rỗng")
        examples.append(
            {
                "turn_id": turn_id,
                "question": compact(student["content"], 260),
                "tutor_answer": compact(tutor["content"], 360),
                "citations": tutor.get("citations", ""),
            }
        )

    wanted_items = (
        "Những chủ đề học viên hỏi nhiều nhất",
        "Những lỗi phổ biến nhất",
        "Mức độ khó của từng chủ đề",
        "Nhóm học viên đang gặp khó khăn",
        "Đề xuất nội dung cần giảng lại",
    )
    report_formats = (
        "Heatmap",
        "Biểu đồ",
        "Dashboard",
        "Báo cáo văn bản",
        "Email tổng hợp",
    )

    return {
        "survey": {
            "outside_group_confirmed_by_team": True,
            "labcoach_responses": len(labcoach),
            "student_responses": len(students),
            "total_responses": survey_total,
            "labcoach_problem_confirmed": lab_problem_count,
            "student_problem_confirmed": student_problem_count,
            "combined_problem_confirmed": survey_problem_count,
            "combined_problem_rate_pct": round(
                survey_problem_count * 100 / survey_total, 1
            ),
            "quality_control": {
                "excluded_student_responses": len(students)
                - len(valid_students),
                "exclusion_reason": (
                    "Một câu trả lời ghi khóa học là '123', không xác nhận được "
                    "là học viên K3."
                ),
                "valid_total_responses": len(labcoach)
                + len(valid_students),
                "valid_problem_confirmed": lab_problem_count
                + valid_student_problem_count,
                "valid_problem_rate_pct": round(
                    (lab_problem_count + valid_student_problem_count)
                    * 100
                    / (len(labcoach) + len(valid_students)),
                    1,
                ),
            },
            "labcoach_would_use": sum(
                row[lab_would_use].strip() == "Có" for row in labcoach
            ),
            "labcoach_would_use_rate_pct": round(
                sum(row[lab_would_use].strip() == "Có" for row in labcoach)
                * 100
                / len(labcoach),
                1,
            ),
            "student_ai_yes_or_try": sum(
                row[student_ai].strip() in {"Có", "Cần thử nghiệm trước"}
                for row in students
            ),
            "student_ai_yes_or_try_rate_pct": round(
                sum(
                    row[student_ai].strip()
                    in {"Có", "Cần thử nghiệm trước"}
                    for row in students
                )
                * 100
                / len(students),
                1,
            ),
            "students_using_ai_tutor": sum(
                "Hỏi AI Tutor" in row[student_action] for row in students
            ),
            "labcoach_wanted_information": {
                item: sum(item in row[lab_wants] for row in labcoach)
                for item in wanted_items
            },
            "labcoach_report_formats": {
                item: sum(item in row[lab_format] for row in labcoach)
                for item in report_formats
            },
        },
        "chatlog": {
            "messages": len(chatlog),
            "student_messages": len(student_rows),
            "tutor_messages": len(tutor_rows),
            "turns": len({row["turn_id"] for row in chatlog}),
            "conversations": len(
                {row["conversation_id"] for row in chatlog}
            ),
            "unique_users": len({row["user_id"] for row in chatlog}),
            "tutor_without_citations": len(tutor_without_citations),
            "tutor_without_citations_rate_pct": round(
                len(tutor_without_citations) * 100 / len(tutor_rows), 1
            ),
            "student_with_page_marker": len(student_with_page_marker),
            "student_with_page_marker_rate_pct": round(
                len(student_with_page_marker) * 100 / len(student_rows), 1
            ),
            "role_counts": dict(Counter(row["role"] for row in chatlog)),
            "examples_without_citations": examples,
        },
    }


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    print(json.dumps(analyze(), ensure_ascii=False, indent=2))
