- Các data được cung cấp thêm:
    - Chi tiết về slide bài giảng dưới dạng các chunk doc.
    - Cung cấp một số FAQ đúng
Phân cấp lại logic agent như sau:

- Cấp 1: FAQ Search
Thực hiện search trên FAQ để trả lời nhanh nếu có thông tin.

- Cấp 2: Agentic Call + Document Search.
Thực hiện Document search + Agent calls.

**Đã triển khai (Cấp 1):** **FAQ Agent** trong `agent-assistant` — FAQ lưu **bảng `faq_entries`** (PostgreSQL), Python đọc qua **`GET /faq`** (agent integration); embedding **OpenRouter** (hoặc fastembed fallback), cosine ≥ ngưỡng → trả lời trước ADK. CRUD admin: **`/api/admin/faq`**.


