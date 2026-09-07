import logging
import json

import psycopg2

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s %(name)s:%(filename)s:%(lineno)d %(levelname)s %(process)d %(message)s'
)
logger = logging.getLogger(__name__)


def tuple_to_dict(row: list, columns: list) -> dict:
    if not row:
        return {}
    return [dict(zip(columns, r)) for r in row]


def postgresql_getter(db, query, params=None, columns=[]):
    try:
        if db.connect():
            results = db.fetch_all(query, params)
            return tuple_to_dict(results, columns)
        return None
    except Exception as e:
        logger.error(f"Error when getting data: {e}")
        return None


def postgresql_setter(db, query, params):
    try:
        if db.connect():
            affected_rows = db.execute_query(query, params)
            return affected_rows
        return None
    except Exception as e:
        logger.error(f"Error when setting data: {e}")
        return None


# =======================================================================================
# SELECT Queries
# =======================================================================================


def query_user_account(user_name, password):
    columns = ["user_id", "user_role", "user_class"]
    query = """
    SELECT
        user_id, user_role::TEXT, user_class::TEXT
    FROM
        users
    WHERE
        username = %s AND pwd = %s;
    """
    return query, (user_name, password), columns

def get_user_account(db, user_name, password):
    return postgresql_getter(db, *query_user_account(user_name, password))


def query_user_role(user_id):
    columns = ["user_role", "user_class"]
    query = """
    SELECT
        user_role::TEXT, user_class::TEXT
    FROM
        users
    WHERE
        user_id = %s;
    """
    return query, (user_id,), columns

def get_user_role(db, user_id):
    return postgresql_getter(db, *query_user_role(user_id))


def query_user_info(user_id):
    columns = [
        "user_id", "username", "fullname", "user_role", "chat_role",
        "date_of_birth", "gender", "major_name", "training_program_type",
        "ethnicity", "religion", "permanent_address", "contact_address",
        "email", "phone_number", "user_class"
    ]
    query = """
    SELECT
        U.user_id, 
        U.username, 
        U.fullname, 
        U.user_role::TEXT,
        U.chat_role::TEXT,
        U.date_of_birth, 
        U.gender::TEXT,
        M.major_name, 
        U.training_program_type, 
        U.ethnicity, 
        U.religion,
        U.permanent_address, 
        U.contact_address, 
        U.email, 
        U.phone_number,
        U.user_class::TEXT
    FROM
        users AS U
    JOIN
        majors AS M ON U.major = M.major_code
    WHERE
        U.user_id = %s;
    """
    return query, (user_id,), columns

def get_user_info(db, user_id):
    return postgresql_getter(db, *query_user_info(user_id))


def query_learning_history(user_id):
    columns = ["subject_name", "outline"]
    query = """
    SELECT DISTINCT
        T3.subject_name, T3.outline
    FROM
        class_students AS T1
    JOIN
        classes AS T2 ON T1.class_id = T2.class_id
    JOIN
        subjects AS T3 ON T2.subject_code = T3.subject_code
    WHERE
        T1.student_id = %s 
        AND T1.study_status = 'Completed'::study_status_enum;
    """
    return query, (user_id,), columns


def get_learning_history_by_user_id(db, user_id):
    return postgresql_getter(db, *query_learning_history(user_id))


def query_student_current_schedule(user_id):
    columns = [
        "subject_name", "credits", "class_id", "day_of_week", 
        "start_lesson", "end_lesson", "room", "semester_id"
    ]
    query = """
    SELECT
        Sub.subject_name,
        Sub.credits,
        C.class_id,
        C.day_of_week::TEXT,
        C.start_lesson,
        C.end_lesson,
        C.room,
        S.semester_id
    FROM
        class_students AS CS
    JOIN
        classes AS C ON CS.class_id = C.class_id
    JOIN
        subjects AS Sub ON C.subject_code = Sub.subject_code
    JOIN
        semesters AS S ON C.semester_id = S.semester_id
    LEFT JOIN
        class_teachers AS CT ON C.class_id = CT.class_id
    LEFT JOIN
        users AS U_Teacher ON CT.teacher_id = U_Teacher.user_id 
        AND U_Teacher.user_role = 'teacher'::user_role_enum
    WHERE
        CS.student_id = %s
        AND CS.study_status = 'Registered'::study_status_enum;
    """
    return query, (user_id,), columns

