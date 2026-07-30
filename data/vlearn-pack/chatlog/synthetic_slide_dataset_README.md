# Synthetic slide Q&A dataset

File: `synthetic_chat_history_from_slides.csv`

Dataset này được tạo tự động từ 58 trang của:

- `d1-slide-hackathon.pdf`
- `d2-slide-hackathon.pdf`

Mỗi trang có 3 cặp hỏi–đáp synthetic theo các intent `explain`, `why` và
`apply`, tổng cộng 174 dòng. Đây không phải hội thoại của học viên thật và
không được dùng làm evidence về mức độ quan tâm thực tế của lớp.

## Mục đích

- Demo clustering có mapping về `slide_filename` và `page_number`.
- Kiểm tra UI Topic Map theo slide khi dataset chatlog thật không có slide đối
  chứng.
- Kiểm tra luồng click cluster → xem hội thoại đại diện → mở trang PDF.

## Field

| Field | Ý nghĩa |
|---|---|
| `sample_id` | ID synthetic duy nhất |
| `source` | Luôn là `synthetic_slide` |
| `is_synthetic` | Luôn là `true` |
| `slide_filename` | PDF nguồn |
| `page_number` | Trang PDF nguồn, đánh số từ 1 |
| `topic_hint` | Cụm nội dung ngắn trích từ trang |
| `intent` | Kiểu câu hỏi synthetic |
| `user_id` | ID synthetic, không đại diện người thật |
| `conversation_id` | ID hội thoại synthetic |
| `question` | Câu hỏi được tạo |
| `tutor_answer` | Câu trả lời có đoạn grounding từ trang |
| `created_at` | Timestamp demo |

Sinh lại dataset:

```powershell
python scripts/generate_slide_demo_data.py
```
