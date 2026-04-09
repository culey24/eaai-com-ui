from typing import Optional
import logging
from dotenv import load_dotenv
import requests

from google.adk.tools import ToolContext

load_dotenv()
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s %(name)s:%(filename)s:%(lineno)d %(levelname)s %(process)d %(message)s'
)
logger = logging.getLogger(__name__)

from utils.be_integration import be_integration_headers

from ...service_urls import get_be_server_base_url

BE_SERVER = get_be_server_base_url()

_SESSION_USER_MISSING = (
    'Chưa xác định được tài khoản trong phiên chat (thiếu user_id hợp lệ). '
    'Vui lòng đăng nhập lại hoặc gửi tin nhắn mới từ ứng dụng.'
)


def _session_user_id(tool_context: ToolContext) -> Optional[str]:
    """
    ID user cho API nhắc việc / journal: ưu tiên user_id của Session ADK (khớp URL tạo phiên / JWT),
    không tin state['user_id'] trước vì state có thể lệch sau sub-agent hoặc bị ghi đè.
    """
    inv = getattr(tool_context, '_invocation_context', None)
    if inv is not None:
        sid = getattr(inv, 'user_id', None)
        if sid is not None:
            s = str(sid).strip()
            if s and s != 'user':
                return s
    raw = tool_context.state.get('user_id')
    if raw is None:
        return None
    uid = str(raw).strip()
    if not uid or uid == 'user':
        return None
    return uid


async def set_reminder(reminder_iso: str, message: str, tool_context: ToolContext) -> str:
    """
    Lưu nhắc việc lên backend cho đúng user đang chat. reminder_iso: ISO 8601 (vd. 2026-04-05T08:00:00+07:00).
    """
    user_id = _session_user_id(tool_context)
    if not user_id:
        return _SESSION_USER_MISSING
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
        if r.status_code == 404:
            try:
                body = r.json()
                err = str(body.get('error') or '')
            except Exception:
                err = ''
            if 'Không tìm thấy' in err or 'not found' in err.lower():
                return (
                    'Lưu nhắc thất bại: máy chủ không tìm thấy user này trong CSDL '
                    '(thường do BE_SERVER_BASE_URL của agent khác môi trường với app đăng nhập, '
                    'hoặc tài khoản chưa tồn tại trên DB đó). Kiểm tra biến môi trường backend của stack agent.'
                )
        return f'Lưu nhắc việc thất bại: {r.status_code} {r.text[:500]}'
    except requests.RequestException as e:
        logger.error('set_reminder: %s', e)
        return f'Lỗi kết nối: {e}'


async def list_user_reminders(tool_context: ToolContext) -> str:
    """Liệt kê nhắc việc đã đăng ký (sắp xếp theo thời gian) cho user đang chat."""
    user_id = _session_user_id(tool_context)
    if not user_id:
        return _SESSION_USER_MISSING
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


async def get_user_journal_status(tool_context: ToolContext) -> str:
    """
    Kiểm tra trạng thái nộp journal của user cho từng đợt đang diễn ra hoặc sắp tới.
    Trả về danh sách đợt kèm thông tin đã nộp hay chưa, ngày nộp và tên file (nếu có).
    """
    user_id = _session_user_id(tool_context)
    if not user_id:
        return _SESSION_USER_MISSING
    try:
        r = requests.get(
            f'{BE_SERVER}/users/{user_id}/journal-status',
            headers=be_integration_headers(),
            timeout=30,
        )
        if r.status_code != 200:
            if r.status_code == 404:
                try:
                    body = r.json()
                    err = str(body.get('error') or '')
                except Exception:
                    err = ''
                if 'Không tìm thấy' in err or 'not found' in err.lower():
                    return (
                        'Không đọc được trạng thái nộp bài: máy chủ không tìm thấy user trong CSDL '
                        '(thường do BE_SERVER_BASE_URL của agent trỏ khác môi trường với app đăng nhập, '
                        'hoặc tài khoản không tồn tại trên DB đó). Kiểm tra biến môi trường backend của agent.'
                    )
            return f'Không đọc được trạng thái journal: {r.status_code} {r.text[:300]}'
        statuses = r.json().get('journal_status') or []
        if not statuses:
            return 'Hiện không có đợt nộp journal nào đang diễn ra hoặc sắp tới.'
        lines = []
        submitted_count = sum(1 for s in statuses if s.get('submitted'))
        not_submitted_count = len(statuses) - submitted_count
        lines.append(
            f'Tổng {len(statuses)} đợt nộp — đã nộp: {submitted_count}, chưa nộp: {not_submitted_count}.\n'
        )
        for s in statuses:
            title = s.get('title') or s.get('period_id', '')
            ends = s.get('ends_at', '')
            if s.get('submitted'):
                submitted_at = s.get('submitted_at', '')
                file_name = s.get('file_name') or ''
                file_info = f' (file: {file_name})' if file_name else ''
                lines.append(f'✓ [{title}] — Đã nộp lúc {submitted_at}{file_info}. Hạn: {ends}')
            else:
                lines.append(f'✗ [{title}] — Chưa nộp. Hạn: {ends}')
        return '\n'.join(lines)
    except requests.RequestException as e:
        logger.error('get_user_journal_status: %s', e)
        return f'Lỗi kết nối khi kiểm tra trạng thái journal: {e}'


async def get_active_journal_periods() -> str:
    """
    Lấy danh sách các đợt nộp journal đang diễn ra hoặc sắp tới từ hệ thống.
    Dùng để thông báo cho người dùng về hạn nộp submission.
    """
    try:
        r = requests.get(
            f'{BE_SERVER}/journal-periods',
            headers=be_integration_headers(),
            timeout=30,
        )
        if r.status_code != 200:
            return f'Không đọc được danh sách đợt nộp: {r.status_code} {r.text[:300]}'
        periods = r.json().get('periods') or []
        if not periods:
            return 'Hiện không có đợt nộp journal nào đang diễn ra hoặc sắp tới.'
        lines = []
        for p in periods:
            title = p.get('title') or p.get('period_id', '')
            desc = f" — {p['description']}" if p.get('description') else ''
            starts = p.get('starts_at', '')
            ends = p.get('ends_at', '')
            lines.append(f"- [{title}]{desc}: bắt đầu {starts}, hạn nộp {ends}")
        return 'Các đợt nộp journal hiện tại:\n' + '\n'.join(lines)
    except requests.RequestException as e:
        logger.error('get_active_journal_periods: %s', e)
        return f'Lỗi kết nối khi lấy đợt nộp journal: {e}'


async def get_current_schedule(tool_context: ToolContext) -> Optional[list]:
    """
    Retrieves the current user's academic schedule (classes) from the backend.
    """
    user_id = _session_user_id(tool_context)
    if not user_id:
        logger.warning('get_current_schedule: missing session user_id')
        return []
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
        logger.error('Error retrieving current schedule for user %s: %s', user_id, e)
        return None
