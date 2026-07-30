# VLearn local working demo

## Chạy ứng dụng

Tại thư mục gốc:

```powershell
python -m pip install -r requirements.txt
.\run-local.ps1
```

Mở:

- Student Portal: <http://127.0.0.1:8000/>
- Admin Topic Map: <http://127.0.0.1:8000/admin>
- Health check: <http://127.0.0.1:8000/api/health>

## Biến môi trường

File `.env` không được commit:

```env
OPENROUTER_API_KEY=...
OPENROUTER_MODEL=openai/gpt-4o-mini

VOYAGE_API_KEY=...
VOYAGE_MODEL=voyage-4-large
VOYAGE_OUTPUT_DIMENSION=1024
VOYAGE_BASE_URL=https://api.voyageai.com/v1
```

Nếu API tạm lỗi, backend chuyển sang local hashed embeddings và extractive
answer để demo không bị dừng. Chạy hoàn toàn local/fallback:

```powershell
$env:DISABLE_EXTERNAL_AI="1"
.\run-local.ps1
```

## Hai nguồn dữ liệu trên Admin

1. `Chatlog thật · Topic`: phân cụm từ cặp `question + tutor_answer` trong
   `chat_history_anonymized_for_hackathon.csv`. Không hiển thị mapping slide vì
   hai PDF demo không phải slide đối chứng của dataset thật.
2. `Slide demo · Theo trang`: dùng 174 hội thoại synthetic tạo từ 58 trang của
   hai PDF demo. UI luôn ghi rõ đây là dữ liệu synthetic và cho mở đúng trang
   PDF từ hội thoại đại diện.

Sinh lại synthetic dataset:

```powershell
python .\scripts\generate_slide_demo_data.py
```

File sinh ra:

`data/vlearn-pack/chatlog/synthetic_chat_history_from_slides.csv`

## Pipeline

- SQLite và PDF upload được lưu tại `data/runtime/` (đã ignore).
- PDF được trích text theo trang bằng `pypdf`.
- Student Tutor dùng Voyage retrieval trên toàn bộ học liệu, không giới hạn ở
  trang đang mở; OpenRouter trả lời theo context và citation được backend kiểm
  tra lại.
- Chat mới được lưu vào SQLite và kích hoạt clustering nền.
- Clustering dùng embedding của toàn bộ `question + selected_text +
  tutor_answer`; OpenRouter chỉ nhận một số hội thoại đại diện để đặt tên cụm.
