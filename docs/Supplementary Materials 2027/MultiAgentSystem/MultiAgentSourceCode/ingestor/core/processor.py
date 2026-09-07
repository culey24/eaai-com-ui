import os
import re
import csv
import json
from pathlib import Path
from typing import List, Optional, Tuple, Union
import logging
import pandas as pd
from dotenv import load_dotenv

from .file_reader import FileReader
from .summarizer import Summarizer
from .postgresql_database import PostgreSQLDatabase
from .queries import insert_subject, update_subject_outline
from .utils.types import (
    CRAWLED_DATA_FOLDER, COLUMN_MAPPING, UPLOADED_DATA_FOLDER, parse_json, create_filename
)

load_dotenv()
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s %(name)s:%(filename)s:%(lineno)d %(levelname)s %(process)d %(message)s'
)
logger = logging.getLogger(__name__)


class BaseProcessor:

    def __init__(self, data_directory: Path = None):
        self.db = self._get_db_connector()
        self.data_dir = data_directory

    def _get_db_connector(self):
        return PostgreSQLDatabase(
            host=os.getenv('POSTGRES_HOST', 'localhost'),
            port=int(os.getenv('POSTGRES_PORT', "5432")),
            user=os.getenv('POSTGRES_USER', 'postgres'),
            password=os.getenv('POSTGRES_PASSWORD', 'password'),
            database=os.getenv('POSTGRES_DB', 'test_db')
        )

    def _find_latest_file(self, file_type):
        """
        Find the latest file for a type (major or subject) in the data_dir directory.
        """
        latest_timestamp = ""
        latest_file = None

        pattern = re.compile(f"^{file_type}_(\d{{8}}_\d{{6}})\.csv$")

        try:
            for filename in os.listdir(self.data_dir):
                match = pattern.match(filename)
                if match:
                    timestamp = match.group(1)  # (Example: "20251028_121511")
                    # Direct string comparison works fine for YYYYMMDD format
                    if timestamp > latest_timestamp:
                        latest_timestamp = timestamp
                        latest_file = os.path.join(self.data_dir, filename)

        except FileNotFoundError:
            raise Exception(f"Error: Directory '{self.data_dir}' not found")
        except Exception as e:
            raise Exception(f"Error while scanning directory: {e}")

        if latest_file:
            logger.info(f"Found latest {file_type} file: {latest_file}")
        else:
            logger.error(f"No file found for {file_type} in {self.data_dir}")

        return latest_file


