"""
Ingestor package for extracting data from websites or files.
"""

from ingestor.core.crawler import WebCrawler
from ingestor.core.processor import DataProcessor


__all__ = [
    "WebCrawler",
    "DataProcessor"
]
