# Các idea thay đổi ngày 20/4/2026
## Refactor lại quy tắc ngôn ngữ của @agent-assistant:
- Trên cài đặt của người dùng, khi chọn Tiếng Anh/Tiếng Việt -> sẽ truyền vào tham số tiếng anh/tiếng việt đó cho agent-assistant. Mục đích là xóa bỏ Language rules trong @agents, và khi trả lời ra cuối cùng sẽ dựa vào tham số language đó ví dụ theo kiểu:
```py
f'{language}'
```
Khi setting là tiếng Việt thì sẽ trả lời tiếng Việt, khi setting là tiếng Anh thì sẽ trả lời bằng tiếng anh nhé.

## Fix lại hệ thống AGENT:
- Hãy kiểm tra xem AGENT đã có thể đọc được **journal** của người dùng chưa (journal ở đây là các file người dùng nộp vào các submission, tất nhiên hãy kiểm tra xem đã có logic extract chữ ra trong submission đó chưa nhé). Khi người dùng yêu cầu điều gì đó có liên quan tới kiểm tra cái đó thì sẽ thực thi logic đọc journal VÀ trả lời dựa trên journal của user.
- Kiểm tra xem AGENT có thể đọc được các file gửi trên khung chat ko.

## Bổ sung hệ thống AGENT:
- Thêm AGENT SUGGESTION:
"""Agent: Cập nhật thêm 1 suggestion agent, chỉ ngoi lên khi mà user hỏi về lí thuyết. Kiểm tra xem hiện tại các AGENT đã có trích xuất ra main topic chưa. Thì khi mà người dùng hỏi 1 câu có liên quan tới một số lí thuyết nằm trong file ấy, thì sẽ dựa trên main topic mà đề xuất file pdf (Khi nhấn vào sẽ hiển thị trên web app) hoặc link web uy tín có liên quan cho user. File PDF ở đây như sau:
    - Dựa vào @docs/slide for IS, hãy đọc các file pdf, tạo description và xác định main topic cho từng file pdf đó, sau đó khi mà người dùng hỏi về 1 chủ đề nào đó có liên quan thì sẽ suggest file PDF đó cho người dùng (1 nút trên UI) trong chat đó, khi user nhấn vào thì sẽ hiển thị file pdf lên web app.