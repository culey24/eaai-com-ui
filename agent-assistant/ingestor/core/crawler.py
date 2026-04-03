import os
import time
import urllib3

import certifi
import re
import requests
import ssl
from urllib.parse import urljoin, urlparse
from concurrent.futures import ThreadPoolExecutor, as_completed
import validators
import logging
import pandas as pd

from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import Select, WebDriverWait
from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, StaleElementReferenceException

from .utils.types import CRAWLED_DATA_FOLDER, get_file_path, create_filename

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s %(name)s:%(filename)s:%(lineno)d %(levelname)s %(process)d %(message)s'
)
logger = logging.getLogger(__name__)

# Disable SSL verification for WebDriver Manager
os.environ["REQUESTS_CA_BUNDLE"] = certifi.where()
os.environ["WDM_SSL_VERIFY"] = "0"


class WebCrawler:
    """
    WebCrawler class that handles the entire crawling process.
    Combines both browser automation and content extraction.
    """

    def __init__(self, headless=True):
        """
        Initialize the WebCrawler with a Selenium WebDriver.

        Args:
            headless (bool): Run browser in headless mode if True.
        """
        self.driver = None
        self.headless = headless
        self._initialize_driver()

        # Disable SSL verification for requests
        urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
        # Set default SSL context to unverified
        ssl._create_default_https_context = ssl._create_unverified_context

    def __enter__(self):
        """Initialize the driver when entering the 'with' block."""
        self._initialize_driver()
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        """Ensure browser is closed when object is destroyed."""
        self.close()

    def _initialize_driver(self):
        """Set up Chrome WebDriver with optimized options."""
        chrome_options = Options()
        
        if self.headless:
            chrome_options.add_argument("--headless")
        
        # Add performance options
        chrome_options.add_argument("--no-sandbox")
        chrome_options.add_argument("--disable-dev-shm-usage")
        chrome_options.add_argument("--disable-gpu")
        chrome_options.add_argument("--disable-extensions")
        chrome_options.add_argument("--disable-notifications")
        chrome_options.add_argument("--disable-infobars")

        # Add auto file download configuration and DISABLE built-in PDF viewer
        prefs = {
            "download.default_directory": str(CRAWLED_DATA_FOLDER),
            "download.prompt_for_download": False,
            "download.directory_upgrade": True,
            "safebrowsing.enabled": True,
            # Important: DISABLE built-in PDF viewer
            "plugins.always_open_pdf_externally": True
        }
        chrome_options.add_experimental_option("prefs", prefs)

        try:
            system_driver_path = "/usr/bin/chromedriver"

            if os.path.exists(system_driver_path):
                service = Service(executable_path=system_driver_path)
                logger.info(f"Using system ChromeDriver at {system_driver_path}")
            else:
                # Fallback về webdriver-manager nếu chạy local (Windows/macOS) ngoài Docker
                from webdriver_manager.chrome import ChromeDriverManager
                service = Service(ChromeDriverManager().install())
                logger.warning("System ChromeDriver not found, falling back to ChromeDriverManager")

            self.driver = webdriver.Chrome(service=service, options=chrome_options)
            self.driver.set_page_load_timeout(60)
            logger.info("WebDriver initialized successfully")
        except Exception as e:
            logger.error(f"Error initializing WebDriver: {e}")
            raise

    def close(self):
        """Close the WebDriver if it exists."""
        if self.driver:
            try:
                self.driver.quit()
                logger.info("WebDriver closed successfully")
            except Exception as e:
                logger.error(f"Error closing WebDriver: {e}")
            self.driver = None

    def load_page(self, url, wait_element_locator=None, timeout=10) -> bool:
        """
        Load a web page in the browser.

        Args:
            url (str): URL of the page to load.
            
        Returns:
            bool: True if page loaded successfully, False otherwise.
        """
        try:
            self.driver.get(url)
            if wait_element_locator:
                WebDriverWait(self.driver, timeout).until(
                    EC.visibility_of_element_located(wait_element_locator) 
                )
            return True
        except TimeoutException:
            logger.warning(f"Timeout while waiting for element {wait_element_locator} on {url}")
            return False
        except Exception as e:
            logger.error(f"Error loading page {url}: {e}")
            return False

    def scroll_to_bottom(self):
        """
        Scroll to the bottom of the page to load dynamic content.
        """
        try:
            # Get scroll height
            last_height = self.driver.execute_script("return document.body.scrollHeight")
            
            while True:
                # Scroll down
                self.driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
                # Wait to load page
                time.sleep(1)
                
                # Calculate new scroll height and compare with last scroll height
                new_height = self.driver.execute_script("return document.body.scrollHeight")
                if new_height == last_height:
                    break
                last_height = new_height
        except Exception as e:
            logger.error(f"Error scrolling: {e}")

    def select_no_items_displayed(self, select_locator, select_value, results_table_locator):
        """
        Select 'Number of items displayed' option from a dropdown to show all items.

        Args:
            select_locator (tuple): Locator tuple for the select element.
        """
        try:
            select_so_muc = Select(self.driver.find_element(*select_locator))
            select_so_muc.select_by_value(select_value)
            # logger.info(f"Set display limit to {select_value} entries.")
            
            # Wait for page reload or AJAX update to finish
            WebDriverWait(self.driver, 10).until(
                EC.presence_of_element_located(results_table_locator)
            )
            time.sleep(1) # Add small sleep for safety

        except Exception as e:
            logger.error(f"Failed to set display limit to {select_value}. Skipping data extraction. Error: {e}")
            return

    def crawl(self, url):
        """
        Get all values from 'Major' dropdown, loop through each major,
        extract subject data and load syllabus.
        
        Returns:
            List: List of dictionaries containing crawled data.
        """

        MAJOR_DROPDOWN_LOCATOR = (By.CSS_SELECTOR, '#ctdt_txtNganh')
        NO_ITEMS_DISPLAYED_LOCATOR = (By.NAME, 'ds_ctdt_ths_length')
        RESULTS_TABLE_LOCATOR = (By.CSS_SELECTOR, "#ds_ctdt_ths")

        if not self.load_page(
            url, wait_element_locator=MAJOR_DROPDOWN_LOCATOR, timeout=30
        ):
            logger.error("Failed to load page or find the Major dropdown after AJAX load.")
            return []

        try:
            dropdown_element = self.driver.find_element(*MAJOR_DROPDOWN_LOCATOR)
            if not dropdown_element:
                logger.error("Could not find the 'Major' dropdown element.")
                return None

            # Step 2: Get all 'value' values ​​from dropdown
            select_major = Select(dropdown_element)
            major_values = [
                option.get_attribute("value") 
                for i, option in enumerate(select_major.options) 
                if i > 0 and option.get_attribute("value")
            ]

            if len(major_values) == 0:
                raise ValueError("No major values found in the dropdown.")

            logger.info(f"Found {len(major_values)} major values to crawl.")

            # Step 3: Loop through each major value to extract subject data
            majors = []
            subjects = []
            major_subject = []
            for major_value in major_values:
                # Find the dropdown element again for each select to avoid StaleElementReferenceException
                dropdown_element = self.driver.find_element(*MAJOR_DROPDOWN_LOCATOR)
                if not dropdown_element:
                    continue

                select_major = Select(dropdown_element)
                select_major.select_by_value(major_value)

                major_name = select_major.first_selected_option.text
                logger.info(f"--- START CRAWLING 'MAJOR': {major_name} (Value: {major_value}) ---")

                majors.append({
                    "major_name": major_name, "major_code": major_value
                })

                # Wait for the results table to load (Explicit Wait)
                try:
                    WebDriverWait(self.driver, 30).until(
                        EC.presence_of_element_located(RESULTS_TABLE_LOCATOR)
                    )
                except TimeoutException:
                    logger.warning(f"Timeout waiting for results for 'Major': {major_value}. Skipping.")
                    continue

                # Set 'Number of items displayed' to show all entries
                self.select_no_items_displayed(
                    NO_ITEMS_DISPLAYED_LOCATOR, select_value='100',
                    results_table_locator=RESULTS_TABLE_LOCATOR
                )

                # Start extracting data for the current major
                table_body = self.driver.find_elements(*RESULTS_TABLE_LOCATOR)
                if not table_body:
                    logger.error(f"Could not find the results table body for 'Major' {major_value}. Skipping.")
                    continue

                rows = table_body[0].find_elements(By.TAG_NAME, 'tr')
                # logger.info(f"Find {len(rows)} subjects of major {major_name}")

                for row in rows:
                    cols = row.find_elements(By.TAG_NAME, 'td')
                    # logger.info(f"Find {len(cols)} columns")

                    if len(cols) > 0: # Check the number of columns
                        subject_code = cols[0].text
                        vietnamese_name = cols[1].text
                        english_name = cols[2].text
                        subject_name = f"{vietnamese_name} - {english_name}"
                        credits = cols[3].text or "0"

                        major_subject.append({
                            'major_code': major_value,
                            'subject_code': subject_code
                        })

                        # if subject_code in subjects, skip to avoid duplicates
                        if any(d['subject_code'] == subject_code for d in subjects):
                            logger.info(f"Subject {subject_code} already crawled. Skipping duplicate.")
                            continue

                        data_row = {
                            'subject_code': subject_code,
                            'subject_name': subject_name,
                            'credits': credits,
                        }

                        outline_col = cols[10]
                        try:
                            link_element = outline_col.find_element(By.TAG_NAME, 'a')
                            outline_link = link_element.get_attribute('href')
                            data_row['outline_link'] = outline_link
                        except Exception:
                            logger.warning(f"No outline link found for {subject_code}.")
                            data_row['outline_link'] = None # Set None if there is no link

                        subjects.append(data_row)

        except Exception as e:
            logger.error(f"A critical error occurred during the overall crawling process: {e}")
            raise

        # Save data to file
        major_filepath = self.save_crawled_data(majors, "major")
        subject_filepath = self.save_crawled_data(subjects, "subject")
        major_subject_filepath = self.save_crawled_data(major_subject, "major_subject")

        return major_filepath, subject_filepath, major_subject_filepath

    def save_crawled_data(self, data, original_name):
        """
        Save the crawled data to a CSV file.

        Args:
            data (list): List of dictionaries containing crawled data.
            output_file (str): Path to the output CSV file.
        """
        file_name = f"{original_name}_{create_filename('csv')}"
        output_file = get_file_path(file_name, CRAWLED_DATA_FOLDER)

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
                logger.info(f"Crawled data saved to {output_file}.")
                return os.path.abspath(output_file)
            except Exception as e:
                logger.error(f"Failed to save DataFrame to CSV: {e}")
                return None

        return None


# if __name__ == "__main__":

#     url = "https://grad.hcmut.edu.vn/hv/tra_cuu_ctdt_ths.php?e=link"
#     crawler = WebDriver()

#     print(f"Starting crawl for: {url}")
#     output_filepath = crawler.crawl(url)
#     print(f"Crawling completed successfully: {output_filepath}")
