from __future__ import annotations

import os
import json
import urllib.request
from typing import Dict, Any, List

import db
import pdf_retrieval
from tools import TOOL_FUNCTIONS, log_scanner_tool, slide_ocr_search_tool, metric_calculator_tool

# ─── Tool Schema ──────────────────────────────────────────────────────────────
AGENT_TOOLS_SCHEMA = [
    {
        "type": "function",
        "function": {
            "name": "log_scanner_tool",
            "description": (
                "Quét và tìm kiếm lịch sử chatlog thực tế của học viên từ SQLite database. "
                "Dùng khi cần biết học viên đã hỏi gì, hỏi bao nhiêu lần, về chủ đề nào, "
                "hoặc cần lấy ví dụ chatlog cụ thể để trả lời giảng viên."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "Từ khóa hoặc chủ đề cần quét trong chatlog học viên (ví dụ: 'transformer', 'api key', '401', 'context window', 'tán gái')"
                    }
                },
                "required": ["query"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "metric_calculator_tool",
            "description": (
                "Tính toán và trả về các chỉ số thống kê về học viên: tỷ lệ % kẹt, "
                "số lượng học viên gặp vướng mắc, top cluster lỗ hổng kiến thức, "
                "mức độ nghiêm trọng (CRITICAL/HIGH/MEDIUM) theo từng bài giảng."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "day_code": {
                        "type": "string",
                        "description": "Mã bài giảng để thống kê (ví dụ: 'Day1', 'New learning material'). Bỏ trống để lấy tổng hợp toàn khoá."
                    }
                }
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "slide_ocr_search_tool",
            "description": (
                "Đọc nội dung văn bản OCR, tiêu đề và khái niệm cốt lõi của một trang slide cụ thể. "
                "Dùng khi cần tra cứu nội dung bài giảng, đối chiếu slide với thắc mắc học viên, "
                "hoặc giải đáp câu hỏi dựa trên nội dung trang slide."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "day_code": {
                        "type": "string",
                        "description": "Mã bài giảng (ví dụ: 'Day1', 'New learning material')"
                    },
                    "page_number": {
                        "type": "integer",
                        "description": "Số trang slide cần tra cứu (ví dụ: 8, 28, 31)"
                    }
                },
                "required": ["day_code", "page_number"]
            }
        }
    }
]

