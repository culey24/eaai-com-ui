import os
import re
import time
import logging
import asyncio
import json
from pathlib import Path
import pandas as pd
import PyPDF2
from aiohttp import ClientSession, ClientConnectorError
from aiohttp.client_exceptions import ClientResponseError

from google import genai
from google.genai import types
from google.genai.errors import APIError as GeminiAPIError

from .file_reader import FileReader
from .utils.prompt import SUMMARIZING_DATA_PROMPT
from .utils.types import (
    CRAWLED_DATA_FOLDER, DOWNLOADED_DATA_FOLDER,
    copy_file, clean_llm_json
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s %(name)s:%(filename)s:%(lineno)d %(levelname)s %(process)d %(message)s'
)
logger = logging.getLogger(__name__)

BATCH_SIZE = 24
MAX_RETRIES = 5


class Summarizer:

    def __init__(self, data_directory: Path = CRAWLED_DATA_FOLDER):
        """
        Initialize the Summarizer.

        Params:
            data_directory: Path to the directory containing the .csv file
        """
        self.data_dir = data_directory

        # Regex to match 'type_YYYYMMDD_HHMMSS.csv'
        self.file_pattern = re.compile(r"^(major|subject)_(\d{8}_\d{6})\.csv$")

    def _find_latest_file(self, file_type):
        """
        Find the latest file for a type (major or subject) in the data_dir directory.
        """
        latest_timestamp = ""
        latest_file = None
        clean_type = os.path.basename(file_type)

        pattern = re.compile(f"{clean_type}_(\d{{8}}_\d{{6}})\.csv")

        try:
            files = os.listdir(self.data_dir)
            logger.info(f"Scanning directory {self.data_dir}. Files found: {files}")
            for filename in files:
                match = pattern.match(filename.strip())
                if match:
                    timestamp = match.group(1)  # (Example: "20251028_121511")
                    # Direct string comparison works fine for YYYYMMDD format
                    if timestamp > latest_timestamp:
                        latest_timestamp = timestamp
                        latest_file = os.path.join(self.data_dir, filename)

        except FileNotFoundError:
            logger.error(f"Error: Directory '{self.data_dir}' not found")
            return None
        except Exception as e:
            logger.error(f"Error while scanning directory: {e}")
            return None

        if latest_file:
            logger.info(f"Found latest {file_type} file: {latest_file}")
        else:
            logger.error(f"No file found for {file_type} in {self.data_dir}")

        return latest_file

    def _read_csv(self, filepath):
        """
        Reads a CSV file and returns a list of dictionaries.
        """
        try:
            data_df = pd.read_csv(filepath)
            if data_df.empty:
                logger.error(f"Warning: File {filepath} is empty or has only headers.")
                return []

            return data_df.to_dict('records')
        except FileNotFoundError:
            logger.error(f"Error: File {filepath} does not exist.")
            return None
        except Exception as e:
            logger.error(f"Error reading CSV file {filepath}: {e}")
            return None

    async def _async_download_file(
        self, session: ClientSession, subject_code: str, link: str, max_retries=MAX_RETRIES
    ):
        """Tải file bất đồng bộ sử dụng aiohttp."""

        file_path = DOWNLOADED_DATA_FOLDER / f"{subject_code}.pdf"
        if os.path.exists(file_path):
            logger.info(f"File already exists: {file_path}")
            return file_path

        retries = 0
        while retries < max_retries:
            try:
                headers = {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                }
                # Sử dụng session truyền vào
                async with session.get(link, headers=headers, timeout=60) as response:
                    response.raise_for_status()

                    # KIỂM TRA CONTENT-TYPE
                    content_type = response.headers.get('Content-Type', '')
                    if 'application/pdf' not in content_type and \
                        'application/vnd.openxmlformats-officedocument.wordprocessingml.document' not in content_type \
                        and 'application/msword' not in content_type \
                        and 'text/html; charset=UTF-8' not in content_type:
                        logger.error(f"Download failed for {subject_code}: Expected pdf/docx, got {content_type}.")
                        return None

                    # Ghi file bất đồng bộ (giả định asyncio có thể dùng cho thao tác ghi file đơn giản này)
                    # Tuy nhiên, thao tác file I/O trên ổ đĩa là đồng bộ. Tốt nhất là sử dụng run_in_executor
                    # nhưng để giữ cho hàm này là async, ta giả định nó là I/O mạng
                    
                    # Để an toàn cho I/O ổ đĩa, ta dùng run_in_executor, 
                    # nhưng ta đang ở trong class Summarizer, nên ta sẽ dùng logic file I/O cơ bản.
                    # Do Python GIL, I/O ổ đĩa vẫn sẽ chặn event loop. 
                    # Tuy nhiên, aiohttp cung cấp stream, ta dùng stream để giảm thiểu chặn:

                    with open(file_path, 'wb') as f:
                        while True:
                            chunk = await response.content.read(8192)
                            if not chunk:
                                break
                            f.write(chunk)

                    logger.info(f"File downloaded successful: {file_path}")
                    return file_path

            except ClientResponseError as e:
                if e.status in [502, 503, 504]:
                    retries += 1
                    if retries >= max_retries:
                        logger.error(f"AIOHTTP Error {e.status}: Failed after {max_retries} attempts for {subject_code}.")
                        return None

                    wait_time = 2 ** retries # Exponential Backoff (2s, 4s, 8s...)
                    logger.warning(f"Server Error {e.status} ({e.message}). Retrying in {wait_time}s for {subject_code}...")
                    await asyncio.sleep(wait_time)
                    continue

                logger.error(f"AIOHTTP Client Error {e.status} for {subject_code}: {e.message}")
                return None

            except ClientConnectorError:
                retries += 1
                if retries >= max_retries:
                    logger.error(f"AIOHTTP Connection Error: Failed after {max_retries} attempts for {subject_code}.")
                    return None
                wait_time = 2 ** retries
                logger.warning(f"Connection Error. Retrying in {wait_time}s for {subject_code}...")
                await asyncio.sleep(wait_time)
                continue

            except Exception as e:
                logger.error(f"An error occurred during the download for {subject_code}: {e}")
                return None

        return None

    def _extract_content(self, file_path, level_id="CH"):
        try:
            reader = FileReader(file_path)
            return reader.extract_text(level_id=level_id)

        except FileNotFoundError:
            logger.error(f"Error: File not found at path '{file_path}'.")
            return None
        except PyPDF2.errors.PdfReadError as pdf_error:
            logger.error(f"PDF Read Error when reading file '{file_path}': {pdf_error}")
            return None
        except Exception as e:
            logger.error(f"Error when reading PDF file '{file_path}': {e}")
            return None

    def _summarize_content(self, contents, max_retries=MAX_RETRIES):
        """
        Use Gemini API to summarize the extracted course content.

        Parameters:
        - contents (str): The entire text content extracted from the PDF file.
        Returns:
        - str: Formatted summary text string.
        """
        client = genai.Client(api_key=os.getenv("GOOGLE_API_KEY"))

        prompt = SUMMARIZING_DATA_PROMPT + f"""
        # DATA TO SUMMARIZE: {contents}
        """

        retries = 0
        while retries < max_retries:
            try:
                response = client.models.generate_content(
                    model=os.getenv("MODEL_ID", "gemini-2.5-flash"), contents=prompt
                )
                raw_text = clean_llm_json(response.text)
                try:
                    return json.loads(raw_text)
                except:
                    return raw_text

            except GeminiAPIError as e:
                # Mã lỗi 503 (Unavailable) và 429 (Quota Exceeded)
                status_code = e.response.status_code

                if status_code in [503, 429]:
                    retries += 1

                    # Chiến lược Exponential Backoff: Đợi 2^retry_count giây
                    # Ví dụ: 2^1=2s, 2^2=4s, 2^3=8s, ...
                    wait_time = 2 ** retries

                    logger.warning(
                        f"API Error {status_code} ({e.response}). "
                        f"Retrying attempt {retries}/{max_retries} in {wait_time}s..."
                    )
                    time.sleep(wait_time) # Tạm dừng luồng nền

                elif status_code == 400:
                    logger.error(f"Fatal 400 API Error: {e}")
                    return None
                else:
                    logger.error(f"Unrecoverable API Error (Status {status_code}): {e}")
                    return None

            except Exception as e:
                logger.error(f"Unexpected error when summarizing data: {e}")
                return None

        logger.error(f"Failed to summarize content after {max_retries} attempts.")
        return None

    async def _async_summarize_content(self, contents: str):
        """Tóm tắt nội dung bất đồng bộ sử dụng Gemini API."""
        try:
            # Lưu ý: Client của Google GenAI (python sdk) không hỗ trợ async/await,
            # nên việc này vẫn là một blocking call. Để giải quyết triệt để:
            #   1. Phải dùng thư viện Gemini/OpenAI hỗ trợ async (nếu có).
            #   2. Hoặc bọc hàm này trong `await asyncio.to_thread(_summarize_content_sync, ...)`

            # Tạm thời, ta dùng asyncio.to_thread (giống run_in_threadpool) để giải phóng event loop
            result = await asyncio.to_thread(self._summarize_content, contents)
            if result:
                cleaned_result = clean_llm_json(result)
                return json.loads(cleaned_result)
            return None

        except Exception as e:
            logger.error(f"Error when summarizing data: {e}")
            return None

    def _save_to_csv(self, data, file_path):
        try:
            df = pd.DataFrame(data)
            df.to_csv(file_path, mode='w', index=False, encoding='utf-8')

            logger.info(f"Successfully wrote data to file: '{file_path}'")
            return True
        except ValueError as e:
            logger.error(f"Error: Dictionary has invalid structure for DataFrame: {e}")
            return False
        except Exception as e:
            logger.error(f"Error writing CSV file:: {e}")
            return False

    async def process_row_async(self, session: ClientSession, row: dict, level_id="CH"):
        """Thực hiện toàn bộ quá trình xử lý (Download, Extract, Summarize) cho một hàng."""
        try:
            subject_code = row["subject_code"]
            outline_link = row["outline_link"]

            # 1. Download file bất đồng bộ
            file_path = await self._async_download_file(session, subject_code, outline_link)
            if file_path is None:
                row["outline"] = None
                return row

            # if row.get("outline") is not None:
            #     logger.info(f"Outline already exists for {subject_code}, no need to extract.")
            #     return row

            # 2. Extract content (I/O ổ đĩa, nên bọc trong to_thread)
            extracted_contents = await asyncio.to_thread(self._extract_content, file_path, level_id)

            if not extracted_contents:
                row["outline"] = None
                return row

            # 3. Summarize content bất đồng bộ (đã bọc trong to_thread)
            row["outline"] = await self._async_summarize_content(extracted_contents)

            if not row["outline"]:
                row["outline"] = None
            
            row["level_id"] = "CH"
            return row

        except Exception as e:
            logger.error(f"Error processing row for {row.get('subject_code', 'Unknown')}: {e}")
            row["outline"] = None
            return row

    async def run(self, level_id="CH"):
        """
        Hàm run chính, sử dụng asyncio.gather và chia batch để xử lý song song.
        """
        try:
            latest_filepath = self._find_latest_file("subject")
            if not latest_filepath:
                return False

            data_dict_list = self._read_csv(latest_filepath)
            if not data_dict_list:
                return False

            logger.info(f"Start async processing for {len(data_dict_list)} subjects in batches of {BATCH_SIZE}.")

            processed_data_list = []

            # Tạo 1 file tạm để lưu data qua mỗi BATCH_SIZE
            temp_csv = CRAWLED_DATA_FOLDER / "temp.csv"

            # Sử dụng ClientSession bên ngoài vòng lặp batch
            # để tái sử dụng kết nối TCP (rất quan trọng)
            async with ClientSession() as session:

                # Chia data_dict_list thành các batch nhỏ
                for i in range(0, len(data_dict_list), BATCH_SIZE):
                    batch = data_dict_list[i:i + BATCH_SIZE]

                    # Tạo list các task cho batch hiện tại
                    tasks = [self.process_row_async(session, row, level_id) for row in batch]

                    # Chạy tất cả các task trong batch song song
                    # return_exceptions=True để đảm bảo các task khác vẫn chạy khi 1 task lỗi
                    batch_results = await asyncio.gather(*tasks, return_exceptions=False)

                    # Gom kết quả
                    processed_data_list.extend(batch_results)

                    logger.info(f"Completed batch {i//BATCH_SIZE + 1}/{len(data_dict_list)//BATCH_SIZE + 1}. Processed count: {len(processed_data_list)}")

                    # Lưu tạm dữ liệu vào temp_csv
                    self._save_to_csv(processed_data_list, temp_csv)

            return copy_file(temp_csv, latest_filepath)

        except Exception as e:
            logger.error(f"Error summarizing data: {e}.")
            return False
