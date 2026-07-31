# Bài Thu Hoạch Cá Nhân (Individual Reflection)

**Dự án:** VLearn Class Knowledge Gap Map & AI Teacher Copilot

- **Họ và tên:** Ngô Đình Khánh
- **Vai trò trong nhóm:** Frontend Engineer & UI/UX Developer (Phụ trách xây dựng Prototype Dashboard, UI Heatmap Grid & Widget AI Teacher Copilot trong `codebase/`)
- **Mốc tham gia:** Toàn bộ quá trình Hackathon (Từ khởi tạo ý tưởng UI, xây dựng Prototype đến hoàn thiện Demo)

---

## 1. Bối cảnh & Điểm xuất phát của cá nhân

Trong hệ thống **VLearn Class Knowledge Gap Map**, dữ liệu phân cụm từ backend cần được trực quan hóa thành một giao diện trực quan, mượt mà và dễ hiểu để Giảng viên có thể nhận diện ngay lập tức các "điểm nghẽn" (knowledge gaps) của học viên.

Với vai trò **Frontend Engineer & UI/UX Developer**, tôi chịu trách nhiệm chính trong việc hiện thực hóa ý tưởng thiết kế từ Spec thành sản phẩm chạy thực tế (`codebase/index.html`, `codebase/app.js`, `codebase/student.html`), đảm bảo kết hợp hài hòa giữa thẩm mỹ UI, trải nghiệm UX và các nguyên tắc thiết kế AI (HAX/PAIR).

---

## 2. Các công việc & Đóng góp chính cho dự án

### 1. Trực quan hóa "Class Knowledge Gap Map" (Heatmap Grid & Chart View)
- Xây dựng **Heatmap Grid Dashboard** tương tác phân cấp mức độ nghiêm trọng của các cụm lỗ hổng kiến thức với 3 cấp độ cảnh báo màu sắc (High Risk - Đỏ, Medium Risk - Vàng, Low Risk - Xanh).
- Tự động highlight nổi bật các cụm có trên **>30% học viên gặp khó khăn** để Giảng viên lập tức chú ý.
- Hỗ trợ chuyển đổi linh hoạt giữa dạng **Grid View** và **Chart View** giúp theo dõi trực quan xu hướng câu hỏi theo từng khoảng thời gian (7d, 30d, all).

### 2. Phát triển Widget AI Teacher Copilot & Quick Prompts
- Thiết kế và lập trình **AI Chatbot Widget** tương tác thời gian thực cho Giảng viên.
- Tích hợp bộ **Quick Prompts** thông minh ("Bài giảng vừa rồi miss phần nào?", "Top câu hỏi nổ nhiều nhất?", "Học viên hỏi gì nhiều nhất về API Key?") giúp người dùng tương tác với AI chỉ bằng 1-click.
- Xử lý mượt mà trạng thái phản hồi của AI: Hiển thị hiệu ứng gõ chữ (typing indicator), Loading Skeleton và Error Fallback khi kết nối API gián đoạn.

### 3. Hiện thực hóa các nguyên tắc HAX & PAIR Guidelines trên UI
- **HAX 1 (Make clear what the system can do):** Hiển thị trực quan Badge độ tin cậy của AI (AI Confidence Score) giúp người dùng đánh giá mức độ chính xác của cụm.
- **HAX 4 (Show contextual information):** Áp dụng triết lý *Progressive Disclosure* — ẩn các chi tiết chatlog thô phức tạp, chỉ hiển thị thông tin quan trọng nhất lên dashboard; khi Giảng viên click vào cụm mới mở Drawer/Popup xem chi tiết chatlog và gợi ý hành động.
- **PAIR Control (Human-in-the-Loop):** Tích hợp nút **Edit / Rename Topic Title** cho phép Giảng viên ghi đè (override) và chỉnh sửa tên cụm kiến thức nếu AI phân loại chưa chính xác.

### 4. Đấu nối API & Xử lý Client-side State
- Kết nối giao diện Frontend mượt mà với các API backend (`/api/client-logs`, `processed_gap_data.json`, OpenRouter API).
- Viết các hàm xử lý state client-side, debounce các sự kiện tương tác của người dùng và báo cáo lỗi tự động về client-log service (`reportClientError`).
- Xây dựng màn hình xem bổ sung dành cho phía Học viên (`student.html`) và màn hình Quản trị dành cho Giảng viên (`index.html`).

---

## 3. AI hỗ trợ thế nào (AI-Assisted Workflow)

- **Vibe-coding & UI Generation:** Sử dụng AI Assistant (v0.dev / Claude Code / Gemini) để tạo nhanh khung HTML/CSS layout, bộ bảng màu Glassmorphism hiện đại và responsive CSS Grid.
- **Client-side Logic Acceleration:** Dùng AI hỗ trợ viết nhanh các hàm thao tác DOM, các helper function lọc dữ liệu dynamic theo window/scope, và xử lý bất đồng bộ Async/Await.
- **Debugging & Error Handling:** Tận dụng AI để phát hiện và xử lý các trường hợp Unhandled Promise Rejection cũng như tối ưu hóa hiệu năng render DOM khi danh sách chatlog kéo dài.

---

## 4. Thách thức, Case Fail & Bài học kinh nghiệm

### Case Fail (Bẫy vibe-coding & Quá tải thông tin UI)
- **Vấn đề:** Ở phiên bản ban đầu, khi vibe-coding giao diện quá nhanh, tôi đã đưa quá nhiều dữ liệu chi tiết (mã chatlog, timestamp, ID học viên, điểm số thô) lên thẳng màn hình chính. Tại **Checkpoint 2**, khi đưa người dùng thử nghiệm, họ phản hồi là giao diện quá rối mắt và không thể nhận biết ngay cụm rủi ro nào đang "nổ" lớn nhất.
- **Giải pháp:** Tôi đã thiết kế lại hoàn toàn cấu trúc hiển thị theo triết lý *Progressive Disclosure* và HAX Guideline 4. Dashboard chính chỉ giữ lại Heatmap trực quan với màu sắc trực diện và tỉ lệ % học viên bị nghẽn; toàn bộ chi tiết log thô được giấu vào Drawer bên phải chỉ hiển thị khi click.

### Bài học rút ra (Key Takeaways)
1. **Làm sản phẩm AI là làm về UX ra quyết định (Decision-making UX):** AI tạo ra rất nhiều dữ liệu, nhưng giao diện Frontend tốt không phải là show hết dữ liệu AI tạo ra, mà là lọc và hiển thị đúng thông tin giúp người dùng ra quyết định nhanh nhất.
2. **Luôn giữ Human-in-the-Loop trong thiết kế:** Không bao giờ ép người dùng chấp nhận 100% kết quả AI. Việc thêm tính năng Edit/Override tên cụm giúp người dùng làm chủ hệ thống và xây dựng niềm tin lâu dài với sản phẩm AI.

---

## 5. Tự đánh giá & Kết luận

- **Mức độ hoàn thành:** Hoàn thành **100%** khối lượng công việc Frontend & UI Prototype trong `codebase/`, sản phẩm chạy mượt mà, sẵn sàng cho buổi Demo Hackathon.
- **Đóng góp nhóm:** Phối hợp ăn ý với thành viên phụ trách Backend và Spec để biến các ý tưởng thiết kế trên giấy thành trải nghiệm người dùng thực tế ấn tượng.
