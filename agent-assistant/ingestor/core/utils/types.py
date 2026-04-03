"""Đường dẫn data — root = agent-assistant/ (cha của ingestor/)."""
import ast
import json
import logging
import os
import re
import shutil
from datetime import datetime
from pathlib import Path

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s %(name)s:%(filename)s:%(lineno)d %(levelname)s %(process)d %(message)s',
)
logger = logging.getLogger(__name__)

# agent-assistant/ingestor/core/utils/types.py → parents[3] = agent-assistant
_REPO_ROOT = Path(__file__).resolve().parents[3]
DATA_FOLDER = _REPO_ROOT / 'data'
DATA_FOLDER.mkdir(parents=True, exist_ok=True)
CRAWLED_DATA_FOLDER = DATA_FOLDER / 'crawled_data'
CRAWLED_DATA_FOLDER.mkdir(parents=True, exist_ok=True)
DOWNLOADED_DATA_FOLDER = DATA_FOLDER / 'downloaded_data'
DOWNLOADED_DATA_FOLDER.mkdir(parents=True, exist_ok=True)
UPLOADED_DATA_FOLDER = DATA_FOLDER / 'uploaded_data'
UPLOADED_DATA_FOLDER.mkdir(parents=True, exist_ok=True)

COLUMN_MAPPING = {
    'major': ['major_code', 'major_name'],
    'subject': ['subject_code', 'subject_name', 'level_id', 'credits', 'outline'],
    'major_subject': ['major_code', 'subject_code'],
}


def create_filename(extension: str) -> str:
    return f"{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.{extension}"


def get_file_path(filename: str, directory: Path) -> Path:
    return directory / filename


def copy_file(root_file: Path, target_file: Path) -> bool:
    try:
        if not os.path.exists(root_file):
            logger.error("Source file does not exist at '%s'", root_file)
            return False
        shutil.copy2(root_file, target_file)
        os.remove(root_file)
        return True
    except Exception as e:
        logger.error('copy_file failed: %s', e)
        return False


def clean_llm_json(raw_response: str) -> str:
    json_match = re.search(r'\{.*\}', raw_response, re.DOTALL)
    if json_match:
        return json_match.group(0)
    return raw_response


def parse_json(outline_raw):
    try:
        return json.dumps(json.loads(outline_raw))
    except json.JSONDecodeError:
        try:
            python_dict = ast.literal_eval(outline_raw)
            return json.dumps(python_dict)
        except Exception as e:
            logger.error('Unable to parse outline: %s', e)
            return None