class WebProcessor(BaseProcessor):

    """
    Process the crawled CSV file, find the latest file, and insert the data into MySQL.
    """

    def __init__(self, data_directory: Path = CRAWLED_DATA_FOLDER):
        """
        Initialize the WebProcessor.

        Params:
            db_connector: An instance of the PostgreSQLDatabase class
            data_directory: Path to the directory containing the .csv file
        """
        self.db = self._get_db_connector()
        self.data_dir = data_directory
        self.table_map = {
            'major': 'majors',
            'subject': 'subjects',
            'major_subject': 'major_subject'
        }
        # Regex to match 'type_YYYYMMDD_HHMMSS.csv'
        self.file_pattern = re.compile(r"^(major|subject)_(\d{8}_\d{6})\.csv$")

    def _read_csv(self, filepath, columns):
        """
        Reads a CSV file and returns a list of dictionaries.
        """
        try:
            data_df = pd.read_csv(filepath)
            if data_df.empty:
                logger.error(f"Warning: File {filepath} is empty or has only headers.")
                return []

            data_df = data_df.fillna("")

            data = data_df[columns]
            return data
        except FileNotFoundError:
            logger.error(f"Error: File {filepath} does not exist.")
            return None
        except Exception as e:
            logger.error(f"Error reading CSV file {filepath}: {e}")
            return None

    def _insert_data(self, table_name, data, column_mapping):
        """
        Insert dictionary list into table, using column mapping.

        Params:
            table_name: Table name in DB.
            data: Dictionary list (output from _read_csv).
            column_mapping: List mapping: ['col_1', 'col_2']
        """

        if not data:
            logger.warning(f"There is no data to insert into table {table_name}.")
            return False

        if not column_mapping:
            logger.error(f"Error: No column_mapping was supplied for table {table_name}.")
            return False

        try:
            # Generate DB column name string (e.g. `col_db_1`, `col_db_2`)
            col_str = ", ".join([f"{c}" for c in column_mapping])

            # Create placeholder string (%s, %s, ...)
            placeholders = ", ".join(["%s"] * len(column_mapping))

            query = f"INSERT INTO {table_name} ({col_str}) VALUES ({placeholders}) ON CONFLICT DO NOTHING;"

            # Prepare a list of tuple values ​​from row_dict based on the order of csv_columns
            params_list = []
            for row_dict in data:
                try:
                    # Use list comprehension to get the correct values ​​in order
                    row_values = []
                    for col in column_mapping:
                        val = row_dict.get(col, None)

                        if val == '' or str(val).lower() == 'nan':
                            val = None 

                        if col == "outline":
                            if val is not None:
                                val = parse_json(val) 
                            else:
                                val = None

                        row_values.append(val)

                    row_tuple = tuple(row_values)
                    params_list.append(row_tuple)
                except KeyError as e:
                    # Skip row if missing mapped column
                    logger.warning(f"Skipping row due to missing key {e}. Row data: {row_dict}")
                    continue

            if not params_list:
                logger.warning(f"There are no valid rows to insert into {table_name} after filtering.")
                return False

            logger.info(f"Inserting {len(params_list)} rows into {table_name}...")
            if self.db.connect():
                if self.db.execute_many_query(query, params_list):
                    return True
            return False

        except Exception as e:
            logger.error(f"Error inserting data to table {table_name}: {e}.")
            return False

    def process(self, file_type):
        """
        Main function to run the whole process:
        1. Find the latest file from file_type
        2. Read this file
        3. Remove duplicate data rows 
        3. Insert new data to the according table
        """

        self.db.connect()
        try:
            # 1. Find the latest file
            latest_filepath = self._find_latest_file(file_type)
            if not latest_filepath:
                return False

            # 2. Read file
            data_df = self._read_csv(latest_filepath, COLUMN_MAPPING[file_type])
            if data_df.empty or data_df is None: # (None or list is empty)
                return False

            # 3. Remove duplicate data rows based on the unique key (e.g. major_code for major, subject_code for subject)
            if file_type == "major":
                unique_key = ["major_code"]
            elif file_type == "subject":
                unique_key = ["subject_code"]
            else:
                unique_key = ["major_code", "subject_code"] # for major_subject
            data_df = data_df.drop_duplicates(subset=unique_key, keep='last')
            data_to_insert = data_df.to_dict('records')

            # 4. Insert new data
            if not self._insert_data(
                self.table_map[file_type], data_to_insert, COLUMN_MAPPING[file_type]
            ):
                return False

            logger.info("Inserted new data to {}".format(self.table_map[file_type]))
            return True

        except Exception as e:
            logger.error(f"Error processing data: {e}.")
            return False