def get_student_current_schedule(db, user_id):
    return postgresql_getter(db, *query_student_current_schedule(user_id))


def query_classes_by_student_id(student_id, semester_id=None):
    columns = [
        "semester_name", "class_code", "subject_name", 
        "day_of_week", "time_slot", "room"
    ]
    query = """
    SELECT
        S.semester_name,
        C.class_code,
        Sub.subject_name,
        C.day_of_week::TEXT,
        'Tiết ' || C.start_lesson || ' - ' || C.end_lesson AS time_slot,
        C.room
    FROM
        class_students AS CS
    JOIN
        classes AS C ON CS.class_id = C.class_id
    JOIN
        subjects AS Sub ON C.subject_code = Sub.subject_code
    JOIN
        semesters AS S ON C.semester_id = S.semester_id
    WHERE
        CS.student_id = %s
    """
    params = [student_id]

    if semester_id is not None:
        query += " AND C.semester_id = %s"
        params.append(semester_id)

    return query, tuple(params), columns

def get_classes_by_student_id(db, student_id, semester_id=None):
    return postgresql_getter(db, *query_classes_by_student_id(student_id, semester_id))


def query_teacher_classes(teacher_id, semester_id=None):
    columns = [
        "semester_name", "class_code", "subject_name", 
        "day_of_week", "time_slot", "room"
    ]
    query = """
    SELECT
        S.semester_name,
        C.class_code,
        Sub.subject_name,
        C.day_of_week::TEXT,
        'Tiết ' || C.start_lesson || ' - ' || C.end_lesson AS time_slot,
        C.room
    FROM
        classes AS C
    JOIN
        class_teachers AS CT ON C.class_id = CT.class_id
    JOIN
        subjects AS Sub ON C.subject_code = Sub.subject_code
    JOIN
        semesters AS S ON C.semester_id = S.semester_id
    WHERE
        CT.teacher_id = %s
    """
    params = [teacher_id]

    if semester_id is not None:
        query += " AND C.semester_id = %s"
        params.append(semester_id)

    return query, tuple(params), columns

def get_teacher_classes(db, teacher_id, semester_id=None):
    return postgresql_getter(db, *query_teacher_classes(teacher_id, semester_id))


def get_all_majors(db):
    columns = ["major_code", "major_name"]
    query = "SELECT * FROM majors"
    return postgresql_getter(db, query, None, columns)


def get_all_subjects(db):
    columns = ["subject_code", "subject_name", "level_id", "credits", "outline"]
    query = "SELECT * FROM subjects"
    return postgresql_getter(db, query, None, columns)


def get_all_semesters(db):
    columns = ["semester_id", "semester_name"]
    query = "SELECT * FROM semesters"
    return postgresql_getter(db, query, None, columns)


def get_subjects_by_major(db, major_code):
    columns = ["subject_code", "subject_name", "credits", "outline"]
    query = """
    SELECT
        Sub.subject_code, Sub.subject_name, Sub.credits, Sub.outline
    FROM
        major_subject AS MS
    JOIN
        subjects AS Sub ON MS.subject_code = Sub.subject_code
    WHERE
        MS.major_code = %s;
    """
    return postgresql_getter(db, query, (major_code,), columns)


def get_all_classes(db):
    columns = ["class_code", "subject_name", "semester_name", "day_of_week", "time_slot", "room"]
    query = """
    SELECT
        C.class_code, 
        Sub.subject_name, 
        S.semester_name, 
        C.day_of_week::TEXT, -- Ép kiểu ENUM sang TEXT
        'Tiết ' || C.start_lesson || ' - ' || C.end_lesson AS time_slot, 
        C.room
    FROM
        classes AS C
    JOIN
        subjects AS Sub ON C.subject_code = Sub.subject_code
    JOIN
        semesters AS S ON C.semester_id = S.semester_id;
    """
    return postgresql_getter(db, query, None, columns)


