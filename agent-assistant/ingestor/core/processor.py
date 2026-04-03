import csv
import json
import logging
import os
import re
from pathlib import Path
from typing import Optional

import pandas as pd
from dotenv import load_dotenv

from ingestor.core.db_url import get_psycopg2_kwargs
from ingestor.core.file_reader import FileReader
from ingestor.core.postgresql_database import PostgreSQLDatabase
from ingestor.core.summarizer import Summarizer
from ingestor.core.utils.types import (
    COLUMN_MAPPING,
    CRAWLED_DATA_FOLDER,
    create_filename,
    parse_json,
)

load_dotenv()
logger = logging.getLogger(__name__)


class BaseProcessor:
    def __init__(self, data_directory: Path | None = None):
        self.db = self._get_db_connector()
        self.data_dir = data_directory

    def _get_db_connector(self):
        return PostgreSQLDatabase(**get_psycopg2_kwargs())

    def _find_latest_file(self, file_type):
        latest_timestamp = ''
        latest_file = None
        pattern = re.compile(f'^{file_type}_(\\d{{8}}_\\d{{6}})\\.csv$')
        try:
            for filename in os.listdir(self.data_dir):
                match = pattern.match(filename)
                if match:
                    ts = match.group(1)
                    if ts > latest_timestamp:
                        latest_timestamp = ts
                        latest_file = os.path.join(self.data_dir, filename)
        except FileNotFoundError as e:
            raise Exception(f"Directory '{self.data_dir}' not found") from e
        return latest_file


class WebProcessor(BaseProcessor):
    def __init__(self, data_directory: Path = CRAWLED_DATA_FOLDER):
        super().__init__(data_directory)
        self.table_map = {
            'major': 'majors',
            'subject': 'subjects',
            'major_subject': 'major_subject',
        }

    def _read_csv(self, filepath, columns):
        try:
            data_df = pd.read_csv(filepath)
            if data_df.empty:
                logger.error('File %s is empty.', filepath)
                return []
            data_df = data_df.fillna('')
            data = data_df[columns]
            return data.to_dict('records')
        except Exception as e:
            logger.error('Error reading CSV %s: %s', filepath, e)
            return None

    def _insert_data(self, table_name, data, column_mapping):
        if not data or not column_mapping:
            return False

        params_list = []
        for row_dict in data:
            try:
                row_values = []
                for col in column_mapping:
                    val = row_dict.get(col, None)
                    if val == '' or str(val).lower() == 'nan':
                        val = None
                    if col == 'outline':
                        if val is not None:
                            if isinstance(val, (dict, list)):
                                val = json.dumps(val, ensure_ascii=False)
                            elif isinstance(val, str):
                                val = parse_json(val)
                        else:
                            val = None
                    row_values.append(val)
                params_list.append(tuple(row_values))
            except KeyError as e:
                logger.warning('Skip row %s: %s', row_dict, e)
                continue

        if not params_list:
            return False

        if not self.db.connect():
            return False

        try:
            if table_name == 'majors':
                q = (
                    'INSERT INTO majors (major_code, major_name) VALUES (%s, %s) '
                    'ON CONFLICT (major_code) DO UPDATE SET '
                    'major_name = EXCLUDED.major_name'
                )
                return self.db.execute_many_query(q, params_list)
            if table_name == 'subjects':
                q = (
                    'INSERT INTO subjects (subject_code, subject_name, level_id, credits, outline) '
                    'VALUES (%s, %s, %s, %s, %s) ON CONFLICT (subject_code) DO UPDATE SET '
                    'subject_name = EXCLUDED.subject_name, '
                    'level_id = EXCLUDED.level_id, '
                    'credits = EXCLUDED.credits, '
                    'outline = COALESCE(EXCLUDED.outline, subjects.outline)'
                )
                return self.db.execute_many_query(q, params_list)
            if table_name == 'major_subject':
                dedup = []
                seen = set()
                for t in params_list:
                    if len(t) < 2:
                        continue
                    key = (t[0], t[1])
                    if key in seen:
                        continue
                    seen.add(key)
                    dedup.append((t[0], t[1], t[0], t[1]))
                q = (
                    'INSERT INTO major_subject (major_code, subject_code) '
                    'SELECT %s, %s WHERE NOT EXISTS ('
                    'SELECT 1 FROM major_subject ms '
                    'WHERE ms.major_code = %s AND ms.subject_code = %s)'
                )
                return self.db.execute_many_query(q, dedup) if dedup else True
            logger.error('Unknown table %s', table_name)
            return False
        finally:
            self.db.close()

    def process(self, file_type):
        try:
            latest_filepath = self._find_latest_file(file_type)
            if not latest_filepath:
                return False
            data_to_insert = self._read_csv(latest_filepath, COLUMN_MAPPING[file_type])
            if not data_to_insert:
                return False
            if not self._insert_data(
                self.table_map[file_type], data_to_insert, COLUMN_MAPPING[file_type]
            ):
                return False
            logger.info('Synced %s to DB', self.table_map[file_type])
            return True
        except Exception as e:
            logger.error('process %s: %s', file_type, e)
            return False


def _maybe_sync_csv_to_db(data_dir: Path) -> None:
    if os.getenv('INGESTOR_SYNC_DB', '1').strip().lower() in ('0', 'false', 'no'):
        return
    wp = WebProcessor(data_dir)
    for ft in ('major', 'subject', 'major_subject'):
        try:
            if wp.process(ft):
                logger.info('INGESTOR: pushed %s', ft)
        except Exception as e:
            logger.warning('INGESTOR sync %s: %s', ft, e)


