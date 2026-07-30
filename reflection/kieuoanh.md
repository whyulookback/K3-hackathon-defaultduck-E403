# Bài Thu Hoạch Cá Nhân (Individual Reflection)

**Dự án:** VLearn Class Knowledge Gap Map & AI Teacher Copilot

- **Họ và tên:** Oanh
- **Vai trò trong nhóm:** Spec (Phụ trách Biên soạn AI Product Spec, Quality Bar & Guardrails)
- **Mốc tham gia:** Giai đoạn Checkpoint 4 (CP4 - Chốt tiến độ Spec & Quality Bar)

---

## 1. Bối cảnh & Điểm xuất phát của cá nhân

Tham gia cùng nhóm từ đầu giờ chiều Ngày 1 đúng vào mốc **Checkpoint 4 (CP4 - Chốt hạn nộp cứng AI Spec 23:59)**, tôi chủ động nhận trách nhiệm đóng vai trò **Spec / Product Spec Author**.

Đây là mắt xích cực kỳ then chốt vì theo Rubric chấm điểm, tài liệu **spec.md** quyết định đến **56/75 điểm** bài nộp (bao gồm các mục **R1 - Bằng chứng & Impact, R2 - Thiết kế lát cắt, R3 - Chỗ khó & Kịch bản rủi ro, R4 - Kiểm thử & Quality Bar**).

---

## 2. Các công việc & Đóng góp chính cho dự án

### Chuẩn hóa & Biên soạn AI Product Spec (`spec.md`)

- Tổng hợp dữ liệu khai phá từ **2.522 dòng chatlog** ẩn danh của VLearn để đưa vào mục **§1 & §2 (Problem Statement & Data Evidence)**, chứng minh bài toán: *"Học viên bị nghẽn kiến thức nhưng Giảng viên không có góc nhìn toàn cảnh"*.
- Thiết kế chi tiết **§3 & §4 (Feature Slice & Agent Architecture)**, quy định rõ cơ chế hoạt động của bộ **3 Agent Tools**:
  - `LogScannerTool`
  - `MetricCalculatorTool`
  - `SlideOCRSearchTool`

### Xây dựng Kịch bản Rủi ro & Chống Lỗi (Guardrails & Fallback - §5, §6)

- Định nghĩa các kịch bản:
  - AI trả lời sai (hallucination).
  - API quá tải.
  - Chatlog rỗng.
- Đưa nguyên tắc **Human-in-the-Loop (HAX/PAIR)** vào Spec:
  - Cho phép Giảng viên override/chỉnh sửa tên cụm kiến thức do AI gom nhóm tự động.
- Xây dựng cơ chế **Transparency & Grounding**:
  - Bắt buộc mọi phản hồi của AI Copilot phải kèm trích dẫn chính xác:
    - Tên bài giảng.
    - Slide trang #X.
    - Nội dung OCR.

### Thiết lập Quality Bar & Bộ tiêu chí kiểm thử (§7)

- Chốt **Quality Bar** cho dự án trước **23:59 Ngày 1**:
  - Độ chính xác Slide OCR Grounding: **≥ 80%**
  - Thời gian phản hồi: **≤ 3s**
  - **0%** thông tin giả lập ngoài dữ liệu bài giảng.
- Phối hợp với team Dev xây dựng bộ **Golden Set gồm 25 mẫu câu test** trong thư mục `eval/`.

---

## 3. Bài học về Tư duy Sản phẩm AI (Key Takeaways)

Qua quá trình biên soạn AI Spec cho dự án, tôi rút ra **3 bài học đắt giá** về mặt tư duy sản phẩm:

### 1. Spec là một "Hợp đồng sống" (Living Contract), không phải tài liệu tĩnh

AI Spec không chỉ là văn bản lý thuyết mà là kim chỉ nam cho Dev build codebase và Tester đo lường. Mọi điểm thiết kế trong Spec phải truy vết được ra file code và file `eval` tương ứng.

### 2. Thiết kế AI phải bắt đầu từ "Điểm gãy" (Designing for Failure)

AI không bao giờ đạt độ chính xác **100%**. Một AI Spec xuất sắc phải định nghĩa rõ:

- Khi AI đoán sai thì giao diện xử lý thế nào?
- Khi API sập thì fallback ra sao?
- Khi user muốn can thiệp thì cho họ sửa ở đâu?

### 3. Bằng chứng dữ liệu (Data-driven Evidence) quan trọng hơn cảm tính

Việc trích dẫn con số cụ thể (**34.2%** kẹt ở API Key, **1.542** tin nhắn học viên) giúp Spec thuyết phục hoàn toàn về mặt Impact so với việc viết chung chung.

---

## 4. Tự đánh giá & Lời cảm ơn

### Đánh giá mức độ hoàn thành nhiệm vụ

Hoàn thành **100%** cấu trúc `spec.md` theo template `03-template-ai-spec.md`, đáp ứng đầy đủ các tiêu chí chấm điểm từ **R1 đến R4** trong Rubric.

### Phối hợp nhóm

Đóng vai trò cầu nối giữa bài toán người dùng và kỹ thuật Dev, giúp cả team giữ vững **Quality Bar** và đúng tiến độ cho **CP5 & CP6**.

### Lời cảm ơn

Cảm ơn các đồng đội đã nỗ lực làm việc ăn ý, giúp nhóm chuyển hóa trọn vẹn bản Spec trên giấy thành một Prototype chạy thật vô cùng ấn tượng!