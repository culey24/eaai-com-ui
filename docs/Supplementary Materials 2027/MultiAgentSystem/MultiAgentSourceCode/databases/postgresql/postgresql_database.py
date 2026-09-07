import logging

import psycopg2

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s %(name)s:%(filename)s:%(lineno)d %(levelname)s %(process)d %(message)s'
)
logger = logging.getLogger(__name__)


class PostgreSQLDatabase:
    """
    A simple class to manage connections and perform basic CRUD operations with PostgreSQL.
    """
    def __init__(self, host, port, user, password, database):
        self.config = {
            'host': host, 'port': port,
            'user': user, 'password': password,
            'database': database
        }
        self.connection = None
        self.cursor = None

    def connect(self):
        try:
            self.connection = psycopg2.connect(**self.config)
            self.cursor = self.connection.cursor()
            # logger.info(f"Successfully connected to database: {self.config['database']}")
            return True
        except Exception as e:
            logger.error(f"Error connecting to PostgreSQL: {e}")
            return False

    def close(self):
        try:
            if self.cursor:
                self.cursor.close()
            if self.connection:
                self.connection.close()
                logger.info("PostgreSQL connection closed.")
        except Exception as e:
            logger.error(f"Error closing connection: {e}")

    def execute_query(self, query, params=None):
        """
        Execute data modification statements (INSERT, UPDATE, DELETE).
        """
        if not self.connection:
            logger.error("Not connected. Please call connect() first.")
            return None

        try:
            # params must be a tuple
            self.cursor.execute(query, params or ())
            self.connection.commit()
            # logger.info(f"Query executed successfully. {self.cursor.rowcount} rows affected.")
            return self.cursor.lastrowid if hasattr(self.cursor, 'lastrowid') else None
        except Exception as e:
            logger.error(f"Error executing query: {e}")
            return None

    def execute_many_query(self, query, params_list):
        """
        Thực thi chèn hoặc cập nhật hàng loạt dữ liệu (Bulk operation).
        params_list: Một danh sách các tuple [(val1, val2), (val1, val2), ...]
        """
        if not self.connection:
            logger.error("Database not yet connected. Please call connect() first.")
            return False

        if not params_list:
            logger.warning("The parameter list is empty; there's nothing to execute.")
            return True

        try:
            # Sử dụng executemany để tối ưu hiệu suất chèn nhiều dòng
            self.cursor.executemany(query, params_list)
            self.connection.commit()
            logger.info(f"Batch execution was successful. Affected the {self.cursor.rowcount} rows.")
            return True
        except Exception as e:
            if self.connection:
                self.connection.rollback() # Hoàn tác nếu gặp lỗi để tránh treo transaction
            logger.error(f"Error executing execute_many_query: {e}")
            return False

    def fetch_all(self, query, params=None):
        """
        Execute a SELECT query and return all results.
        """
        if not self.connection:
            logger.error("Not connected. Please call connect() first.")
            return None

        try:
            self.cursor.execute(query, params or ())
            results = self.cursor.fetchall()
            # logger.info(f"Query executed successfully. {len(results)} rows fetched.")
            return results
        except Exception as e:
            logger.error(f"Error executing query: {e}")
            return None
