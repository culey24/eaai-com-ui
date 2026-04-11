from typing import Optional
import json
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

from utils.be_integration import be_integration_headers, log_agent_integration_http

from ...invocation_user import merge_invocation_user_id_into_state
from ...service_urls import get_be_server_base_url

BE_SERVER = get_be_server_base_url()

_SESSION_USER_MISSING = (
    'Chưa xác định được tài khoản trong phiên chat (thiếu user_id hợp lệ). '
    'Vui lòng đăng nhập lại hoặc gửi tin nhắn mới từ ứng dụng.'
)


def _valid_session_uid(raw: object) -> Optional[str]:
    if raw is None:
        return None
    s = str(raw).strip()
    if not s or s == 'user':
        return None
    return s


def _session_user_id(tool_context: ToolContext) -> Optional[str]:
    """
    ID user cho API nhắc việc / journal: ưu tiên state['user_id'] từ phiên manager (JWT / tạo phiên),
    sau đó mới tới invocation ADK — tránh gọi BE với placeholder 'user' khi sub-agent có context khác.
    """
    merge_invocation_user_id_into_state(tool_context)
    st = _valid_session_uid(tool_context.state.get('user_id'))
    if st:
        return st
    inv = getattr(tool_context, '_invocation_context', None)
    if inv is not None:
        return _valid_session_uid(getattr(inv, 'user_id', None))
    return None


async def set_reminder(reminder_iso: str, message: str, tool_context: ToolContext) -> str:
    """
    Lưu nhắc việc lên backend cho đúng user đang chat. reminder_iso: ISO 8601 (vd. 2026-04-05T08:00:00+07:00).
    """
    user_id = _session_user_id(tool_context)
    if not user_id:
        return _SESSION_USER_MISSING
    try:
        path = f'/users/{user_id}/reminders'
        r = requests.post(
            f'{BE_SERVER}{path}',
            json={
                'user_id': user_id,
                'reminder_at': reminder_iso,
                'message': message,
            },
            headers={**be_integration_headers(), 'Content-Type': 'application/json'},
            timeout=30,
        )
        log_agent_integration_http(
            'set_reminder', method='POST', path=path, user_id=user_id, status_code=r.status_code
        )
        if r.status_code == 201:
            return 'Đã lưu nhắc việc thành công.'
        if r.status_code == 400:
            try:
                body = r.json()
                err = str(body.get('error') or body.get('message') or '')
            except Exception:
                err = (r.text or '')[:400]
            return (
                'Lưu nhắc thất bại: máy chủ từ chối yêu cầu (400). '
                f'Chi tiết: {err or r.text[:300]}'
            )
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
        path = f'/users/{user_id}/reminders'
        r = requests.get(
            f'{BE_SERVER}{path}',
            headers=be_integration_headers(),
            timeout=30,
        )
        log_agent_integration_http(
            'list_reminders', method='GET', path=path, user_id=user_id, status_code=r.status_code
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
        path = f'/users/{user_id}/journal-status'
        r = requests.get(
            f'{BE_SERVER}{path}',
            headers=be_integration_headers(),
            timeout=30,
        )
        log_agent_integration_http(
            'journal_status', method='GET', path=path, user_id=user_id, status_code=r.status_code
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


_MAX_JOURNAL_CONTEXT_CHARS = 80_000


async def read_journal_submissions_content(tool_context: ToolContext) -> str:
    """
    Đọc văn bản đã trích từ các bài journal user đã nộp trên hệ thống (API journal-context).
    Dùng khi cần nội dung/file submission đã upload — **không** dùng learning_history hay bảng học phụ.
    """
    user_id = _session_user_id(tool_context)
    if not user_id:
        return _SESSION_USER_MISSING
    try:
        path = f'/users/{user_id}/journal-context'
        r = requests.get(
            f'{BE_SERVER}{path}',
            headers=be_integration_headers(),
            timeout=45,
        )
        log_agent_integration_http(
            'journal_context', method='GET', path=path, user_id=user_id, status_code=r.status_code
        )
        if r.status_code != 200:
            return f'Không đọc được nội dung journal đã nộp: {r.status_code} {r.text[:400]}'
        ctx = r.json().get('journal_context') or ''
        text = str(ctx).strip()
        if not text:
            return 'Người học chưa có bản journal nào trên server (hoặc chưa trích được văn bản).'
        if len(text) > _MAX_JOURNAL_CONTEXT_CHARS:
            return (
                text[:_MAX_JOURNAL_CONTEXT_CHARS]
                + f'\n\n… (đã cắt còn {_MAX_JOURNAL_CONTEXT_CHARS} ký tự)'
            )
        return text
    except requests.RequestException as e:
        logger.error('read_journal_submissions_content: %s', e)
        return f'Lỗi kết nối khi đọc journal đã nộp: {e}'


async def get_active_journal_periods() -> str:
    """
    Lấy danh sách các đợt nộp journal đang diễn ra hoặc sắp tới từ hệ thống.
    Dùng để thông báo cho người dùng về hạn nộp submission.
    """
    try:
        path = '/journal-periods'
        r = requests.get(
            f'{BE_SERVER}{path}',
            headers=be_integration_headers(),
            timeout=30,
        )
        log_agent_integration_http(
            'journal_periods', method='GET', path=path, user_id=None, status_code=r.status_code
        )
        if r.status_code != 200:
            return (
                f'Không lấy được danh sách đợt nộp từ máy chủ (HTTP {r.status_code}). '
                f'Bạn có thể xem lịch đợt nộp trên trang Journal trong ứng dụng. Chi tiết: {r.text[:200]}'
            )
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
        return (
            'Không kết nối được máy chủ để lấy danh sách đợt nộp. '
            f'Xem thử trang Journal trên ứng dụng. ({e})'
        )


async def get_current_schedule(tool_context: ToolContext) -> str:
    """
    Lấy lịch học (schedule) của user đang chat từ backend; trả JSON dạng chuỗi cho LLM.
    """
    user_id = _session_user_id(tool_context)
    if not user_id:
        logger.warning('get_current_schedule: missing session user_id')
        return _SESSION_USER_MISSING
    try:
        path = f'/users/{user_id}/schedule'
        response = requests.get(
            f'{BE_SERVER}{path}',
            headers=be_integration_headers(),
            timeout=30,
        )
        log_agent_integration_http(
            'schedule', method='GET', path=path, user_id=user_id, status_code=response.status_code
        )
        if response.status_code == 200:
            data = response.json().get('schedule', [])
            return json.dumps(data, ensure_ascii=False)
        return f'[]  # HTTP {response.status_code}'
    except requests.RequestException as e:
        logger.error('Error retrieving current schedule for user %s: %s', user_id, e)
        return f'Lỗi kết nối khi lấy lịch học: {e}'
