"""Ingestor API — crawl CSV, tóm tắt đề cương, đẩy majors/subjects vào PostgreSQL (DATABASE_URL)."""
import asyncio
import logging
import os
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from typing import Annotated, Optional

from dotenv import load_dotenv
from fastapi import FastAPI, File, HTTPException, Query, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from ingestor.core.crawler import WebCrawler
from ingestor.core.processor import FileProcessor, WebProcessor
from ingestor.core.summarizer import Summarizer
from ingestor.core.utils.types import UPLOADED_DATA_FOLDER

load_dotenv()
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s %(name)s:%(filename)s:%(lineno)d %(levelname)s %(process)d %(message)s',
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title='Ingestor API (eaai agent-assistant)',
    description='Crawl / upload chương trình & đề cương → CSV → DB.',
    version='1.0.0',
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)

executor = ThreadPoolExecutor()


@app.get('/health')
async def health_check():
    return JSONResponse(status_code=200, content={'status': 'Server is ready'})


@app.post('/ingest/web/crawl')
async def crawl_endpoint(url: str = Query(..., description='URL trang cần crawl')):
    try:
        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(executor, run_crawler, url)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


def run_crawler(url: str):
    crawler = None
    try:
        crawler = WebCrawler()
        major_fp, subject_fp, ms_fp = crawler.crawl(url)
        if major_fp and subject_fp:
            return {
                'url': url,
                'major_filepath': major_fp,
                'subject_filepath': subject_fp,
                'major_subject_filepath': ms_fp,
                'message': 'Crawling completed successfully',
            }
        return {'url': url, 'error': 'Crawling failed'}
    finally:
        if crawler:
            crawler.close()


@app.get('/ingest/web/summarize')
async def summarize_endpoint():
    try:
        summarizer = Summarizer()
        result = await summarizer.run()
        if result:
            return {'message': 'Summarizing completed successfully'}
        return {'error': 'Summarizing failed'}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


@app.get('/ingest/web/process')
async def process_web_endpoint(file_types: str = 'major,subject,major_subject'):
    try:
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(executor, run_web_processor, file_types)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


def run_web_processor(file_types: str):
    processor = WebProcessor()
    types_list = file_types.split(',')
    message = {}
    for ft in types_list:
        ft = ft.strip()
        message[ft] = processor.process(ft)
    if all(message.values()):
        return JSONResponse(
            status_code=200,
            content={'process': message, 'message': 'Processing succeeded.'},
        )
    return JSONResponse(
        status_code=500,
        content={'process': message, 'message': 'Processing failed (some types missing data or DB error).'},
    )


@app.post('/ingest/file/program')
async def process_program_endpoint(
    file: Annotated[UploadFile, File(...)],
    major_code: str = Query(..., description='Mã ngành'),
    major_name: Optional[str] = Query(None),
    level_id: str = Query('DH', description='DH hoặc CH'),
):
    original_path = Path(file.filename or 'upload')
    file_path = UPLOADED_DATA_FOLDER / f'{major_code}{original_path.suffix}'
    file_path.parent.mkdir(parents=True, exist_ok=True)
    with open(file_path, 'wb') as buffer:
        buffer.write(await file.read())

    try:
        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(
            executor,
            run_program_processor,
            str(file_path),
            major_code,
            major_name,
            level_id,
        )
        return result
    except Exception as e:
        logger.error('program pipeline: %s', e)
        raise HTTPException(status_code=500, detail=str(e)) from e


def run_program_processor(
    file_path: str, major_code: str, major_name: Optional[str], level_id: str = 'DH'
):
    processor = FileProcessor()
    msg = processor.process_file(
        file_path=file_path,
        major_code=major_code,
        major_name=major_name,
        level_id=level_id,
    )
    return {'major_code': major_code, 'major_name': major_name, 'level_id': level_id, 'message': msg}


@app.post('/ingest/file/outline')
async def process_outline_endpoint(
    file: Annotated[UploadFile, File(...)],
    subject_code: str = Query(..., description='Mã môn'),
    subject_name: Optional[str] = Query(None),
    level_id: str = Query('DH'),
):
    original_path = Path(file.filename or 'upload')
    file_path = UPLOADED_DATA_FOLDER / f'{subject_code}{original_path.suffix}'
    file_path.parent.mkdir(parents=True, exist_ok=True)
    with open(file_path, 'wb') as buffer:
        buffer.write(await file.read())

    try:
        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(
            executor,
            run_outline_processor,
            str(file_path),
            subject_code,
            subject_name,
            level_id,
        )
        if result.get('status') == 'error':
            raise HTTPException(status_code=400, detail=result.get('message'))
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error('outline pipeline: %s', e)
        raise HTTPException(status_code=500, detail=str(e)) from e


def run_outline_processor(
    file_path: str, subject_code: str, subject_name: Optional[str], level_id: str
):
    processor = FileProcessor()
    try:
        msg = processor.process_file(
            file_path=file_path,
            subject_code=subject_code,
            subject_name=subject_name,
            level_id=level_id,
        )
        return {'status': 'success', 'data': msg}
    except Exception as e:
        return {'status': 'error', 'message': str(e)}


if __name__ == '__main__':
    import uvicorn

    uvicorn.run(
        app,
        host=os.getenv('INGESTOR_HOST', '0.0.0.0'),
        port=int(os.getenv('INGESTOR_PORT', '8001')),
    )
