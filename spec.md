# AI SPEC — Class Knowledge Gap Map · Nhóm VLearn AI · Zone K3

**Hướng:** [x] A — VLearn  [ ] B — Trợ lý Học viên  [ ] C — Làn mở  
**Loại:** [x] Tính năng AI mới  

---

## §1. User & Job

- **Job executor + workflow:**  
  - Giảng viên chính (người soạn slide/giáo án cho các buổi học tiếp theo) và Trợ giảng Leader (TA Leader — người chịu trách nhiệm điều phối hỗ trợ, giải đáp thắc mắc cho 1.000 học viên).  
  - Workflow hiện tại: Trước mỗi buổi Live (tuần 2 lần), Giảng viên hỏi TA hoặc lướt kênh Discord/VLearn Chatlog -> TA đọc lướt hàng trăm tin nhắn thô -> Giảng viên đoán định lỗ hổng bằng cảm tính -> Soạn bài giảng -> Giảng live -> Phát hiện học viên vẫn nộp bài tập lỗi ở phần căn bản.
- **Core JTBD:**  
  Khi chuẩn bị giáo án cho lớp học đông người, người vận hành khóa học muốn biết chính xác những điểm nghẽn kiến thức lớn nhất của cả lớp theo thời gian thực để tối ưu nội dung giảng dạy bổ trợ đúng mục tiêu.
- **Problem statement:**  
  Giảng viên và TA Leader hoàn toàn "mù" thông tin về các rào cản tư duy thực sự của 1.000 học viên do quá tải khối lượng chatlog thô, dẫn đến việc dạy bài mới theo giáo án cố định trong khi đa số học viên đang bị kẹt ở kỹ năng cũ.
- **Evidence (chuẩn A & B):**  
  - **Số liệu mining / khảo sát:** Hệ thống ghi nhận trung bình **1.542 câu hỏi/tuần** gửi về AI Tutor. Thử lọc tay trong 1 tuần: Có tới **342 câu hỏi (22.2%)** kẹt ở lỗi "Bất đồng bộ khi gọi API Key".  
  - **Trích dẫn nguyên văn chatlog:**  
    1. *"Thầy ơi em pass API Key vào `.env` rồi mà lúc gọi `async await` toàn báo `401 Unauthorized` là sao ạ?"*  
    2. *"Sao em chạy local thì được mà up lên VLearn server thì API Key bị undefined ạ?"*  
    3. *"Cho em hỏi async function trong JS xử lý API Key header khác gì sync function ạ?"*  
    4. *"Em bị leak API key trên github commit, giờ reset key xong code python async bị timeout?"*  
    5. *"TA hỗ trợ em với, em sửa API Key theo slide mà vẫn lỗi connection closed?"*  
  - **Con số lãng phí:** Giảng viên dành 45 phút buổi live stream tuần tiếp theo để dạy Prompt Chaining (chỉ có 8.5% học viên hỏi), bỏ qua vấn đề API Key Async khiến 34% học viên nộp bài tập lớn trễ deadline.

---

## §2. Impact & quyết định chọn

- **Bảng impact 3 ứng viên tính năng:**

| Ứng viên tính năng | Đối tượng x Tần suất | Tốn gì mỗi lần | Điểm khả thi AI | Tổng Impact |
|---|---|---|---|---|
| 1. Class Knowledge Gap Map + AI Copilot (Chọn) | 1 Giảng viên + 3 TA x 2 lần/tuần x 1.000 HV | 6 giờ TA tổng hợp thủ công + 45 phút dạy sai trọng tâm | Rất cao (Clustering + RAG Chatbot Copilot) | **RẤT CAO (Đội ngũ vận hành khóa học & tỷ lệ pass bài tập)** |
| 2. AI Auto-Grading Essay | 3 TA x 1 lần/tuần x 1.000 HV | 15 giờ chấm bài viết dài | Trung bình (Cost & Hallucination risk) | Trung bình |
| 3. Smart Forum Search | 1.000 HV x 5 lần/tuần | 10 phút tìm kiếm/lần | Cao | Trung bình |

- **Ứng viên ĐÃ LOẠI + vì sao:**  
  - Loại *AI Auto-Grading Essay* vì chi phí API cao, rủi ro đánh giá sai bài viết sáng tạo làm học viên khiếu nại.  
  - Loại *Smart Forum Search* vì đã có tính năng RAG cơ bản của VLearn AI Tutor giải quyết câu hỏi đơn lẻ.
- **Ứng viên CHỌN + vì sao (bằng số):**  
  Chọn **Class Knowledge Gap Map + AI Copilot Chatbot** vì giải quyết đúng điểm đau lớn nhất của người vận hành: tiết kiệm **6 giờ/tuần** cho TA Leader, cứu **342+ học viên** khỏi nguy cơ fail bài tập lớn, tăng tỷ lệ hoàn thành khóa học từ 65% lên 88%.

---

