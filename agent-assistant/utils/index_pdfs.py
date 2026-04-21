import os
import json
import logging
from pathlib import Path
from PyPDF2 import PdfReader
from dotenv import load_dotenv

# Add the parent directory to sys.path to import utils
import sys
sys.path.append(str(Path(__file__).parent.parent))

from utils.llm_provider import chat_completion_text

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

load_dotenv()

PROJECT_ROOT = Path(__file__).parent.parent.parent
PDF_DIR = PROJECT_ROOT / "docs" / "slides for IS"
DATA_DIR = PROJECT_ROOT / "agent-assistant" / "data"
OUTPUT_FILE = DATA_DIR / "pdf_index.json"

def extract_text_from_pdf(pdf_path: Path, max_chars: int = 10000) -> str:
    """Extract text from a PDF file."""
    try:
        reader = PdfReader(pdf_path)
        text = ""
        for page in reader.pages:
            text += page.extract_text() + "\n"
            if len(text) > max_chars:
                break
        return text[:max_chars]
    except Exception as e:
        logger.error(f"Error extracting text from {pdf_path}: {e}")
        return ""

def get_pdf_metadata(filename: str, text: str) -> dict:
    """Use LLM to generate description and topics for the PDF."""
    prompt = f"""
    Analyze the following text extracted from a PDF presentation slide titled "{filename}".
    Generate a JSON object with two fields:
    1. "description": A short, catchy summary of what this presentation is about (in Vietnamese).
    2. "main_topics": A list of 3-5 key academic topics or concepts covered in this presentation (in Vietnamese).

    Text:
    {text}

    Response format:
    {{
        "description": "...",
        "main_topics": ["topic1", "topic2", ...]
    }}
    """
    try:
        response_text = chat_completion_text(prompt)
        # Clean up the response in case the LLM wrapped it in markdown code blocks
        if "```json" in response_text:
            response_text = response_text.split("```json")[1].split("```")[0]
        elif "```" in response_text:
            response_text = response_text.split("```")[1].split("```")[0]
        
        return json.loads(response_text.strip())
    except Exception as e:
        logger.error(f"Error getting metadata for {filename}: {e}")
        return {"description": "Không có mô tả.", "main_topics": []}

def main():
    if not PDF_DIR.exists():
        logger.error(f"PDF directory not found: {PDF_DIR}")
        return

    DATA_DIR.mkdir(parents=True, exist_ok=True)

    pdf_files = list(PDF_DIR.glob("*.pdf"))
    logger.info(f"Found {len(pdf_files)} PDF files.")

    index = []
    for pdf_file in pdf_files:
        logger.info(f"Processing {pdf_file.name}...")
        text = extract_text_from_pdf(pdf_file)
        if not text.strip():
            logger.warning(f"No text extracted from {pdf_file.name}, skipping.")
            continue
        
        metadata = get_pdf_metadata(pdf_file.name, text)
        entry = {
            "filename": pdf_file.name,
            "description": metadata.get("description", "Không có mô tả."),
            "main_topics": metadata.get("main_topics", [])
        }
        index.append(entry)
        logger.info(f"Finished processing {pdf_file.name}.")

    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(index, f, ensure_ascii=False, indent=4)
    
    logger.info(f"Index saved to {OUTPUT_FILE}")

if __name__ == "__main__":
    main()