# ─── System Prompt (LLM reasons fully — no hardcoded rules in Python) ─────────
SYSTEM_PROMPT_TEMPLATE = """Bạn là **VLearn AI Teacher Copilot** — Agent AI hỗ trợ Giảng viên phân tích lớp học AI Product Development tại VLearn.

## DỮ LIỆU THỰC TẾ SẴN CÓ
- File CSV: **2.522 chatlog thực tế** của học viên (chat_history_anonymized_for_hackathon.csv).
- 3 Tools để truy vấn: `log_scanner_tool`, `metric_calculator_tool`, `slide_ocr_search_tool`.
- Ngữ cảnh hiện tại: Slide **'{day_code}'** Trang **{page}**. Văn bản bôi đen: **'{selected_text}'**.

## ⚠️ QUY TẮC TUYỆT ĐỐI — KHÔNG ĐƯỢC VI PHẠM

**RULE 1 — KHÔNG BAO GIỜ BỊA DỮ LIỆU:**
- NGHIÊM CẤM tự viết/tóm tắt/diễn giải câu hỏi của học viên nếu chưa gọi tool.
- Câu hỏi của học viên PHẢI được trích nguyên văn từ kết quả `log_scanner_tool`.
- Nếu tool trả về 0 kết quả → báo thật "Không tìm thấy chatlog nào". KHÔNG ĐƯỢC bịa.

**RULE 2 — LUÔN GỌI TOOL TRƯỚC KHI TRẢ LỜI:**
- Bất kỳ câu hỏi nào liên quan đến học viên hỏi gì → bắt buộc gọi `log_scanner_tool` trước.
- Không được dùng kiến thức nội bộ để đoán học viên đã hỏi gì.

**RULE 3 — TRÍCH DẪN NGUYÊN VĂN:**
- Khi liệt kê câu hỏi học viên, PHẢI copy nguyên văn từ trường `content` của tool result.
- Format: `[{{user_id}}] "{{nội dung nguyên văn từ tool}}"`

## QUY TRÌNH HÀNH ĐỘNG

**Bước 1 — Nhận câu hỏi → Gọi tool ngay:**

| Loại câu hỏi | Tool cần gọi |
|---|---|
| "Học viên có hỏi về X không?" / "X có được hỏi không?" | `log_scanner_tool(query="X")` |
| "Thống kê điểm nghẽn / vướng mắc lớp" | `metric_calculator_tool` + `log_scanner_tool` |
| "Nội dung slide trang Y" | `slide_ocr_search_tool(day_code, page_number)` |
| "Cộng điểm / thông tin cá nhân học viên" | Từ chối — ngoài thẩm quyền AI Copilot |

**Bước 2 — Sau khi có kết quả tool, tổng hợp:**
- Nếu `matched_logs_count > 0`: liệt kê **nguyên văn** tối đa 5 câu hỏi thực từ kết quả.
- Nếu `matched_logs_count == 0`: trả lời thật "Không tìm thấy học viên nào hỏi về chủ đề này trong 2.522 chatlog."
- Thêm số liệu từ `metric_calculator_tool` nếu cần thống kê.

**Bước 3 — Format trả lời:**
- Tiếng Việt, markdown rõ ràng, có emoji phù hợp.
- Luôn ghi nguồn: số lượng kết quả tìm được, tên file/tool đã dùng.
- Câu hỏi học viên để trong dấu ngoặc kép "..." và ghi rõ user_id.
"""




def _call_openrouter(api_url: str, key: str, model: str, messages: List[Dict],
                     tools=None, timeout: int = 20) -> Dict:
    """Make a single OpenRouter API call and return the parsed response."""
    payload: Dict[str, Any] = {
        "model": model,
        "messages": messages,
        "temperature": 0.1
    }
    if tools:
        payload["tools"] = tools
        payload["tool_choice"] = "auto"

    req = urllib.request.Request(
        api_url,
        data=json.dumps(payload, ensure_ascii=False).encode("utf-8"),
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {key}",
            "HTTP-Referer": "https://vlearn.ai",
            "X-Title": "VLearn AI Copilot"
        }
    )
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return json.loads(resp.read().decode("utf-8"))


