import os
import click
import yaml
import pandas as pd
from dotenv import load_dotenv
 
import psycopg2
from psycopg2.extras import execute_values
 
load_dotenv()
 
 
def get_all_tables(connection):
    try:
        cursor = connection.cursor()
        cursor.execute("""
            SELECT table_schema, table_name
            FROM information_schema.tables
            ORDER BY table_schema, table_name
        """)
        tables = cursor.fetchall()
        return [table[1] for table in tables]
    except Exception as e:
        print(f"An error occurred: {e}")
        return []
    finally:
        cursor.close()
 
 
def create_table_ai_optimizations(connection, table_name="ai_optimizations"):
    try:
        cursor = connection.cursor()
 
        create_table_query = f'''
        CREATE TABLE IF NOT EXISTS "{table_name}" (
            id SERIAL PRIMARY KEY,
            device_id VARCHAR(50),
            summary TEXT,
            efficiency_score TEXT,
            technical_issues TEXT,
            action TEXT,
            priority TEXT,
            expected_impact TEXT,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        '''
 
        cursor.execute(create_table_query)
        connection.commit()
        print(f"Table '{table_name}' created successfully!")
 
    except Exception as e:
        print(f"An error occurred: {e}")
        connection.rollback()
 
    finally:
        cursor.close()
 
 
def drop_table(connection, table_name):
    try:
        cursor = connection.cursor()
 
        drop_query = f'DROP TABLE IF EXISTS "{table_name}";'
        cursor.execute(drop_query)
        connection.commit()
        print(f"Dropped table '{table_name}'.")
 
    except Exception as e:
        print(f"An error occurred: {e}")
 
    finally:
        cursor.close()
 
 
def describe_table(connection, table_name):
    try:
        cursor = connection.cursor()
 
        cursor.execute(f"""
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns
            WHERE table_name = '{table_name}';
        """)
 
        columns = cursor.fetchall()
        print(f"Table '{table_name}' structure: {columns}")
 
    except Exception as e:
        print(f"An error occurred: {e}")
 
    finally:
        cursor.close()
 
 
def get_data(connection, table_name, limit=10):
    try:
        cursor = connection.cursor()
 
        cursor.execute(f"""
            SELECT * FROM "{table_name}" LIMIT {limit};    
        """)
 
        columns = cursor.fetchall()
        for column in columns:
            print(column)
 
    except Exception as e:
        print(f"An error occurred: {e}")
 
    finally:
        cursor.close()
 
 
def insert_optimization(connection, data, table_name="ai_optimizations"):
    columns = [
        "device_id", "summary", "efficiency_score", "technical_issues",
        "action", "priority", "expected_impact"
    ]
    values = data[columns].apply(tuple, axis=1).tolist()
 
    try:
        cursor = connection.cursor()
        insert_query = f'''
            INSERT INTO "{table_name}" ({", ".join(columns)}) VALUES %s
        '''
        execute_values(cursor, insert_query, values)
        connection.commit()
        print(f"Inserted into '{table_name}'!")
    except Exception as e:
        print(f"An error occurred: {e}")
        connection.rollback()
    finally:
        cursor.close()
 
 
def main():
 
    ai_db = psycopg2.connect(
        host=os.getenv("POSTGRES_HOST"),
        port=int(os.getenv("POSTGRES_PORT")),
        user=os.getenv("POSTGRES_USER"),
        password=os.getenv("POSTGRES_PASSWORD"),
        database=os.getenv("POSTGRES_DB")
    )
    print("Connect to AI DB successfully!")
 
    # Get all tables
    # tables = get_all_tables(ai_db)
    # print(f"Tables in the database: {tables}")

    # Create table
    # create_table_ai_optimizations(connection=conn, table_name="training_program_types")
 
    # Describe table
    describe_table(connection=ai_db, table_name="training_program_types")
 
    get_data(connection=ai_db, table_name="training_program_types", limit=10)
 
    # drop_table(connection=conn, table_name="ai_optimizations")
 
    # sensor_db.close()
    # ai_db.close()
 
 
if __name__ == "__main__":
    main()
