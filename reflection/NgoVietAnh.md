# Reflection Cá Nhân — Ngô Việt Anh (Backend System & Infrastructure Lead)

- **Vai trò trong nhóm:** Backend System Lead, chịu trách nhiệm thiết kế kiến trúc Server, tích hợp RAG Retrieval Pipeline, kết nối LLM Provider và hệ thống Fallback tự động.

- **Phần công việc cụ thể:**
  - **Khởi tạo Server & REST API (`server.py`):** Xây dựng hệ thống REST API bằng Starlette + Uvicorn, cấu hình logging middleware (`runtime_logging_middleware`), quản lý CORS và các endpoint phục vụ Student & Admin Portal.
  - **RAG & Vector Retrieval Pipeline:** Tích hợp Voyage AI (`voyage-3.5`/`voyage-4-large`) trích xuất embedding đa trang/đa tài liệu PDF, xây dựng logic parse `citations` chuẩn xác theo từng trang slide và cơ chế focused retry khi model từ chối.
  - **Hệ thống Kháng lỗi & Fallback (Fault Tolerance):** Thiết kế cơ chế tự động chuyển sang `local-hash-v1` và `local-keywords` khi Voyage AI chạm hạn ngạch 429 hoặc OpenRouter bị lỗi định dạng JSON, giúp hệ thống không bao giờ bị sập.
  - **Lưu trữ & Quản lý PDF:** Xây dựng cơ sở dữ liệu SQLite (WAL mode), tích hợp `pypdf` để băm nhỏ và trích xuất nội dung text theo từng trang slide khi giảng viên upload tài liệu mới.

- **AI hỗ trợ thế nào:**
  - Dùng AI Assistant để hỗ trợ tối ưu các đường route xử lý bất đồng bộ (async/await) trong Starlette và sinh code băm bối cảnh RAG hiệu quả.
  - Dùng AI kiểm thử và giả lập các kịch bản lỗi mạng/API 429 để tối ưu hóa luồng fallback.

- **Bài học từ case fail hoặc thách thức:**
  - **Thách thức về Rate Limit API (429):** Khi chạy phân cụm hàng ngàn câu hỏi cùng lúc, Voyage API liên tục trả về lỗi 429. Nhóm đã vượt qua bằng cách xây dựng engine `local-hash-v1` thay thế tức thì, giúp ứng dụng demo hoàn toàn mượt mà mà không phụ thuộc vào độ ổn định của API bên thứ ba.
