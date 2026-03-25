-- Schema cốt lõi (học vụ) — căn theo docs/recommended_table.sql, mở rộng user_role_enum cho ADMIN.

CREATE TYPE user_role_enum AS ENUM ('teacher', 'student', 'admin');
CREATE TYPE user_class_enum AS ENUM ('IS-1', 'IS-2', 'IS-3');
CREATE TYPE gender_enum AS ENUM ('Male', 'Female', 'Other');
CREATE TYPE day_of_week_enum AS ENUM ('2', '3', '4', '5', '6', '7', 'CN');
CREATE TYPE study_status_enum AS ENUM ('Registered', 'Canceled', 'Completed', 'Failed', 'Absent');

CREATE TABLE Education_Levels (
    level_id VARCHAR(10) PRIMARY KEY,
    level_name VARCHAR(50) NOT NULL
);

CREATE TABLE Training_Program_Types (
    tpt_id SERIAL PRIMARY KEY,
    level_id VARCHAR(10) NOT NULL,
    tpt_name VARCHAR(100) NOT NULL,
    CONSTRAINT fk_level FOREIGN KEY (level_id) REFERENCES Education_Levels(level_id)
);

CREATE TABLE Majors (
    major_code VARCHAR(7) PRIMARY KEY,
    major_name VARCHAR(200) NOT NULL
);

CREATE TABLE Users (
    user_id VARCHAR(10) PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    pwd VARCHAR(255) NOT NULL,
    fullname VARCHAR(100) NOT NULL,
    user_role user_role_enum NOT NULL,
    date_of_birth DATE NOT NULL,
    gender gender_enum NOT NULL,
    major VARCHAR(7) NOT NULL,
    training_program_type VARCHAR(100) NOT NULL,
    citizen_identification VARCHAR(20) UNIQUE,
    date_of_issue DATE,
    place_of_issue VARCHAR(100),
    ethnicity VARCHAR(50),
    religion VARCHAR(50),
    permanent_address VARCHAR(255),
    contact_address VARCHAR(255),
    phone_number VARCHAR(15),
    email VARCHAR(100) UNIQUE,
    user_class user_class_enum,
    CONSTRAINT fk_major FOREIGN KEY (major) REFERENCES Majors(major_code)
);

CREATE TABLE Subjects (
    subject_code VARCHAR(10) PRIMARY KEY,
    subject_name VARCHAR(255) NOT NULL,
    level_id VARCHAR(10) NOT NULL,
    credits INT,
    outline TEXT,
    CONSTRAINT fk_subject_level FOREIGN KEY (level_id) REFERENCES Education_Levels(level_id)
);

CREATE TABLE Major_subject (
    ms_id SERIAL PRIMARY KEY,
    major_code VARCHAR(7) NOT NULL,
    subject_code VARCHAR(10) NOT NULL,
    CONSTRAINT fk_ms_major FOREIGN KEY (major_code) REFERENCES Majors(major_code),
    CONSTRAINT fk_ms_subject FOREIGN KEY (subject_code) REFERENCES Subjects(subject_code)
);

CREATE TABLE Semesters (
    semester_id VARCHAR(5) PRIMARY KEY,
    semester_name VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE Classes (
    class_id VARCHAR(50) PRIMARY KEY,
    class_code VARCHAR(20) NOT NULL,
    subject_code VARCHAR(10) NOT NULL,
    semester_id VARCHAR(5) NOT NULL,
    day_of_week day_of_week_enum,
    start_lesson INT,
    end_lesson INT,
    room VARCHAR(20),
    teaching_weeks VARCHAR(255),
    CONSTRAINT fk_class_subject FOREIGN KEY (subject_code) REFERENCES Subjects(subject_code),
    CONSTRAINT fk_class_semester FOREIGN KEY (semester_id) REFERENCES Semesters(semester_id)
);

CREATE TABLE Class_Students (
    id SERIAL PRIMARY KEY,
    student_id VARCHAR(10) NOT NULL,
    class_id VARCHAR(50) NOT NULL,
    study_status study_status_enum NOT NULL,
    score DECIMAL(4, 2),
    CONSTRAINT fk_cs_student FOREIGN KEY (student_id) REFERENCES Users(user_id),
    CONSTRAINT fk_cs_class FOREIGN KEY (class_id) REFERENCES Classes(class_id)
);

CREATE TABLE Class_Teachers (
    id SERIAL PRIMARY KEY,
    teacher_id VARCHAR(10) NOT NULL,
    class_id VARCHAR(50) NOT NULL,
    CONSTRAINT fk_ct_teacher FOREIGN KEY (teacher_id) REFERENCES Users(user_id),
    CONSTRAINT fk_ct_class FOREIGN KEY (class_id) REFERENCES Classes(class_id)
);
