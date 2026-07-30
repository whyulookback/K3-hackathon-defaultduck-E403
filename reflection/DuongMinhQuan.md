# Reflection Cá Nhân — Đường Minh Quân (Data Architecture & Clustering Lead)

- **Thông tin cá nhân:** Đường Minh Quân — Mã số học viên: `2A202601903`
- **Vai trò trong nhóm:** Data Architecture & Prompt Engineer, chịu trách nhiệm xây dựng thuật toán phân cụm liên tục (Continuous Clustering), thiết kế System Prompt và xử lý tách cụm out-of-scope.

- **Phần công việc cụ thể:**
  - **Thuật toán Phân cụm Liên tục (Continuous Clustering Engine):** Phát triển tiến trình chạy nền 20s kết hợp Voyage embedding với Spherical K-Means để gom cụm ngữ nghĩa `question + selected_text + tutor_answer` tự động khi có dữ liệu chatlog mới.
  - **Tách cụm Out-of-scope (Lọc nhiễu):** Thiết kế logic lọc `tutor_status == out_of_scope`, phân tách các câu hỏi về học phí, deadline, link slide vào cụm "Ngoài phạm vi khóa học" riêng biệt, giúp dữ liệu phân tích chuyên môn của giảng viên luôn sạch.
  - **Prompt Engineering & AI Labeling:** Thiết kế System Prompts cho `gpt-4o-mini` để tự động đặt tên cụm (5-7 từ), tóm tắt tín hiệu chính, tính độ nghiêm trọng (Severity: CRITICAL, HIGH, MEDIUM, LOW) và đề xuất lộ trình giảng dạy bổ trợ (AI Recommendation).
  - **Human-in-the-loop & Cache Management:** Xây dựng API và cơ chế cache lưu đè tên cụm khi Giảng viên/TA đổi tên thủ công (`rename_cluster`) hoặc đưa cụm vào agenda buổi sau.

- **AI hỗ trợ thế nào:**
  - Dùng AI Coding Assistant để hỗ trợ viết và tinh chỉnh các biểu thức Regex bóc tách trang slide từ 1.261 dòng chatlog tự do.
  - Dùng AI kiểm thử và tối ưu độ dài Prompt để giảm thiểu tối đa rủi ro OpenRouter trả về JSON ngắt chuỗi.

- **Bài học từ case fail hoặc thách thức:**
  - **Thách thức về gom cụm dữ liệu:** Ban đầu nếu gom cụm thuần ngữ nghĩa câu hỏi, các câu hỏi hậu cần (deadline, link) sẽ bị hòa lẫn vào cụm kiến thức làm giảng viên bị rối. Việc tách riêng luồng `out_of_scope` dựa trên trạng thái trả lời của Tutor giúp bản đồ tri thức cực kỳ sạch sẽ và mang lại giá trị thực tế cao.
