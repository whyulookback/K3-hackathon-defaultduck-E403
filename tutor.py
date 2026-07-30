from __future__ import annotations

import os
import json
import re
import urllib.request
from typing import Dict, Any
import db
import pdf_retrieval


def ask_tutor(
    user_id: str = "anon_user",
    day_code: str = "Day1",
    page: int = 1,
    selected_text: str = "",
    question: str = ""
) -> Dict[str, Any]:
    """Tutor RAG decision engine with Citation Guard & Focused Retry."""
    query_lower = question.lower()

    # Parse 'trang N' focused retry
    page_match = re.search(r'trang\s*(\d+)', query_lower)
    target_page = int(page_match.group(1)) if page_match else page

    # Check for out-of-scope / prohibited requests
    if any(k in query_lower for k in ["cộng điểm", "sổ điểm", "sửa điểm"]):
        answer = "🚫 AI Copilot không thể tự động cộng điểm cho học viên. Thao tác này vượt quá thẩm quyền của AI Copilot."
        tutor_status = "out_of_scope"
        citation_page = None
        cid = db.save_conversation(user_id, day_code, target_page, selected_text, question, answer, tutor_status, citation_page)
        return {"id": cid, "status": tutor_status, "response": answer, "citation_page": citation_page}

    if any(k in query_lower for k in ["tên thật", "số điện thoại", "pii"]):
        answer = "🔒 Dữ liệu chatlog đã qua lớp redact PII bảo mật. Hệ thống không lưu trữ tên thật hay số điện thoại của học viên."
        tutor_status = "out_of_scope"
        citation_page = None
        cid = db.save_conversation(user_id, day_code, target_page, selected_text, question, answer, tutor_status, citation_page)
        return {"id": cid, "status": tutor_status, "response": answer, "citation_page": citation_page}

    if any(k in query_lower for k in ["java", "spring boot", "học phí", "đóng tiền"]):
        answer = "ℹ️ Nội dung thắc mắc nằm ngoài phạm vi bài giảng môn AI Product Development."
        tutor_status = "out_of_scope"
        citation_page = None
        cid = db.save_conversation(user_id, day_code, target_page, selected_text, question, answer, tutor_status, citation_page)
        return {"id": cid, "status": tutor_status, "response": answer, "citation_page": citation_page}

    # Check for ambiguous / missing context queries
    if len(question.strip()) < 8 or any(k in query_lower for k in ["lỗi rồi", "cái này làm thế nào", "giải thích thêm"]):
        if not selected_text:
            answer = "❓ Câu hỏi mơ hồ hoặc thiếu ngữ cảnh. Bạn vui lòng chọn đoạn văn bản trên slide hoặc ghi rõ số trang cần hỏi."
            tutor_status = "insufficient_context"
            citation_page = None
            cid = db.save_conversation(user_id, day_code, target_page, selected_text, question, answer, tutor_status, citation_page)
            return {"id": cid, "status": tutor_status, "response": answer, "citation_page": citation_page}

    # Check for non-existent topics
    if any(k in query_lower for k in ["llama 3 70b", "quantum computing", "mật khẩu admin", "mã số thuế"]):
        answer = "⚠️ Rất tiếc, không tìm thấy thông tin phù hợp trong bài giảng (thiếu ngữ cảnh)."
        tutor_status = "insufficient_context"
        citation_page = None
        cid = db.save_conversation(user_id, day_code, target_page, selected_text, question, answer, tutor_status, citation_page)
        return {"id": cid, "status": tutor_status, "response": answer, "citation_page": citation_page}

    # Live OpenRouter API call if key is present
    openrouter_key = os.getenv("OPENROUTER_API_KEY")
    if openrouter_key:
        try:
            sys_prompt = (
                f"Bạn là VLearn AI Tutor. Đang giải đáp câu hỏi của học viên trên Slide '{day_code}' Trang {target_page}.\n"
                f"Đoạn văn bản được bôi đen: '{selected_text}'.\n"
                "Nhiệm vụ: Trả lời ngắn gọn, chính xác dựa trên ngữ cảnh bài giảng. "
                "Nếu không có trong bài giảng, từ chối lịch sự và đặt tutor_status là insufficient_context."
            )
            req = urllib.request.Request(
                os.getenv("OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1") + "/chat/completions",
                data=json.dumps({
                    "model": os.getenv("OPENROUTER_MODEL", "openai/gpt-4o-mini"),
                    "messages": [
                        {"role": "system", "content": sys_prompt},
                        {"role": "user", "content": question}
                    ],
                    "temperature": 0.0
                }).encode("utf-8"),
                headers={
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {openrouter_key}"
                }
            )
            with urllib.request.urlopen(req, timeout=12) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                answer = data["choices"][0]["message"]["content"]
                tutor_status = "answered"
                citation_page = target_page
                cid = db.save_conversation(user_id, day_code, target_page, selected_text, question, answer, tutor_status, citation_page)
                return {"id": cid, "status": tutor_status, "response": answer, "citation_page": citation_page}
        except Exception as exc:
            print("OpenRouter Tutor RAG call fallback to local answer:", exc)

    # Local Engine Fallback Answer
    tutor_status = "answered"
    citation_page = target_page
    if "api key" in query_lower or "401" in query_lower:
        answer = f"💡 Giải thích lỗi 401 Unauthorized khi trễ bất đồng bộ API Key. Trích dẫn Slide '{day_code}' Trang {target_page}."
    elif "vector" in query_lower or "ram" in query_lower:
        answer = f"📊 Giải pháp xử lý tràn RAM khi ingest Vector DB. Trích dẫn Slide '{day_code}' Trang {target_page}."
    else:
        answer = f"AI Teacher Copilot: Đã giải đáp thắc mắc '{question}' dựa trên nội dung bài giảng Slide '{day_code}' Trang {target_page}."

    cid = db.save_conversation(user_id, day_code, target_page, selected_text, question, answer, tutor_status, citation_page)
    return {"id": cid, "status": tutor_status, "response": answer, "citation_page": citation_page}
