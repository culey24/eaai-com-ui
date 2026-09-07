import re
from datetime import datetime, timezone
from pathlib import Path
 
 
CURRENT_DIR = Path(__file__).parent
DATA_FOLDER = CURRENT_DIR.parent.parent / "data"
DATA_FOLDER.mkdir(parents=True, exist_ok=True)
UPLOADED_DATA_FOLDER = DATA_FOLDER / "uploaded_data"
UPLOADED_DATA_FOLDER.mkdir(parents=True, exist_ok=True)
 
 
def timestamp_to_datetime(ts):
    """
    Chuyển đổi Unix timestamp (float/int) sang đối tượng datetime.
    Hỗ trợ cả giây (10 chữ số) và miligiây (13 chữ số).
    """
    if not ts:
        return None
 
    if ts > 1e11:
        ts /= 1000
 
    return datetime.fromtimestamp(ts, tz=timezone.utc)
 
 
def clean_llm_json(raw_response):
    """
    Hàm này giúp lọc bỏ các ký tự thừa (như ```json ... ```)
    mà LLM thường thêm vào để lấy đúng chuỗi JSON.
    """
    json_match = re.search(r'\{.*\}', raw_response, re.DOTALL)
    if json_match:
        return json_match.group(0)
    return raw_response
