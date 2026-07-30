# Reflection Cá Nhân — Đường Minh Quân (Agent & Data Architecture Lead)

- **Thông tin cá nhân:** Đường Minh Quân — Mã số học viên: `2A202601903`
- **Vai trò trong nhóm:** thiết kế hệ thống Agent Tools, xử lý dữ liệu chatlog thực tế, viết thuật toán phân cụm
theo mã slide và trang

- **Phần công việc cụ thể:**
  - **Thiết kế Agent với các Tools tự động:** Phát triển kiến trúc AI Agent bao gồm `LogScannerTool` (tự động quét & nạp chatlog mới), `MetricCalculatorTool` (tính toán độ nghiêm trọng & tỉ lệ kẹt kiến thức), và `SlideOCRSearchTool` (RAG Context Grounding khớp nội dung OCR slide).
  - **Phân cụm dữ liệu theo Mã Slide & Trang:** Xử lý 1.261 chatlog thực tế (`chat_history_anonymized_for_hackathon.csv`), loại bỏ nhiễu và phân cụm chính xác theo **Mã Slide (`day_code`) + Khoảng trang (`citations/Trang X`)** dựa trên cấu trúc bài giảng thay vì gom cụm ngữ nghĩa rời rạc.

- **AI hỗ trợ thế nào:**
  - Sử dụng AI Coding Assistant để hỗ trợ tối ưu các biểu thức Regex trích xuất chính xác chỉ số trang (`Trang X-Y`) từ 1.261 dòng chatlog tự do.
  - Hỗ trợ viết Prompt System cho AI Copilot đóng vai trò Trợ lý Giảng viên.
- **Bài học từ case fail hoặc thách thức:**
  - **Thách thức 1 (Tái định hình Logic Gom Cụm):** Ban đầu hệ thống định phân cụm thuần ngữ nghĩa theo từ khóa, nhưng kết quả cho thấy Giảng viên không biết rõ học viên đang kẹt ở trang slide nào của buổi học. Nhóm đã điều chỉnh thuật toán sang gom cụm theo **Mã Slide (`day_code`) + Khoảng trang**, giúp Giảng viên ngay lập tức nhận biết lỗ hổng kiến thức thuộc trang slide nào để chuẩn bị giáo án cho buổi Live Session tiếp theo.