def get_classes_by_semester(db, semester_id):
    columns = ["class_code", "subject_name", "semester_name", "day_of_week", "time_slot", "room"]
    query = """
    SELECT
        C.class_code, 
        Sub.subject_name, 
        S.semester_name, 
        C.day_of_week::TEXT, 
        'Tiết ' || C.start_lesson || ' - ' || C.end_lesson AS time_slot, 
        C.room
    FROM
        classes AS C
    JOIN
        subjects AS Sub ON C.subject_code = Sub.subject_code
    JOIN
        semesters AS S ON C.semester_id = S.semester_id
    WHERE
        C.semester_id = %s;
    """
    return postgresql_getter(db, query, (semester_id,), columns)


def get_class_details(db, class_code):
    columns = [
        "class_code", "subject_name", "semester_name",
        "day_of_week", "time_slot", "room", "teachers"
    ]
    query = """
    SELECT
        C.class_code, 
        Sub.subject_name, 
        S.semester_name, 
        C.day_of_week::TEXT,
        'Tiết ' || C.start_lesson || ' - ' || C.end_lesson AS time_slot, 
        C.room,
        string_agg(U.fullname, ', ') AS teachers
    FROM
        classes AS C
    JOIN
        subjects AS Sub ON C.subject_code = Sub.subject_code
    JOIN
        semesters AS S ON C.semester_id = S.semester_id
    LEFT JOIN
        class_teachers AS CT ON C.class_id = CT.class_id
    LEFT JOIN
        users AS U ON CT.teacher_id = U.user_id 
        AND U.user_role = 'teacher'::user_role_enum
    WHERE
        C.class_code = %s
    GROUP BY
        C.class_code, 
        Sub.subject_name, 
        S.semester_name, 
        C.day_of_week, 
        C.start_lesson, 
        C.end_lesson, 
        C.room;
    """
    return postgresql_getter(db, query, (class_code,), columns)


def get_students_by_class(db, class_code):
    columns = ["user_id", "fullname", "email", "phone_number"]
    query = """
    SELECT
        U.user_id, 
        U.fullname, 
        U.email, 
        U.phone_number
    FROM
        class_students AS CS
    JOIN
        classes AS C ON CS.class_id = C.class_id
    JOIN
        users AS U ON CS.student_id = U.user_id 
        AND U.user_role = 'student'::user_role_enum
    WHERE
        C.class_code = %s;
    """
    return postgresql_getter(db, query, (class_code,), columns)


def get_sessions_by_user_id(db, user_id):
    columns = ["session_id", "session_status", "created_at"]
    query = """
    SELECT
        session_id, session_status,
        TO_CHAR(created_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS created_at
    FROM
        sessions
    WHERE
        user_id = %s;
    """
    return postgresql_getter(db, query, (user_id,), columns)


def get_conversations_by_session_id(db, session_id):
    columns = [
        "conversation_id", "chat_role", "content", "files", 
        "dynamic_profile", "tokens_count", "created_at"
    ]
    query = """
    SELECT
        conversation_id, chat_role::TEXT, content, files, dynamic_profile, tokens_count,
        TO_CHAR(created_at, 'YYYY-MM-DD HH24:MI:SS') AS created_at
    FROM
        Conversations
    WHERE
        session_id = %s
    ORDER BY
        created_at ASC;
    """
    return postgresql_getter(db, query, (session_id,), columns)


# =======================================================================================
# INSERT Queries
# =======================================================================================


def query_insert_major(major_code, major_name):
    query = """
    INSERT INTO majors (major_code, major_name) VALUES (%s, %s)
    ON CONFLICT (major_code) DO NOTHING;
    """
    return query, (major_code, major_name)

def insert_major(db, major_code, major_name):
    return postgresql_setter(db, *query_insert_major(major_code, major_name))


