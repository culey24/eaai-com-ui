import os
from typing import Optional
import logging
from dotenv import load_dotenv
import requests

load_dotenv()
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s %(name)s:%(filename)s:%(lineno)d %(levelname)s %(process)d %(message)s'
)
logger = logging.getLogger(__name__)

from utils.be_integration import be_integration_headers

from ...service_urls import get_be_server_base_url

BE_SERVER = get_be_server_base_url()


async def set_reminder(user_id: str, reminder_iso: str, message: str) -> str:
    """
    Lưu nhắc việc lên backend. reminder_iso: ISO 8601 (vd. 2026-04-05T08:00:00+07:00).
    """
    try:
        r = requests.post(
            f'{BE_SERVER}/users/{user_id}/reminders',
            json={
                'user_id': user_id,
                'reminder_at': reminder_iso,
                'message': message,
            },
            headers={**be_integration_headers(), 'Content-Type': 'application/json'},
            timeout=30,
        )
        if r.status_code == 201:
            return 'Đã lưu nhắc việc thành công.'
        return f'Lưu nhắc việc thất bại: {r.status_code} {r.text[:500]}'
    except requests.RequestException as e:
        logger.error('set_reminder: %s', e)
        return f'Lỗi kết nối: {e}'


async def list_user_reminders(user_id: str) -> str:
    """Liệt kê nhắc việc đã đăng ký (sắp xếp theo thời gian)."""
    try:
        r = requests.get(
            f'{BE_SERVER}/users/{user_id}/reminders',
            headers=be_integration_headers(),
            timeout=30,
        )
        if r.status_code != 200:
            return f'Không đọc được danh sách: {r.status_code} {r.text[:300]}'
        reminders = r.json().get('reminders') or []
        if not reminders:
            return 'Chưa có nhắc việc nào.'
        lines = []
        for x in reminders:
            lines.append(f"- {x.get('reminder_at')}: {x.get('message')}")
        return '\n'.join(lines)
    except requests.RequestException as e:
        logger.error('list_user_reminders: %s', e)
        return f'Lỗi kết nối: {e}'


async def get_current_schedule(user_id: str) -> Optional[list]:
    """
    Retrieves the user's currently scheduled academic for the specified period.
    """
    try:
        response = requests.get(
            f"{BE_SERVER}/users/{user_id}/schedule",
            headers=be_integration_headers(),
            timeout=30,
        )
        if response.status_code == 200:
            return response.json().get("schedule", [])
        return []
    except requests.RequestException as e:
        logger.error(f"Error retrieving current schedule for user {user_id}: {e}")
        return None
