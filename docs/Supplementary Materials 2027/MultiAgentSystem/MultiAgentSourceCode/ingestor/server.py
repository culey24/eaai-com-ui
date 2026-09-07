import os
import asyncio
import logging
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from typing import Annotated, Optional
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Query, UploadFile, File
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware

from core.crawler import WebCrawler
from core.processor import WebProcessor, FileProcessor
from core.summarizer import Summarizer
from core.utils.types import UPLOADED_DATA_FOLDER

load_dotenv()
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s %(name)s:%(filename)s:%(lineno)d %(levelname)s %(process)d %(message)s'
)
logger = logging.getLogger(__name__)


app = FastAPI(
    title="Ingestor API",
    description="API to crawl subject and donwnload its outline.",
    version="1.0.0"
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

executor = ThreadPoolExecutor()


@app.get("/health")
async def health_check():
    """
    Health check endpoint to verify the server is running.
    """
    return JSONResponse(
        status_code=200,
        content={"status": "Server is ready"}
    )


@app.post("/ingest/web/crawl")
async def crawl_endpoint(url: str = "https://grad.hcmut.edu.vn/hv/tra_cuu_ctdt_ths.php?e=link"):
    """
    Endpoint to start the web crawling process.
    """
    try:
        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(executor, run_crawler, url)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


def run_crawler(url: str):
    crawler = None
    try:
        crawler = WebCrawler()
        major_filepath, subject_filepath, major_subject_filepath = crawler.crawl(url)
        if major_filepath and subject_filepath:
            return {
                "url": url,
                "major_filepath": major_filepath,
                "subject_filepath": subject_filepath,
                "major_subject_filepath": major_subject_filepath,
                "message": "Crawling completed successfully"
            }
        else:
            return {"url": url, "error": "Crawling failed"}

    except Exception as e:
        logger.error(f"Error during crawling: {e}")
        raise
    finally:
        if crawler:
            logger.info(f"Closing crawler for: {url}")
            crawler.close()


@app.get("/ingest/web/summarize")
async def summarize_endpoint():
    """
    Endpoint to start the content summarization process.
    """
    try:
        summarizer = Summarizer()
        result = await summarizer.run()
        if result:
            return {
                "message": "Summarizing completed successfully"
            }
        return {
            "error": "Summarizing failed"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/ingest/web/process")
async def process_web_endpoint(file_types: str = "major,subject,major_subject"):
    try:
        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(executor, run_web_processor, file_types)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

def run_web_processor(file_types: str):
    processor = None
    try:
        processor = WebProcessor()
        types = file_types.split(",")

        message = {}
        for file_type in types:
            result = processor.process(file_type)
            message[file_type] = result

        if all(message.values()):
            return JSONResponse(
                status_code=200,
                content={
                    "process": message,
                    "message": "Processing successed."
                }
            )
        else:
            return JSONResponse(
                status_code=500,
                content={
                    "process": message,
                    "message": "Processing failed."
                }
            )

    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={
                "message": "Processing failed."
            }
        )
    finally:
        if processor:
            processor.db.close()


################################


@app.post("/ingest/file/program")
async def process_program_endpoint(
    file: Annotated[UploadFile, File(...)],
    major_code: str = Query(..., description="Major code to name the uploaded file"),
    major_name: Optional[str] = Query(None, description="Major name"),
    level_id: str = Query("DH", description="DH or CH")
):
    """
    Upload file -> Read content -> Insert data to MySQL.
    """
    original_path = Path(file.filename)
    extension = original_path.suffix
    file_path = UPLOADED_DATA_FOLDER / f"{major_code}{extension}"
    with open(file_path, "wb") as buffer:
        buffer.write(await file.read())

    try:
        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(
            executor, run_program_processor, file_path, major_code, major_name, level_id
        )
        return result
    except Exception as e:
        logger.error(f"File pipeline failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

def run_program_processor(
    file_path: str, major_code: str, major_name: Optional[str], level_id: str = "DH"
):
    processor = FileProcessor()
    result = processor.process_file(
        file_path=file_path, major_code=major_code, major_name=major_name, level_id=level_id
    )
    return {
        "major_code": major_code,
        "major_name": major_name,
        "level_id": level_id,
        "message": result
    }


@app.post("/ingest/file/outline")
async def process_outline_endpoint(
    file: Annotated[UploadFile, File(...)],
    subject_code: str = Query(..., description="Subject code to name the uploaded file"),
    subject_name: Optional[str] = Query(None, description="Subject name"),
    level_id: str = Query("DH", description="DH or CH")
):
    """
    Upload file -> Read content -> Summarize content by LLM -> Insert data to MySQL.
    """
    original_path = Path(file.filename)
    extension = original_path.suffix
    file_path = UPLOADED_DATA_FOLDER / f"{subject_code}{extension}"
    with open(file_path, "wb") as buffer:
        buffer.write(await file.read())

    try:
        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(
            executor, run_outline_processor, file_path, subject_code, subject_name, level_id
        )
        if result.get("status") == "error":
            raise HTTPException(status_code=404, detail=result.get("message"))
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Outline pipeline failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

def run_outline_processor(
    file_path: str, subject_code: str, subject_name: Optional[str], level_id: str = "DH"
):
    processor = FileProcessor()
    try:
        result = processor.process_file(
            file_path=file_path, subject_code=subject_code,
            subject_name=subject_name, level_id=level_id
        )
        return {"status": "success", "data": result}
    except Exception as e:
        return {"status": "error", "message": str(e)}
    finally:
        processor.db.close()


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        app,
        host=os.getenv("WEB_CRAWLER_SERVER_HOST", "0.0.0.0"),
        port=int(os.getenv("WEB_CRAWLER_SERVER_PORT", 8001))
    )
