import os
from typing import Optional
import logging
from dotenv import load_dotenv
import requests

load_dotenv()
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s %(name)s:%(filename)s:%(lineno)d %(levelname)s %(process)d %(message)s'
)
logger = logging.getLogger(__name__)

from ...service_urls import get_be_server_base_url

BE_SERVER = get_be_server_base_url()


async def get_current_schedule(user_id: str) -> Optional[list]:
    """
    Retrieves the user's currently scheduled academic for the specified period.
    """
    try:
        response = requests.get(f"{BE_SERVER}/users/{user_id}/schedule")
        if response.status_code == 200:
            return response.json().get("schedule", [])
        return []
    except requests.RequestException as e:
        logger.error(f"Error retrieving current schedule for user {user_id}: {e}")
        return None
