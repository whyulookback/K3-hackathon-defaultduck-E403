# Hướng Dẫn Cấu Hình API Key Cho VLearn AI Project

Tài liệu này hướng dẫn chi tiết từng bước lấy và thiết lập các API Key cho dự án **VLearn Tutor & Topic Interest Map** để chạy với mô hình AI thực tế (OpenRouter GPT-4o-mini & Voyage AI Embeddings).

---

## 1. Các API Key Cần Thiết

| API Key | Công dụng trong dự án | Trang web đăng ký lấy Key |
|---|---|---|
| **`OPENROUTER_API_KEY`** | Gọi mô hình `openai/gpt-4o-mini` để suy luận trả lời Tutor RAG và phân loại `answered` / `insufficient_context` / `out_of_scope` | [openrouter.ai/keys](https://openrouter.ai/keys) |
| **`VOYAGE_API_KEY`** | Gọi mô hình `voyage-4-large` (1024 chiều) để vector hóa câu hỏi & bài giảng | [dash.voyageai.com/api-keys](https://dash.voyageai.com/api-keys) |

> 💡 **Ghi chú:** Dự án tích hợp sẵn **Chế độ Fallback Tự Động (Local Engine)**. Nếu bạn chưa có API Key, hệ thống sẽ tự động dùng Local Hashed Embedding & Local Extractive Tutor Engine mà không gây gián đoạn chương trình.

---

## 2. Bước 1: Tạo File `.env` Trong Thư Mục Gốc

Tạo (hoặc chỉnh sửa) file có tên `.env` tại thư mục gốc của dự án `d:\DocVInAI\Batch03-K3-AI-Product-Hackatho\.env`.

Dán các dòng cấu hình sau vào file `.env`:

```env
# OpenRouter API Key (GPT-4o-mini)
OPENROUTER_API_KEY=sk-or-v1-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# OpenRouter Model Settings
OPENROUTER_MODEL=openai/gpt-4o-mini
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1

# Voyage AI API Key (voyage-4-large 1024-dim)
VOYAGE_API_KEY=pa-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Day 04 Lab Environment Override (Tuy chon)
DAY04_ENV_FILE=.env
```

---

## 3. Bước 2: Kiểm Tra Nạp Môi Trường

Chạy câu lệnh sau trong terminal để kiểm tra kết nối API Key:

```powershell
python -c "from env_loader import load_lab_env; import os; load_lab_env('.'); print('OPENROUTER_API_KEY configured:', bool(os.getenv('OPENROUTER_API_KEY'))); print('VOYAGE_API_KEY configured:', bool(os.getenv('VOYAGE_API_KEY')))"
```

Nếu kết quả trả về `True` nghĩa là API Key đã được nạp thành công!

---

## 4. Bảo Mật An Toàn Với GitHub

File `.env` chứa thông tin mật mã bí mật của bạn. File này đã được thêm vào `.gitignore` để **tuyệt đối không bị commit hoặc push lên GitHub**. 

Nếu bạn nhỡ tay push API key lên GitHub, GitHub sẽ tự động vô hiệu hóa key đó để bảo vệ tài khoản của bạn.
