"""Trích text từ PDF / Word / bảng (dùng chatbot upload + agent tool)."""
from __future__ import annotations

import logging
import os
from pathlib import Path

import pandas as pd
import PyPDF2
from docx import Document

logger = logging.getLogger(__name__)


class FileReader:
    def __init__(self, file_path: str | Path):
        self.file_path = str(file_path)

    def extract_text(self, level_id=None):
        ext = Path(self.file_path).suffix.lower()
        try:
            if ext == '.pdf':
                return self._read_pdf()
            if ext in ('.docx', '.doc'):
                return self._read_docx()
            if ext in ('.xlsx', '.xls', '.csv'):
                return self._read_spreadsheet(level_id=level_id)
            logger.warning("Extension '%s' is not supported.", ext)
            return None
        except Exception as e:
            logger.error('Error reading file %s: %s', self.file_path, e)
            return None

    def _read_pdf(self) -> str:
        content = ''
        with open(self.file_path, 'rb') as f:
            reader = PyPDF2.PdfReader(f, strict=False)
            for page in reader.pages:
                content += (page.extract_text() or '') + '\n\n'
        return content

    def _read_docx(self) -> str:
        doc = Document(self.file_path)
        return '\n'.join(p.text for p in doc.paragraphs)

    def _read_spreadsheet(self, level_id=None):
        ext = Path(self.file_path).suffix.lower()
        if 'xls' in ext:
            df = pd.read_excel(self.file_path, header=None)
        else:
            df = pd.read_csv(self.file_path, header=None, encoding='utf-8')
        return df