## §3. Giải pháp tương tự đã nghiên cứu

- **Coursera Instructor Analytics:** Có biểu đồ tỷ lệ hoàn thành quiz, nhưng thiếu phân tích định tính ngữ nghĩa chatlog tự do.
- **Discourse Word Cloud:** Chỉ đếm tần suất từ khóa đơn lẻ (word frequency), không gom cụm được ý nghĩa (ví dụ "API Key" và "401 Unauthorized" bị tách rời).
- **Điểm khác biệt của VLearn Gap Map & AI Copilot:** Gom cụm theo vector embedding ngữ nghĩa (Semantic Clustering), trực quan Heatmap rào cản tư duy và cho phép Giảng viên đối thoại trực tiếp với **AI Teacher Copilot** để hỏi điểm lệch bài giảng ("Miss chỗ nào?"), top câu hỏi nổ nhiều nhất và sinh Quiz kiểm tra nhanh.

---

## §4. Thiết kế

- **Lát cắt MỘT CÂU:**  
  *Khi Giảng viên chuẩn bị bài giảng cho lớp 1.000 người, họ muốn biết chính xác 3–5 lỗ hổng kiến thức lớn nhất và đối thoại với AI Copilot để xem bài giảng bị miss phần nào, những câu hỏi nào được hỏi nhiều nhất, và AI giúp gom cụm ngữ nghĩa, xếp hạng mức độ nghẽn kèm đề xuất bài học cụ thể.*
- **Non-goals (3 thứ KHÔNG build):**  
  1. Không tự động sửa bài tập hay gửi email nhắc nhở từng học viên cá nhân (giữ phạm vi ở cấp độ toàn lớp).  
  2. Không tự động tạo slide presentation hoàn chỉnh (chỉ đưa ra gợi ý khung giáo án bổ trợ & Quiz nhanh).  
  3. Không can thiệp vào điểm số hay đánh giá cá nhân của học viên.
- **Mức prototype nhắm tới:** `[x] Mock / Working` — Phần UI Dashboard Heatmap, Chatbot Copilot & Clustering visual chạy thật trên client; phần AI Re-clustering có lời gọi API thật hoặc fallback mock dataset mượt mà.
- **Automation level:** `[x] Augment (Human-in-the-loop)` — AI đề xuất cụm lỗ hổng, câu hỏi nhiều nhất và giải đáp thắc mắc cho Giảng viên; Giảng viên/TA có quyền duyệt, sửa tên cụm, đổi thứ tự ưu tiên hoặc bấm "Đưa vào Slide Live".

### §4b. Nguyên tắc HAX/PAIR đã áp dụng

| Nguyên tắc HAX/PAIR | Áp cụ thể vào đâu trong prototype |
|---|---|
| **HAX 1: Set expectations** | Hiển thị rõ tỷ lệ tin cậy của AI clustering (ví dụ: "Độ chính xác gom cụm 92% dựa trên 1.542 chatlog"). |
| **HAX 4: Show contextual information** | Click vào từng khối Heatmap hoặc hỏi AI Copilot sẽ trích dẫn ngay các câu hỏi chatlog thô nguyên văn làm bằng chứng. |
| **HAX 11: Make clear why system did what it did** | AI Copilot giải thích rõ vì sao chỉ ra bài giảng bị "miss": so sánh giữa chủ đề bài giảng cũ (Prompt Chaining) và 342 câu kẹt lỗi thực tế (API Key Async). |
| **PAIR: Control & Feedback** | Cho phép Giảng viên đối thoại trực tiếp với Copilot bằng các Quick Prompts ("Miss phần nào?", "Top câu hỏi?") và override tên cụm khi cần. |

---

## §5. Kiểu lỗi — 4 lớp chỗ khó + kịch bản (8 case)

| Lớp chỗ khó | Mã Kịch bản | Tình huống đầu vào | Hành vi mong muốn của Hệ thống |
|---|---|---|---|
| **① Failure (Rác/Sai)** | SC-01 | Chatlog chứa câu hỏi ngoài lề (ví dụ: "Hôm nay ăn gì?", "Thầy mấy tuổi?") | Phân loại vào cụm `Noise / Out of Scope` (Xám), không đưa vào Gap Map. |
| **① Failure (Thiếu)** | SC-02 | Chatlog quá ngắn ("Lỗi rồi", "Không chạy được") | Gom vào cụm `Chưa đủ ngữ cảnh` và gợi ý TA phản hồi làm rõ. |
| **② Low confidence** | SC-03 | Câu hỏi nằm ở ranh giới giữa Prompt Chaining và API Key | Hiển thị nhãn `Tương quan kép (Dual Topic)` và cho phép Giảng viên gán thủ công. |
| **② Low confidence** | SC-04 | Dữ liệu chatlog chỉ có 5 câu hỏi mới xuất hiện | Hiển thị cảnh báo: *"Cụm mới hình thành (<10 câu hỏi), chưa đủ đại diện cho toàn lớp"*. |
| **③ Out of scope** | SC-05 | Học viên hỏi về công nghệ ngoài giáo trình (Spring Boot Java) | AI gắn nhãn `Ngoại lệ (Out of Curriculum)` để Giảng viên cân nhắc bỏ qua. |
| **③ Out of scope** | SC-06 | Học viên xin hỗ trợ tài khoản học phí VLearn | Chuyển hướng tín hiệu sang Bộ phận Hỗ trợ Vận hành thay vì đưa vào Gap Map. |
| **④ Domain edge case** | SC-07 | Học viên dùng thuật ngữ viết tắt tự chế ("dùng key rỏm bị ăn con 401") | AI Vector Embedding nhận diện đồng nghĩa ngữ nghĩa với "Invalid API Key Error". |
| **④ Domain edge case** | SC-08 | Giảng viên hỏi AI Copilot: "Bài giảng bị miss phần nào?" | AI Copilot đối chiếu dữ liệu chatlog 1.542 câu với agenda cũ và trả về phân tích sai lệch. |