def query_insert_user(
    user_id, username, pwd, fullname, user_role, chat_role, date_of_birth, gender, major,
    training_program_type, citizen_identification, date_of_issue, place_of_issue,
    ethnicity, religion, permanent_address, contact_address, phone_number, email,
    user_class=None
):
    query = """
    INSERT INTO users (
        user_id, username, pwd, fullname, user_role, chat_role, date_of_birth, gender, major, 
        training_program_type, citizen_identification, date_of_issue, place_of_issue, 
        ethnicity, religion, permanent_address, contact_address, phone_number, email, user_class
    )
    VALUES (
        %s, %s, %s, %s, %s::user_role_enum, %s::chat_role_enum, %s, %s::gender_enum, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s::user_class_enum
    )
    ON CONFLICT (user_id) DO NOTHING;
    """
    params = (
        user_id, username, pwd, fullname, user_role, chat_role, date_of_birth, gender, major,
        training_program_type, citizen_identification, date_of_issue, place_of_issue,
        ethnicity, religion, permanent_address, contact_address, phone_number, email,
        user_class
    )
    return query, params

def insert_user(
    db, user_id, username, pwd, fullname, user_role, chat_role, date_of_birth, gender, major,
    training_program_type, citizen_identification, date_of_issue, place_of_issue,
    ethnicity, religion, permanent_address, contact_address, phone_number, email,
    user_class=None
):
    return postgresql_setter(
        db, *query_insert_user(
            user_id, username, pwd, fullname, user_role, chat_role, date_of_birth, gender, major,
            training_program_type, citizen_identification, date_of_issue, place_of_issue,
            ethnicity, religion, permanent_address, contact_address, phone_number, email,
            user_class
        )
    )


def query_insert_subject(subject_code, subject_name, level_id, credits, outline):
    if isinstance(outline, (dict, list)):
        outline = json.dumps(outline)

    query = """
    INSERT INTO subjects (subject_code, subject_name, level_id, credits, outline)
    VALUES (%s, %s, %s, %s, %s)
    ON CONFLICT (subject_code) DO NOTHING;
    """
    return query, (subject_code, subject_name, level_id, credits, outline)

def insert_subject(db, subject_code, subject_name, level_id, credits, outline):
    return postgresql_setter(
        db, *query_insert_subject(subject_code, subject_name, level_id, credits, outline)
    )


def query_insert_major_subject(major_code, subject_code):
    query = """
    INSERT INTO major_subject (major_code, subject_code) VALUES (%s, %s)
    ON CONFLICT (major_code, subject_code) DO NOTHING;
    """
    return query, (major_code, subject_code)

def insert_major_subject(db, major_code, subject_code):
    return postgresql_setter(db, *query_insert_major_subject(major_code, subject_code))


def query_insert_semester(semester_id, semester_name):
    query = """
    INSERT INTO semesters (semester_id, semester_name) VALUES (%s, %s)
    ON CONFLICT (semester_id) DO NOTHING;
    """
    return query, (semester_id, semester_name)

def insert_semester(db, semester_id, semester_name):
    return postgresql_setter(db, *query_insert_semester(semester_id, semester_name))


def query_insert_class(
    class_id, class_code, subject_code, semester_id, day_of_week,
    start_lesson, end_lesson, room, teaching_weeks
):
    query = """
    INSERT INTO classes (
        class_id, class_code, subject_code, semester_id, day_of_week,
        start_lesson, end_lesson, room, teaching_weeks
    ) VALUES (%s, %s, %s, %s, %s::day_of_week_enum, %s, %s, %s, %s)
    ON CONFLICT (class_id) DO NOTHING;
    """
    return query, (
        class_id, class_code, subject_code, semester_id, day_of_week,
        start_lesson, end_lesson, room, teaching_weeks
    )

def insert_class(
    db, class_id, class_code, subject_code, semester_id, day_of_week,
    start_lesson, end_lesson, room, teaching_weeks
):
    return postgresql_setter(
        db, *query_insert_class(
            class_id, class_code, subject_code, semester_id, day_of_week,
            start_lesson, end_lesson, room, teaching_weeks
        )
    )


