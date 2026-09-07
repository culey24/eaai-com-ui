import os
import re
from pathlib import Path
import logging
from datetime import datetime
import shutil
import json
import ast

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s %(name)s:%(filename)s:%(lineno)d %(levelname)s %(process)d %(message)s'
)
logger = logging.getLogger(__name__)


CURRENT_DIR = Path(__file__).parent
DATA_FOLDER = CURRENT_DIR.parent.parent.parent / "data"
DATA_FOLDER.mkdir(parents=True, exist_ok=True)
CRAWLED_DATA_FOLDER = DATA_FOLDER / "crawled_data"
CRAWLED_DATA_FOLDER.mkdir(parents=True, exist_ok=True)
DOWNLOADED_DATA_FOLDER = DATA_FOLDER / "downloaded_data"
DOWNLOADED_DATA_FOLDER.mkdir(parents=True, exist_ok=True)
UPLOADED_DATA_FOLDER = DATA_FOLDER / "uploaded_data"
UPLOADED_DATA_FOLDER.mkdir(parents=True, exist_ok=True)

COLUMN_MAPPING = {
    "major": ["major_code", "major_name"],
    "subject": ["subject_code", "subject_name", "level_id", "credits", "outline"],
    "major_subject": ["major_code", "subject_code"]
}


def get_full_path(file_path: str) -> Path:
    """
    Get the full path for a given file_path.
    """
    return os.path.abspath(file_path)


def create_filename(extension: str) -> str:
    """
    Create a filename by datetime stamp.
    """
    return f"{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.{extension}"


def get_file_path(filename: str, directory: Path) -> Path:
    """
    Get the file path in the directory.
    """
    return directory / filename


def copy_file(root_file: Path, target_file: Path) -> bool:
    """
    Copy the contents and permissions of the file from root_file to target_file.
    If the target file (target_file) already exists, it will be overwritten.
 
    Parameters:
        root_file (Path): Path to the source file (must exist).
        target_file (Path): Path to the destination file.
 
    Returns:
        bool: True if the copy was successful, False if an error occurred.
    """
    try:
        # 1. Kiểm tra file nguồn có tồn tại không
        if not os.path.exists(root_file):
            logger.error(f"Error: Source file does not exist at '{root_file}'")
            return False

        # 2. Thực hiện sao chép
        # shutil.copy sao chép nội dung và quyền (permissions)
        # shutil.copy2 sao chép nội dung, quyền và metadata (thời gian)
        shutil.copy2(root_file, target_file)

        logger.info(f"Successfully copied from '{root_file}' to '{target_file}'")

        # 3. Delete root_file
        os.remove(root_file)
        logger.info(f"Successfully deleted source file '{root_file}'")
 
        return True

    except FileNotFoundError:
        # Lỗi này chỉ nên xảy ra nếu root_file không tồn tại, nhưng đã được kiểm tra ở trên.
        logger.error(f"File Not Found. Error during copying: {root_file}")
        return False

    except Exception as e:
        logger.error(f"Unspecified error while copying file: {e}")
        return False


def clean_llm_json(raw_response):
    """
    Hàm này giúp lọc bỏ các ký tự thừa (như ```json ... ```)
    mà LLM thường thêm vào để lấy đúng chuỗi JSON.
    """
    json_match = re.search(r'\{.*\}', raw_response, re.DOTALL)
    if json_match:
        return json_match.group(0)
    return raw_response


def parse_json(outline_raw):
    try:
        outline_json = json.dumps(json.loads(outline_raw))
        return outline_json
    except json.JSONDecodeError:
        try:
            python_dict = ast.literal_eval(outline_raw)
            return json.dumps(python_dict)
        except Exception as e:
            logger.error(f"Unable to parse outline: {e}")
            return None