---

## §6. Bốn đường đi của trải nghiệm

- **Happy path:** Giảng viên mở Dashboard -> Thấy Heatmap khối màu đỏ `Bất đồng bộ API Key (34.2%)` -> Mở **AI Copilot** bấm chip *"Bài giảng vừa rồi của tôi bị miss phần nào?"* -> AI phân tích bài giảng đã bỏ qua lỗi dotenv/async làm 342 học viên kẹt -> Giảng viên bấm nút *"Đưa vào Slide Live"* -> AI tự sinh 3 câu hỏi Quiz ôn tập.
- **Low-confidence path (②):** Cụm kiến thức mới có độ tin cậy 65% -> AI Copilot ghi nhận "Cần kiểm tra" -> Giảng viên hỏi Copilot *"Top câu hỏi ở cụm này là gì?"* -> Copilot liệt kê 3 chatlog tiêu biểu để Giảng viên xác nhận.
- **Failure path (①):** Dữ liệu chatlog bị nhiễu do tin nhắn nhắn rác -> AI phân loại vào cụm "Nhiễu" -> Giảng viên hỏi Copilot *"Tóm tắt các tin nhắn không thuộc chuyên môn"* -> Copilot xuất báo cáo lọc rác.
- **Correction path (User sửa):** AI đặt tên cụm là "Lỗi Python Syntax" -> Giảng viên thấy chưa sát, sửa thành "Lỗi thiếu Virtual Environment khi import SDK" -> Copilot ghi nhận và lưu mẫu tên mới.

---

## §7. Kiểm thử & Quality Bar

- **Chiều chất lượng:**
  1. **Cluster Purity (Độ thuần của cụm):** ≥85% câu hỏi trong cụm thuộc cùng 1 bản chất rào cản tư duy.
  2. **Title Relevance (Độ sát của tên cụm):** Giảng viên thật đánh giá tên cụm đặt có dễ hiểu và chính xác không (thang 1-5, đạt ≥4.0).
  3. **Copilot Query Precision (Độ chuẩn xác của Copilot):** Copilot trả lời đúng ngữ cảnh bài giảng bị miss và top câu hỏi (đạt ≥90%).
- **Golden Set (20 case trong `eval/golden_set.json`):**  
  - 10 case chatlog thật trích từ dataset VLearn.  
  - 4 case nhiễu / out of scope.  
  - 4 case đồng nghĩa dùng thuật ngữ khác nhau.  
  - 2 case truy vấn hỏi AI Copilot.
- **Quality Bar (Chốt 23:59 N1):**  
  *"Đạt khi ≥ 85% case trong Golden Set được phân đúng cụm lỗ hổng tương ứng, và AI Copilot giải đáp đúng 100% câu hỏi về điểm miss bài giảng."*

---

## §8. Phân công & Kế hoạch

- **Phân công có tên:**
  - `spec.md`: Khánh (Product Spec)
  - `evidence`: Hoàng Anh (Data)
  - `prompt`: Quân (Prompt Eng)
  - `codebase`: Thúy (Frontend) & Việt Anh (Backend)
  - `validation`: Oanh (QA & User Test)
- **Willing users (3 Mentor/Giảng viên thử nghiệm):**  
  1. Thầy Nguyễn Văn A (Giảng viên VLearn AI Course)  
  2. Anh Trần Văn B (TA Leader Lớp K3)  
  3. Chị Lê Thị C (Course Operations Manager)

---

## §9. Changelog

| Thời điểm | Đổi gì | Vì sao |
|---|---|---|
| N1 11:30 | Khởi tạo Draft v1 cho Checkpoint 2 | Thống nhất Canvas 7 dòng & Thiết kế Dashboard tương tác |
| N1 11:08 | Tích hợp tính năng AI Teacher Copilot Chatbot | Cho phép Giảng viên truy vấn trực tiếp bài giảng bị miss & top câu hỏi |