class FileProcessor(BaseProcessor):
    """
    Xử lý Chương trình đào tạo (Excel) và Đề cương môn học (PDF/DOCX) từ file upload.
    """

    def __init__(self, data_directory: Path = CRAWLED_DATA_FOLDER):
        self.data_dir = data_directory
        self.db = self._get_db_connector()
        self.summarizer = Summarizer()

    def _create_data_file(self, file_type, data):
        """
        Save the data to a CSV file.

        Args:
            file_type (str): The type of the file being saved.
            data (list): List of dictionaries containing data.
            output_file (str): Path to the output CSV file.
        """
        output_file = self.data_dir / f"{file_type}_{create_filename('csv')}"

        df = None
        if isinstance(data, list) or isinstance(data, dict):
            df = pd.DataFrame(data)
        elif isinstance(data, pd.DataFrame):
            df = data
        else:
            logger.error("Data format not recognized. Unable to save.")
            return None

        if df is not None:
            try:
                df.to_csv(output_file, index=False, encoding='utf-8')
                logger.info(f"Data saved to {output_file}.")
                return os.path.abspath(output_file)
            except Exception as e:
                logger.error(f"Failed to save DataFrame to CSV: {e}")
                return None

        return None

    def _update_data_file(self, file_path: str, updated_data: dict) -> None:
        try:
            if not file_path or not os.path.exists(file_path):
                self._create_data_file("subject", [updated_data])
                return

            df = pd.read_csv(file_path, encoding='utf-8', on_bad_lines='skip')

            outline_val = updated_data.get('outline')
            if isinstance(outline_val, (dict, list)):
                updated_data['outline'] = json.dumps(outline_val, ensure_ascii=False)

            target_code = updated_data.get('subject_code')
            target_name = updated_data.get('subject_name')

            condition = (df['subject_code'] == target_code) & \
                        (df['subject_name'] == target_name)

            if condition.any():
                df.loc[condition, 'outline'] = updated_data.get('outline')
                logger.info(f"Updated outline for: {target_code}")
            else:
                new_row = pd.DataFrame([updated_data])
                df = pd.concat([df, new_row], ignore_index=True)

            df.to_csv(file_path, index=False, encoding='utf-8')

        except Exception as e:
            logger.error(f"Error in updating data file: {e}")
            raise e

    def _save_data_file(self, file_path, data) -> None:
        """
        Save the data at the end of the file.

        Args:
            file_path (str): The path to the file to be saved.
        """
        try:
            file_exists = os.path.isfile(file_path)
            fieldnames = data[0].keys()

            with open(file_path, mode='a', encoding='utf-8', newline='') as csvfile:
                writer = csv.DictWriter(csvfile, fieldnames=fieldnames)

                if not file_exists:
                    writer.writeheader()

                writer.writerows(data)

        except Exception as e:
            logger.error(f"Error saving data to CSV: {e}")
            raise Exception(f"Error saving data to CSV: {e}")

    def _handle_training_program(
        self, file_path: str, major_code: str, major_name: str, level_id: str
    ):
        """Processing the Excel file: Extract -> Save the new subject to the database."""
        
        # 1. Save the new major to the latest CSV file for type 'major'
        major_latest_filepath = self._find_latest_file("major")
        new_major_data = {
            'major_name': major_name, 'major_code': major_code
        }
        if not major_latest_filepath:
            major_latest_filepath = self._create_data_file("major", [new_major_data])
        else:
            self._save_data_file(major_latest_filepath, [new_major_data])

        # 2. Extract data from the Excel file
        reader = FileReader(file_path)
        df = reader.extract_text(level_id=level_id)

        if df is None or df.empty:
            raise Exception(f"Unable to read data from Excel file: {file_path}")

        # 3. Prepare the subject data and save to CSV file for type 'subject' and 'major_subject'
        subjects_data = []
        major_subject_data = []
        for _, row in df.iterrows():
            subjects_data.append({
                'subject_code': row.get('subject_code'),
                'subject_name': row.get('subject_name'),
                'credits': row.get('credits'),
                'outline_link': row.get('outline_link'),
                'outline': row.get('outline'),
                'level_id': row.get('level_id')
            })
            major_subject_data.append({
                "major_code": major_code,
                "subject_code": row.get('subject_code')
            })

        subject_latest_filepath = self._find_latest_file("subject")
        if not subject_latest_filepath:
            subject_latest_filepath = self._create_data_file("subject", subjects_data)
        else:
            self._save_data_file(subject_latest_filepath, subjects_data)

        major_subject_latest_filepath = self._find_latest_file("major_subject")
        if not major_subject_latest_filepath:
            major_subject_latest_filepath = self._create_data_file("major_subject", major_subject_data)
        else:
            self._save_data_file(major_subject_latest_filepath, major_subject_data)

        return f"{len(subjects_data)} subjects have been loaded from the training program."

    def _handle_course_outline(
        self, file_path: str, subject_code: str, subject_name: str, level_id: str
    ):
        """Processing PDF/Docx files: Extract -> Summarize LLM -> Update to database."""

        # 1. Extract text from the file
        reader = FileReader(file_path)
        raw_text = reader.extract_text(level_id=level_id)
        subject_code = Path(file_path).stem

        if not raw_text or len(raw_text.strip()) < 10:
            raise Exception(f"The content of the course outline file {subject_code} is too short or empty.")

        summary_result = self.summarizer._summarize_content(raw_text)
        if not summary_result:
            raise Exception(f"LLM failed to summarize the course outline for {subject_code}")

        # 2. Update the subject outline in CSV file if the subject exists,
        # otherwise insert a new subject with outline
        updated_subject_data = {
            'subject_code': subject_code,
            'subject_name': subject_name,
            'credits': 0,
            'outline_link': None,
            'outline': summary_result,
            'level_id': level_id,
        }

        subject_latest_filepath = self._find_latest_file("subject")
        if not subject_latest_filepath:
            self._create_data_file("subject", [updated_subject_data])
        else:
            self._update_data_file(subject_latest_filepath, updated_subject_data)

        return f"The summary for the {subject_code} course has been successfully updated."

    def process_file(
        self, file_path: str, level_id: str = "DH",
        major_code: Optional[str] = None, major_name: Optional[str] = None,
        subject_code: Optional[str] = None, subject_name: Optional[str] = None
    ):
        """Hàm điều hướng chính dựa trên đuôi file."""
        ext = Path(file_path).suffix.lower()

        try:
            if ext in ['.xlsx', '.xls']:
                return self._handle_training_program(
                    file_path=file_path, major_code=major_code,
                    major_name=major_name, level_id=level_id
                )
            elif ext in ['.pdf', '.docx', '.doc']:
                return self._handle_course_outline(
                    file_path=file_path, subject_code=subject_code,
                    subject_name=subject_name, level_id=level_id
                )
            else:
                raise ValueError(f"The {ext} file format is not supported.")
        finally:
            if self.db:
                self.db.close()
