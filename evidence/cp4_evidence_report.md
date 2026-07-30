# CP4 Evidence Report — Survey + VLearn chatlog

Ngày phân tích: 30/07/2026

Nguồn:

- `labcoach.csv`
- `student.csv`
- `data/vlearn-pack/chatlog/chat_history_anonymized_for_hackathon.csv`

Chạy lại:

```powershell
C:\Users\ADMIN\anaconda3\envs\action\python.exe evidence\analyze_cp4_evidence.py
```

## 1. Đường A — khảo sát người thật ngoài nhóm

Nhóm xác nhận toàn bộ người trả lời survey là người ngoài nhóm.

### Quy mô và kiểm soát chất lượng

- `labcoach.csv`: 11 phản hồi, gồm Mentor, TA, TA Leader và giảng viên.
- `student.csv`: 11 phản hồi.
- Tổng thô: 22 phản hồi ngoài nhóm.
- Một phản hồi học viên ghi khóa học là `123`; không xác nhận được là K3 nên
  loại khỏi con số chính.
- Tổng hợp lệ dùng cho bằng chứng: **21 người**.
- Hai dòng Labcoach chọn đồng thời nhiều mức tần suất ở câu lẽ ra nên chọn một
  mức; vẫn tính là xác nhận vấn đề vì đều chứa `Thỉnh thoảng`/`Thường
  xuyên`/`Luôn luôn`.
- Một số dòng chọn quá 3 mục ở câu “chọn tối đa 3”; các thống kê sở thích vì
  vậy chỉ dùng định hướng thiết kế, không dùng làm con số chứng minh chính.
- Header định dạng báo cáo bị lặp câu chữ nhưng dữ liệu cột vẫn đọc được.

### Cách xác định “xác nhận vấn đề”

Primary user được hỏi:

> Anh/chị có gặp khó khăn trong việc xác định học viên đang gặp vấn đề ở đâu
> không?

Tính là xác nhận nếu câu trả lời chứa `Thỉnh thoảng`, `Thường xuyên` hoặc
`Luôn luôn`: **11/11** Labcoach.

Học viên được hỏi:

> Sau mỗi buổi học, bạn có thường xuyên còn nội dung chưa hiểu không?

Với 10 học viên K3 hợp lệ, tính theo cùng ngưỡng: **9/10** học viên.

Kết hợp hai phía của cùng workflow:

> **20/21 người hợp lệ (95,2%) xác nhận vấn đề.**

Nếu giữ cả dòng `123`, kết quả thô là 21/22 (95,5%).

### Nhu cầu sử dụng

- **10/11 Labcoach (90,9%)** trả lời “Có” với công cụ tự động phân tích chatlog
  và chỉ ra 3–5 chủ đề/lỗ hổng lớn nhất.
- **9/11 học viên (81,8%)** trả lời “Có” hoặc “Cần thử nghiệm trước” với tính
  năng AI mới.
- 7/11 học viên cho biết đã dùng AI Tutor khi gặp khó khăn.

### Thông tin và định dạng Labcoach muốn

| Nhu cầu | Số người chọn |
|---|---:|
| Những chủ đề học viên hỏi nhiều nhất | 9/11 |
| Mức độ khó của từng chủ đề | 7/11 |
| Nhóm học viên đang gặp khó khăn | 7/11 |
| Những lỗi phổ biến nhất | 4/11 |
| Đề xuất nội dung cần giảng lại | 1/11 |

| Định dạng | Số người chọn |
|---|---:|
| Biểu đồ | 9/11 |
| Dashboard | 7/11 |
| Báo cáo văn bản | 7/11 |
| Heatmap | 5/11 |
| Email tổng hợp | 2/11 |

Kết luận thiết kế: Topic Map + biểu đồ + evidence phù hợp hơn việc tự động tạo
slide hoặc gửi email.

## 2. Đường B — đếm trên chatlog

### Quy mô

- 2.522 message.
- 1.261 student message và 1.261 tutor message.
- 1.261 turn hỏi–đáp.
- 585 conversation.
- 369 user ẩn danh.

### Con số chính

> **582/1.261 tutor message (46,2%) có trường `citations` rỗng hoặc bằng `[]`.**

Cách đếm:

1. Đọc CSV bằng UTF-8.
2. Lọc `role == "tutor"`.
3. Tính là không có citation nếu trường `citations` sau khi `strip()` thuộc
   `{"", "[]", "{}", "null", "None"}`.
4. Chia cho tổng 1.261 tutor message.

Con số này đo **traceability gap**, không khẳng định cả 582 câu đều sai. Một số
câu là lời chào/từ chối hợp lệ không cần nguồn; tuy nhiên nhiều câu trả lời kiến
thức vẫn không mang citation để học viên kiểm tra.

### Tín hiệu grounding

**1.252/1.261 student message (99,3%)** có marker `(Trang N, ...)`. Điều này cho
thấy ngữ cảnh trang là tín hiệu phổ biến và hỗ trợ quyết định xây Tutor
page-aware thay vì chatbot chung.

### Năm ví dụ citation rỗng để đối chứng

| `turn_id` | Đầu vào rút gọn | Kết quả quan sát |
|---|---|---|
| `T0014` | Hỏi về key takeaways của LLM/Transformer ở trang 81 | Tutor giải thích kiến thức nhưng `citations=[]`. |
| `T0036` | Hỏi rủi ro rule-based bot, LLM chatbot và agent ở trang 8 | Tutor báo không tìm thấy bảng so sánh; `citations=[]`. |
| `T0065` | Xin ví dụ bot rule, LLM chatbot, reactive agent ở trang 9 | Tutor đưa ví dụ thực tế; `citations=[]`. |
| `T0128` | Hỏi “VLearn Lecture Material” ở trang 1 là gì | Tutor khẳng định nguồn gốc/tính xác thực; `citations=[]`. |
| `T1261` | Hỏi kỹ cơ chế Transformer từ đoạn được chọn ở trang 32 | Tutor giải thích self-attention; `citations=[]`. |

Các dòng trên có thể kiểm tra lại bằng `turn_id` trong file gốc.

## 3. Kết luận cho CP4

- Tick **A — Đã khảo sát người thật**: đạt 21 phản hồi hợp lệ ngoài nhóm,
  20/21 xác nhận vấn đề.
- Tick **B — Đã phân tích dữ liệu**: có phép đếm tái lập, mẫu số rõ ràng, 5 ví
  dụ và script đi kèm.
- Con số nên điền form: trình bày cả **20/21 (95,2%)** và
  **582/1.261 (46,2%)** vì A chứng minh nhu cầu, B chứng minh traceability gap
  tồn tại trong dữ liệu sử dụng thật.