class FileProcessor(BaseProcessor):
    def __init__(self, data_directory: Path = CRAWLED_DATA_FOLDER):
        super().__init__(data_directory)
        self.summarizer = Summarizer(data_directory=data_directory)

    def _create_data_file(self, file_type, data):
        output_file = self.data_dir / f'{file_type}_{create_filename("csv")}'
        if isinstance(data, dict):
            df = pd.DataFrame([data])
        elif isinstance(data, list):
            df = pd.DataFrame(data)
        elif isinstance(data, pd.DataFrame):
            df = data
        else:
            return None
        try:
            df.to_csv(output_file, index=False, encoding='utf-8')
            return os.path.abspath(output_file)
        except Exception as e:
            logger.error('save csv failed: %s', e)
            return None

    def _update_data_file(self, file_path: str, updated_data: dict) -> None:
        try:
            if not file_path or not os.path.exists(file_path):
                self._create_data_file('subject', [updated_data])
                return
            df = pd.read_csv(file_path, encoding='utf-8', on_bad_lines='skip')
            outline_val = updated_data.get('outline')
            if isinstance(outline_val, (dict, list)):
                updated_data['outline'] = json.dumps(outline_val, ensure_ascii=False)
            target_code = updated_data.get('subject_code')
            target_name = updated_data.get('subject_name')
            condition = (df['subject_code'] == target_code) & (df['subject_name'] == target_name)
            if condition.any():
                df.loc[condition, 'outline'] = updated_data.get('outline')
            else:
                df = pd.concat([df, pd.DataFrame([updated_data])], ignore_index=True)
            df.to_csv(file_path, index=False, encoding='utf-8')
        except Exception as e:
            logger.error('_update_data_file: %s', e)
            raise

    def _save_data_file(self, file_path, data) -> None:
        file_exists = os.path.isfile(file_path)
        fieldnames = data[0].keys()
        with open(file_path, mode='a', encoding='utf-8', newline='') as csvfile:
            writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
            if not file_exists:
                writer.writeheader()
            writer.writerows(data)

    def _handle_training_program(
        self, file_path: str, major_code: str, major_name: str, level_id: str
    ):
        major_latest = self._find_latest_file('major')
        _m = {'major_name': major_name, 'major_code': major_code}
        if not major_latest:
            major_latest = self._create_data_file('major', [_m])
        else:
            self._save_data_file(major_latest, [_m])

        reader = FileReader(file_path)
        df = reader.extract_text(level_id=level_id)
        if df is None or df.empty:
            raise ValueError(f'Unable to read Excel: {file_path}')

        subjects_data = []
        for _, row in df.iterrows():
            subjects_data.append({
                'subject_code': row.get('subject_code'),
                'subject_name': row.get('subject_name'),
                'credits': row.get('credits'),
                'outline_link': row.get('outline_link'),
                'outline': row.get('outline'),
                'level_id': row.get('level_id'),
            })

        subj_latest = self._find_latest_file('subject')
        if not subj_latest:
            self._create_data_file('subject', subjects_data)
        else:
            self._save_data_file(subj_latest, subjects_data)

        _maybe_sync_csv_to_db(self.data_dir)
        return f'{len(subjects_data)} subjects have been loaded from the training program.'

    def _handle_course_outline(
        self, file_path: str, subject_code: str, subject_name: str, level_id: str
    ):
        reader = FileReader(file_path)
        raw_text = reader.extract_text(level_id=level_id)
        subject_code = Path(file_path).stem
        if not raw_text or len(raw_text.strip()) < 10:
            raise ValueError(f'Outline too short for {subject_code}')
        summary_result = self.summarizer._summarize_content(raw_text)
        if not summary_result:
            raise RuntimeError(f'LLM failed to summarize {subject_code}')
        if isinstance(summary_result, dict):
            outline_store = json.dumps(summary_result, ensure_ascii=False)
        else:
            outline_store = str(summary_result)

        updated = {
            'subject_code': subject_code,
            'subject_name': subject_name or subject_code,
            'credits': 0,
            'outline_link': None,
            'outline': outline_store,
            'level_id': level_id,
        }
        subj_latest = self._find_latest_file('subject')
        if not subj_latest:
            self._create_data_file('subject', [updated])
        else:
            self._update_data_file(subj_latest, updated)

        _maybe_sync_csv_to_db(self.data_dir)
        return f'The summary for {subject_code} has been updated.'

    def process_file(
        self,
        file_path: str,
        level_id: str = 'DH',
        major_code: Optional[str] = None,
        major_name: Optional[str] = None,
        subject_code: Optional[str] = None,
        subject_name: Optional[str] = None,
    ):
        ext = Path(file_path).suffix.lower()
        try:
            if ext in ('.xlsx', '.xls'):
                if not major_code:
                    raise ValueError('major_code required for training program')
                return self._handle_training_program(file_path, major_code, major_name or '', level_id)
            if ext in ('.pdf', '.docx', '.doc'):
                return self._handle_course_outline(file_path, subject_code or '', subject_name or '', level_id)
            raise ValueError(f'Unsupported format {ext}')
        finally:
            if self.db:
                try:
                    self.db.close()
                except Exception:
                    pass
