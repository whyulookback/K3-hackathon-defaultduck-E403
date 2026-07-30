# Reflection Cá Nhân — Khánh (Frontend Engineer)

- **Vai trò trong nhóm:** Frontend Engineer & UI/UX Developer (phụ trách xây dựng Prototype Dashboard, UI Heatmap Grid & Widget AI Teacher Copilot trong `codebase/`).
- **Phần công việc cụ thể:** 
  - Dựng giao diện tương tác cho "Class Knowledge Gap Map": Trực quan hóa Heatmap các cụm lỗ hổng kiến thức với màu sắc phân cấp mức độ nghiêm trọng (Highlight cụm >30% học viên kẹt).
  - Phát triển UI Component cho AI Teacher Copilot Chatbot với bộ Quick Prompts ("Bài giảng vừa rồi miss phần nào?", "Top câu hỏi nổ nhiều nhất?").
  - Hiện thực hóa các nguyên tắc HAX/PAIR trên giao diện: Hiển thị độ tin cậy của AI (HAX 1), nút Edit/Rename cụm cho phép Giảng viên override kết quả AI (PAIR Control), và các trạng thái Loading Skeleton / Error Fallback.
  - Đấu nối UI với API call AI thật để hiển thị kết quả phân cụm và câu trả lời của Copilot theo thời gian thực.
- **AI hỗ trợ thế nào:** 
  - Dùng AI (v0.dev / Claude Code) để sinh nhanh khung giao diện HTML/CSS và component layout cho Heatmap Grid và Chatbot Widget.
  - Dùng AI hỗ trợ viết các hàm xử lý state client-side, debounce sự kiện người dùng và render dynamic badge theo từng lớp rủi ro.
- **Bài học từ case fail hoặc thách thức:** 
  - **Case fail:** Ban đầu khi vibe-coding UI, tôi ôm đồm hiển thị quá nhiều dữ liệu chi tiết trên cùng một màn hình khiến giao diện bị rối mắt. Tại CP2, người dùng thử nghiệm phản hồi không nhận biết được ngay cụm lỗ hổng nào đang "nổ" số lượng lớn nhất.
  - **Bài học:** Tôi đã áp dụng nguyên tắc HAX 4 (Show contextual information) để tinh giản giao diện: chỉ đưa cụm nóng nhất lên Heatmap chính với sắc màu cảnh báo, ẩn chi tiết chatlog thô vào drawer/popup khi click. Bài học rút ra là làm sản phẩm AI không chỉ là hiển thị kết quả AI, mà phải thiết kế UX giúp người dùng dễ ra quyết định nhất.