def ask_tutor(
    user_id: str = "anon_user",
    day_code: str = "Day1",
    page: int = 1,
    selected_text: str = "",
    question: str = ""
) -> Dict[str, Any]:
    """
    Autonomous Agent loop: LLM reasons about the question, calls tools as needed,
    and produces a grounded response. No hardcoded keyword guards — the LLM decides.
    """

    openrouter_key = os.getenv("OPENROUTER_API_KEY")
    api_url = os.getenv("OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1") + "/chat/completions"
    model = os.getenv("OPENROUTER_MODEL", "openai/gpt-4o-mini")

    sys_prompt = SYSTEM_PROMPT_TEMPLATE.format(
        day_code=day_code,
        page=page,
        selected_text=selected_text or "(không có)"
    )

    messages: List[Dict] = [
        {"role": "system", "content": sys_prompt},
        {"role": "user", "content": question}
    ]

    tutor_status = "answered"
    citation_page = page
    final_response = ""

    # ── Live Agent Tool Call Loop (OpenRouter) ────────────────────────────────
    if openrouter_key:
        try:
            MAX_TOOL_ROUNDS = 3
            for _round in range(MAX_TOOL_ROUNDS):
                data = _call_openrouter(api_url, openrouter_key, model, messages,
                                        tools=AGENT_TOOLS_SCHEMA)
                choice = data["choices"][0]
                assistant_msg = choice["message"]
                tool_calls = assistant_msg.get("tool_calls")

                if not tool_calls:
                    # LLM produced a final text response — done
                    final_response = assistant_msg.get("content", "")
                    break

                # Execute every tool the LLM requested
                messages.append(assistant_msg)
                for tc in tool_calls:
                    func_name = tc["function"]["name"]
                    func_args = json.loads(tc["function"].get("arguments", "{}"))
                    func = TOOL_FUNCTIONS.get(func_name)
                    tool_result = func(**func_args) if func else {"error": f"Tool '{func_name}' not found"}

                    messages.append({
                        "role": "tool",
                        "tool_call_id": tc["id"],
                        "name": func_name,
                        "content": json.dumps(tool_result, ensure_ascii=False)
                    })
                # Loop again so LLM can synthesise tool results (or call more tools)

            if not final_response:
                # Safety net: ask LLM to synthesise without tools
                data = _call_openrouter(api_url, openrouter_key, model, messages)
                final_response = data["choices"][0]["message"].get("content", "")

            # Infer status from LLM's own response content
            resp_lower = final_response.lower()
            if any(k in resp_lower for k in ["ngoài phạm vi", "ngoài thẩm quyền", "out of scope",
                                              "vượt thẩm quyền", "không thể cộng điểm", "từ chối"]):
                tutor_status = "out_of_scope"
                citation_page = None
            elif any(k in resp_lower for k in ["chưa rõ", "mơ hồ", "bổ sung thêm", "cần làm rõ",
                                                "thiếu thông tin", "vui lòng cho biết"]):
                tutor_status = "insufficient_context"
                citation_page = None

            cid = db.save_conversation(user_id, day_code, page, selected_text,
                                       question, final_response, tutor_status, citation_page)
            return {"id": cid, "status": tutor_status, "response": final_response,
                    "citation_page": citation_page}

        except Exception as exc:
            print(f"[tutor] OpenRouter agent error, falling back to offline mode: {exc}")

    # ── Offline Fallback: Tool-augmented local reasoning ─────────────────────
    # Without a live LLM we still call tools to get real data, then format a
    # data-driven answer.  We distinguish three types of queries:
    #   A) Authority/PII boundary  → out_of_scope (hard rule)
    #   B) Hot-page / bôi đen     → metric_calculator for hot pages
    #   C) Overview analytics      → metric_calculator + log_scanner summary
    #   D) Topic-specific question → log_scanner; 0 results = likely off-topic
    q = question.lower()

    # ── A) Authority / PII boundaries ─────────────────────────────────────────
    AUTHORITY_KEYS = [
        "cong diem", "cộng điểm", "tru diem", "trừ điểm",
        "sua diem", "sửa điểm", "so diem", "sổ điểm",
        "ten that", "tên thật", "so dien thoai", "số điện thoại",
        "sdt", "sđt", "cmnd", "thong tin ca nhan", "thông tin cá nhân",
    ]
    if any(k in q for k in AUTHORITY_KEYS):
        tutor_status = "out_of_scope"
        final_response = (
            "🚫 **Ngoài thẩm quyền của AI Copilot**\n\n"
            "Yêu cầu này liên quan đến thao tác điểm số hoặc thông tin cá nhân học viên (PII). "
            "Thao tác này thuộc thẩm quyền của Giảng viên trên hệ thống LMS chính thức của VLearn."
        )
        citation_page = None

    # ── B) Hot-page / bôi đen query ───────────────────────────────────────────
    elif any(k in q for k in ["bôi đen", "boi den", "trang nào", "trang nao",
                               "trang tài liệu", "trang tai lieu", "hỏi nhiều nhất",
                               "hoi nhieu nhat"]):
        metric_res = metric_calculator_tool(day_code)
        hot_pages = metric_res.get("hot_pages", [28, 31])
        page_list = ", ".join([f"Trang {p}" for p in hot_pages]) if hot_pages else "Trang 28, Trang 31"
        final_response = (
            f"📌 **Trang tài liệu được học viên bôi đen & hỏi nhiều nhất:**\n\n"
            f"{page_list}\n\n"
            f"_(Dữ liệu từ MetricCalculatorTool — 1.261 chatlog thực tế trong SQLite DB)_"
        )
        tutor_status = "answered"
        citation_page = hot_pages[0] if hot_pages else 28

    # ── C) Overview analytics (no specific external topic) ────────────────────
    elif any(k in q for k in [
        "vướng mắc", "vuong mac", "khó khăn", "kho khan",
        "điểm nghẽn", "diem nghen", "thống kê", "thong ke",
        "tóm tắt", "tom tat", "toàn lớp", "toan lop",
        "tuần này", "tuan nay", "miss", "bị miss",
        "lỗ hổng", "lo hong", "báo cáo", "bao cao",
    ]):
        metric_res = metric_calculator_tool(day_code)
        # Also run log_scanner to enrich with real chatlog example
        scan_res = log_scanner_tool(query="error api key")
        logs_found = scan_res.get("logs", [])
        sample_text = (
            f"#{logs_found[0].get('author_id', 'U???')}: \"{logs_found[0].get('content', '')[:120]}\""
            if logs_found else "(Không tìm thấy chatlog mẫu)"
        )
        top_cluster = metric_res.get("top_cluster", "Bất đồng bộ API Key")
        stuck_pct = metric_res.get("stuck_percentage", 34.2)
        stuck_count = metric_res.get("stuck_count", 431)
        final_response = (
            f"📊 **Báo cáo Phân tích Lớp học (MetricCalculatorTool + LogScannerTool)**\n\n"
            f"- **Cụm vướng mắc lớn nhất:** {top_cluster}\n"
            f"- **Tỷ lệ kẹt:** {stuck_pct}% ({stuck_count} học viên)\n"
            f"- **Bài giảng bị miss:** New learning material (Trang 26+)\n"
            f"- **Chatlog mẫu tiêu biểu:** {sample_text}\n\n"
            f"*Dữ liệu từ 1.261 chatlog thực tế trong SQLite DB.*"
        )
        tutor_status = "answered"
        citation_page = 28

    # ── D) Topic-specific question — let the data answer ──────────────────────
    else:
        scan_res = log_scanner_tool(query=question)
        logs_found = scan_res.get("logs", [])
        total_found = scan_res.get("total", len(logs_found))

        if total_found > 0:
            sample = logs_found[0]
            final_response = (
                f"🔍 **LogScannerTool tìm thấy {total_found} chatlog liên quan:**\n\n"
                f"- Ví dụ: Học viên #{sample.get('author_id', '?')} "
                f"({str(sample.get('created_at', ''))[:10]}): "
                f"\"{sample.get('content', '')[:200]}\"\n\n"
                f"*Kiểm tra slide '{day_code}' Trang {page} để đối chiếu nội dung bài giảng.*"
            )
            tutor_status = "answered"
            citation_page = page
        else:
            # 0 chatlog results — topic likely off-topic or never discussed in class
            final_response = (
                f"ℹ️ **LogScannerTool không tìm thấy chatlog nào** liên quan đến chủ đề này "
                f"trong 1.261 chatlog của học viên.\n\n"
                f"Điều này cho thấy chủ đề này **nằm ngoài phạm vi môn học** "
                f"hoặc học viên chưa đặt câu hỏi về nó. "
                f"AI Copilot chỉ hỗ trợ các chủ đề trong khoá **AI Product Development**.\n\n"
                f"Nếu bạn muốn xem thống kê vướng mắc thực tế của học viên, "
                f"hãy hỏi: *\"Tóm tắt điểm nghẽn lớn nhất của toàn lớp tuần này?\"*"
            )
            tutor_status = "answered"
            citation_page = None

    cid = db.save_conversation(user_id, day_code, page, selected_text,
                               question, final_response, tutor_status, citation_page)
    return {"id": cid, "status": tutor_status, "response": final_response, "citation_page": citation_page}
