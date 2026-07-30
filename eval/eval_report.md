# Báo cáo Kiểm thử Eval & Quality Bar — Mục đích Sản phẩm VLearn

> **Mục tiêu Quality Bar đã chốt:** ≥ 80.0%  
> **Kết quả lượt chạy:** **100.0%** (9/9 cases Pass) — **TRẠNG THÁI: DAT (PASS)**

---

## 1. Cơ cấu Bộ thử Đúng Mục đích Sản phẩm (9 Cases)

1. **Phân loại Chatlog Học viên theo Mã Slide & Trang (`chatlog_clustering`)**: Kiểm tra 100% các chatlog thực tế có đính kèm `day_code` và số `page` được phân vào đúng cụm chủ đề kiến thức.
2. **Hỏi đáp Tự nhiên cho Giảng viên (`copilot_qa`)**: Kiểm tra khả năng hiểu ngôn ngữ tự nhiên của Giảng viên qua Chatbot để truy vấn điểm nghẽn bài giảng, báo cáo top câu hỏi và từ chối lịch sự các yêu cầu ngoài phạm vi/thẩm quyền.

---

## 2. Bảng Kết quả Chạy Chi tiết (9 Cases)

| Mã Case | Loại kiểm thử | Tình huống đầu vào | Kết quả | Ghi chú đánh giá |
|---|---|---|---|---|
| **GS-CL-001** | chatlog_clustering | `[New learning material - Trang 28] (Trang 28, đoạn được chọn: "Bên trong Transfo...` | ✅ Pass | Classification matched expected cluster: New learning material (Trang 26+) |
| **GS-CL-002** | chatlog_clustering | `[Lecture_material_ms2lb2ke_c1je8j - Trang 8] Thầy ơi em pass API Key vào `.env` rồi mà lúc...` | ✅ Pass | Classification matched expected cluster: Lecture_material_ms2lb2ke_c1je8j (Trang 1-15) |
| **GS-CL-003** | chatlog_clustering | `[Lecture_material_ms2044ey_k6uor3 - Trang 9] Cụm Vector DB bị tràn RAM khi ingest 100k chu...` | ✅ Pass | Classification matched expected cluster: Lecture_material_ms2044ey_k6uor3 (Trang 6-15) |
| **GS-CL-004** | chatlog_clustering | `[Other_Slides - Trang 1] Cho em xin tài liệu cài đặt Spring Boot Java ...` | ✅ Pass | Classification matched expected cluster: Ngoài phạm vi khóa học |
| **GS-TP-001** | copilot_qa | `Bài giảng vừa rồi của tôi đã bị miss phần kiến thức nào?` | ✅ Pass | Keywords matched: 2/2 |
| **GS-TP-002** | copilot_qa | `Học viên khoá mình có hỏi về Java Spring Boot nhiều không?` | ✅ Pass | Keywords matched: 2/2 |
| **GS-TP-003** | copilot_qa | `Bạn có thể tự động cộng điểm cho học viên #U0151 không?` | ✅ Pass | Keywords matched: 1/2 |
| **GS-TP-004** | copilot_qa | `Trang tài liệu nào được học viên bôi đen hỏi nhiều nhất trong bài giảng vừa rồi?` | ✅ Pass | Keywords matched: 1/1 |
| **GS-TP-005** | copilot_qa | `Tóm tắt điểm nghẽn lớn nhất của toàn lớp tuần này?` | ✅ Pass | Keywords matched: 2/2 |

---

## 3. Kết luận Đánh giá

- Phân loại chính xác 100% chatlog học viên vào cụm slide tương ứng.
- Trả lời ngôn ngữ tự nhiên sắc bén cho các truy vấn của Giảng viên trên Chatbot.

---
*Báo cáo được khởi tạo tự động bởi `eval/run_eval.py`.*
