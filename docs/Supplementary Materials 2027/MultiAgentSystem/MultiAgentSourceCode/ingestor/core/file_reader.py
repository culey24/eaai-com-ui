import pandas as pd
import PyPDF2
from docx import Document
import logging
import os

logger = logging.getLogger(__name__)

class FileReader:

    def __init__(self, file_path: str):
        self.file_path = file_path

    def extract_text(self, level_id=None):
        ext = os.path.splitext(self.file_path)[1].lower()
        try:
            if ext == ".pdf":
                return self.read_pdf(level_id=level_id)
            elif ext in [".docx", ".doc"]:
                return self.read_docx(level_id=level_id)
            elif ext in [".xlsx", ".xls", ".csv"]:
                return self.read_spreadsheet(level_id=level_id)
            else:
                logger.warning(f"The extension '{ext}' is not supported.")
                return None
        except Exception as e:
            logger.error(f"Error reading file {self.file_path}: {e}")
            return None

    def read_pdf(self, level_id=None):
        content = ""
        with open(self.file_path, 'rb') as file:
            reader = PyPDF2.PdfReader(file, strict=False)
            for page in reader.pages:
                content += page.extract_text() + "\n\n"
        return content

    def read_docx(self, level_id=None):
        doc = Document(self.file_path)
        return "\n".join([para.text for para in doc.paragraphs])

    def read_spreadsheet(self, level_id=None):
        ext = os.path.splitext(self.file_path)[1].lower()
        try:
            if "xls" in ext or "xlsx" in ext:
                df = pd.read_excel(self.file_path, header=None)
            else:
                df = pd.read_csv(self.file_path, header=None, encoding='utf-8')
        except Exception as e:
            logger.error(f"Cannot read file: {e}")
            return None

        table_start_index = None
        target_columns = ["MSMH", "Mã môn", "Tên môn học", "Tín chỉ", "Mã HP"]
        
        for i, row in df.iterrows():
            row_values = [str(val).strip().upper() for val in row.values]
            matches = [col for col in target_columns if col.upper() in row_values]
            if len(matches) >= 2:
                table_start_index = i
                break

        if table_start_index is None:
            logger.warning("Cannot find a suitable data table in the file.")
            return df

        df.columns = [str(c).strip() for c in df.iloc[table_start_index]]
        df = df.iloc[table_start_index + 1:].reset_index(drop=True)

        column_mapping = {
            'MSMH': 'subject_code',
            'Mã môn': 'subject_code',
            'Mã HP': 'subject_code',
            'Tên môn học': 'subject_name',
            'Tên HP': 'subject_name',
            'Tín chỉ': 'credits',
            'TC': 'credits'
        }
        existing_mapping = {k: v for k, v in column_mapping.items() if k in df.columns}
        df = df.rename(columns=existing_mapping)

        if 'subject_code' in df.columns:
            df['subject_code'] = df['subject_code'].astype(str).str.strip()
            df = df[
                (df['subject_code'] != 'nan') & 
                (df['subject_code'] != '') & 
                (df['subject_code'].str.len() > 2)
            ]

        if 'credits' in df.columns:
            df['credits'] = pd.to_numeric(df['credits'], errors='coerce').fillna(0).astype(int)

        df["outline"] = None
        df["outline_link"] = None
        df["level_id"] = level_id

        df = df.drop_duplicates(subset=["subject_code", "level_id"], keep='first')
        final_cols = [
            c for c in ['subject_code', 'subject_name', 'credits', 'outline_link', 'outline', 'level_id'] if c in df.columns
        ]

        logger.info(f"{len(df)} subjects have been successfully extracted.")
        return df[final_cols]
