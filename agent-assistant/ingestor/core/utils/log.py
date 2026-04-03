import logging
import colorlog
import os
import sys


LOG_COLORS = {
    'DEBUG': 'yellow',
    'INFO': 'green',
    'WARNING': 'bold_yellow', # Màu cam (yellow) đậm
    'ERROR': 'red',
    'CRITICAL': 'bold_red',
}


def logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s %(name)s:%(filename)s:%(lineno)d %(levelname)s %(process)d %(message)s'
):
    """
    Cấu hình logger chính với màu sắc, chỉ tô màu cho LEVELNAME.
    """
    
    # 1. Định nghĩa chuỗi định dạng log mới
    # %(log_color)s%(levelname)s%(reset)s là phần TÔ MÀU CHO LEVELNAME
    LOG_FORMAT = (
        "%(asctime)s %(name)s:%(filename)s:%(lineno)d "
        "%(log_color)s%(levelname)s%(reset)s "
        "%(process)d %(message)s"
    )

    # 2. Lấy logger gốc
    root_logger = logging.getLogger()
    root_logger.setLevel(logging.INFO) 

    # 3. Tạo Formatter có màu
    formatter = colorlog.ColoredFormatter(
        LOG_FORMAT,
        datefmt='%Y-%m-%d %H:%M:%S', # Định dạng thời gian tiêu chuẩn
        log_colors=LOG_COLORS,
        # Không cần secondary_log_colors vì chỉ tô màu levelname
        secondary_log_colors={}, 
        style='%'
    )

    # 4. Xóa handlers cũ nếu có
    if root_logger.hasHandlers():
        # Xóa handlers cũ khỏi logger gốc (rất quan trọng)
        for handler in root_logger.handlers[:]:
             root_logger.removeHandler(handler)

    # 5. Tạo Stream Handler
    stream_handler = logging.StreamHandler(sys.stdout)
    stream_handler.setFormatter(formatter)

    # 6. Thêm handler vào logger
    root_logger.addHandler(stream_handler)



