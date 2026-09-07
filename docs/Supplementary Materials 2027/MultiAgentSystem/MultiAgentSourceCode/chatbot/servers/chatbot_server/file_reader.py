import os
import pandas as pd
import logging
import PyPDF2
from docx import Document

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s %(name)s:%(filename)s:%(lineno)d %(levelname)s %(process)d %(message)s'
)
logger = logging.getLogger(__name__)


class FileReader:

    def __init__(self, file_path: str):
        self.file_path = file_path

    def extract_text(self):
        ext = os.path.splitext(self.file_path)[1].lower()
        try:
            if ext == ".pdf":
                return self.read_pdf()
            elif ext in [".docx", ".doc"]:
                return self.read_docx()
            elif ext in [".xlsx", ".xls", ".csv"]:
                return self.read_spreadsheet()
            else:
                logger.warning(f"The extension '{ext}' is not supported.")
                return None
        except Exception as e:
            logger.error(f"Error reading file {self.file_path}: {e}")
            return None

    def read_pdf(self):
        content = ""
        with open(self.file_path, 'rb') as file:
            reader = PyPDF2.PdfReader(file, strict=False)
            for page in reader.pages:
                content += page.extract_text() + "\n\n"
        return content

    def read_docx(self):
        doc = Document(self.file_path)
        return "\n".join([para.text for para in doc.paragraphs])

    def read_spreadsheet(self):
        ext = os.path.splitext(self.file_path)[1].lower()
        df = pd.read_excel(self.file_path) if "xls" in ext else pd.read_csv(self.file_path)
        return df