def query_insert_class_student(student_id, class_id, study_status, score=None):
    query = """
    INSERT INTO class_students (student_id, class_id, study_status, score)
    VALUES (%s, %s, %s::study_status_enum, %s)
    ON CONFLICT (student_id, class_id) DO NOTHING;
    """
    return query, (student_id, class_id, study_status, score)

def insert_class_student(db, student_id, class_id, study_status, score=None):
    return postgresql_setter(
        db, *query_insert_class_student(student_id, class_id, study_status, score)
    )


def query_insert_class_teacher(teacher_id, class_id):
    query = """
    INSERT INTO class_teachers (teacher_id, class_id) VALUES (%s, %s)
    ON CONFLICT (teacher_id, class_id) DO NOTHING;
    """
    return query, (teacher_id, class_id)

def insert_class_teacher(db, teacher_id, class_id):
    return postgresql_setter(db, *query_insert_class_teacher(teacher_id, class_id))


def query_insert_session(session_id, user_id, session_status):
    query = """
    INSERT INTO sessions (session_id, user_id, session_status)
    VALUES (%s, %s, %s)
    ON CONFLICT (session_id) DO NOTHING;
    """
    return query, (session_id, user_id, session_status)

def insert_session(db, session_id, user_id, session_status):
    return postgresql_setter(
        db, *query_insert_session(session_id, user_id, session_status)
    )


def query_insert_conversation(
    session_id, chat_role, content, files, dynamic_profile, tokens_count
):
    query = """
    INSERT INTO conversations (session_id, chat_role, content, files, dynamic_profile, tokens_count)
    VALUES (%s, %s, %s, %s, %s, %s);
    """
    return query, (
        session_id, chat_role, content, files, dynamic_profile, tokens_count
    )

def insert_conversation(
    db, session_id, chat_role, content, files, dynamic_profile, tokens_count
):
    return postgresql_setter(
        db, *query_insert_conversation(
            session_id, chat_role, content, files, dynamic_profile, tokens_count
        )
    )


# =======================================================================================
# UPDATE Queries
# =======================================================================================


def query_update_subject_info(subject_code, subject_name, credits):
    query = """
    UPDATE subjects 
    SET subject_name = %s, credits = %s 
    WHERE subject_code = %s;
    """
    return query, (subject_name, credits, subject_code)

def update_subject_info(db, subject_code, subject_name, credits):
    return postgresql_setter(db, *query_update_subject_info(subject_code, subject_name, credits))


def query_update_subject_outline(subject_code, outline_content):
    if isinstance(outline_content, (dict, list)):
        outline_content = json.dumps(outline_content)

    query = """
    UPDATE subjects SET outline = %s WHERE subject_code = %s;
    """
    return query, (outline_content, subject_code)

def update_subject_outline(db, subject_code, outline_content):
    return postgresql_setter(
        db, *query_update_subject_outline(subject_code, outline_content)
    )


def query_update_user_contact(user_id, phone_number, email, contact_address):
    query = """
    UPDATE users 
    SET phone_number = %s, email = %s, contact_address = %s
    WHERE user_id = %s;
    """
    return query, (phone_number, email, contact_address, user_id)

def update_user_contact(db, user_id, phone_number, email, contact_address):
    return postgresql_setter(
        db, *query_update_user_contact(user_id, phone_number, email, contact_address)
)


def update_session_status(db, session_id, new_status):
    query = """
    UPDATE sessions 
    SET session_status = %s::session_status_enum, updated_at = CURRENT_TIMESTAMP
    WHERE session_id = %s;
    """
    return postgresql_setter(db, query, (new_status, session_id))


def update_conversation_tokens_count(db, conversation_id, tokens_count):
    query = """
    UPDATE conversations 
    SET tokens_count = %s
    WHERE conversation_id = %s;
    """
    return postgresql_setter(db, query, (tokens_count, conversation_id))
