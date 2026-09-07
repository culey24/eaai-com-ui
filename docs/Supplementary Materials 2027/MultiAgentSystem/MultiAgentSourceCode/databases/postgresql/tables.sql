-- 1. Tạo Database


-- 2. Tạo các kiểu ENUM
CREATE TYPE user_role_enum AS ENUM ('teacher', 'student', 'TA');
CREATE TYPE user_class_enum AS ENUM ('IS-1', 'IS-2', 'IS-3');
CREATE TYPE gender_enum AS ENUM ('Male', 'Female', 'Other');
CREATE TYPE day_of_week_enum AS ENUM ('2', '3', '4', '5', '6', '7', 'CN');
CREATE TYPE study_status_enum AS ENUM ('Registered', 'Canceled', 'Completed', 'Failed', 'Absent');
CREATE TYPE session_status_enum AS ENUM ('active', 'deactive');
CREATE TYPE chat_role_enum AS ENUM ('user', 'model', 'TA');


-- 3. Table: education_levels
CREATE TABLE education_levels (
    level_id VARCHAR(10) PRIMARY KEY,
    level_name VARCHAR(50) NOT NULL
);

INSERT INTO education_levels (level_id, level_name) VALUES
('DH', 'Đại học'),
('CH', 'Cao học');


-- 4. Table: training_program_types
CREATE TABLE training_program_types (
    tpt_id SERIAL PRIMARY KEY,
    level_id VARCHAR(10) NOT NULL,
    tpt_name VARCHAR(100) NOT NULL,
    CONSTRAINT fk_level FOREIGN KEY (level_id) REFERENCES education_levels(level_id)
);

INSERT INTO training_program_types (level_id, tpt_name) VALUES
('DH', 'Chính quy'),
('DH', 'Chất lượng cao'),
('CH', 'Thạc sĩ nghiên cứu'),
('CH', 'Thạc sĩ ứng dụng');


-- 5. Table: majors
CREATE TABLE majors (
    major_code VARCHAR(7) PRIMARY KEY,
    major_name VARCHAR(200) NOT NULL
);
 
INSERT INTO majors (major_code, major_name) VALUES
('0000000', 'Test major');
 
 
-- 6. Table: users
CREATE TABLE users (
    user_id VARCHAR(10) PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    pwd VARCHAR(255) NOT NULL,
    fullname VARCHAR(100) NOT NULL,
    user_role user_role_enum NOT NULL,
    chat_role chat_role_enum,
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
    CONSTRAINT fk_major FOREIGN KEY (major) REFERENCES majors(major_code)
);
 
INSERT INTO users (user_id, username, pwd, fullname, user_role, chat_role, date_of_birth, gender, major, training_program_type, citizen_identification, date_of_issue, place_of_issue, ethnicity, religion, permanent_address, contact_address, phone_number, email, user_class) VALUES
('T24001', 'gv_a', '123456', 'Nguyễn Văn A', 'teacher', 'user', '1980-05-15', 'Male', '0000000', '', '001123456789', '2010-01-20', 'Hà Nội', 'Kinh', 'Không', 'Số 1, đường ABC, Hà Nội', 'Số 1, đường ABC, Hà Nội', '0912345678', 'a.nguyen@example.com', NULL),
('2400001', 'sv_x', '123456', 'Lê Văn X', 'student', 'user', '2000-03-25', 'Male', '0000000', 'Chính quy', '003111222333', '2018-02-15', 'Đà Nẵng', 'Kinh', 'Không', 'Số 10, đường PQR, Đà Nẵng', 'Số 20, đường QRS, TP.HCM', '0901234567', 'x.le@example.com', NULL);
 
 
-- 7. Table: subjects
CREATE TABLE subjects (
    subject_code VARCHAR(10) PRIMARY KEY,
    subject_name VARCHAR(255) NOT NULL,
    level_id VARCHAR(10) NOT NULL,
    credits INT,
    outline JSONB DEFAULT NULL,
    CONSTRAINT fk_subject_level FOREIGN KEY (level_id) REFERENCES education_levels(level_id)
);
 
INSERT INTO subjects (subject_code, subject_name, level_id, credits, outline) VALUES
('Test001', 'Test 001', 'CH', 3, NULL),
('Test002', 'Test 002', 'CH', 3, NULL);
 
 
-- 8. Table: major_subject
CREATE TABLE major_subject (
    ms_id SERIAL PRIMARY KEY,
    major_code VARCHAR(7) NOT NULL,
    subject_code VARCHAR(10) NOT NULL,
    CONSTRAINT fk_ms_major FOREIGN KEY (major_code) REFERENCES majors(major_code),
    CONSTRAINT fk_ms_subject FOREIGN KEY (subject_code) REFERENCES subjects(subject_code)
);
 
INSERT INTO major_subject (major_code, subject_code) VALUES
('0000000', 'Test001'),
('0000000', 'Test002');
 
 
-- 9. Table: semesters
CREATE TABLE semesters (
    semester_id VARCHAR(5) PRIMARY KEY,
    semester_name VARCHAR(50) NOT NULL UNIQUE
);
 
INSERT INTO semesters (semester_id, semester_name) VALUES
('20211', 'Học kỳ 1, Năm học 2021-2022'),
('20212', 'Học kỳ 2, Năm học 2021-2022'),
('20213', 'Học kỳ 3, Năm học 2021-2022'),
('20221', 'Học kỳ 1, Năm học 2022-2023'),
('20222', 'Học kỳ 2, Năm học 2022-2023'),
('20223', 'Học kỳ 3, Năm học 2022-2023'),
('20231', 'Học kỳ 1, Năm học 2023-2024'),
('20232', 'Học kỳ 2, Năm học 2023-2024'),
('20233', 'Học kỳ 3, Năm học 2023-2024'),
('20241', 'Học kỳ 1, Năm học 2024-2025'),
('20242', 'Học kỳ 2, Năm học 2024-2025'),
('20243', 'Học kỳ 3, Năm học 2024-2025'),
('20251', 'Học kỳ 1, Năm học 2025-2026'),
('20252', 'Học kỳ 2, Năm học 2025-2026'),
('20253', 'Học kỳ 3, Năm học 2025-2026');
 
 
-- 10. Table: classes
CREATE TABLE classes (
    class_id VARCHAR(50) PRIMARY KEY,
    class_code VARCHAR(20) NOT NULL,
    subject_code VARCHAR(10) NOT NULL,
    semester_id VARCHAR(5) NOT NULL,
    day_of_week day_of_week_enum,
    start_lesson INT,
    end_lesson INT,
    room VARCHAR(20),
    teaching_weeks VARCHAR(255),
    CONSTRAINT fk_class_subject FOREIGN KEY (subject_code) REFERENCES subjects(subject_code),
    CONSTRAINT fk_class_semester FOREIGN KEY (semester_id) REFERENCES semesters(semester_id)
);
 
INSERT INTO classes (class_id, class_code, subject_code, semester_id, day_of_week, start_lesson, end_lesson, room, teaching_weeks) VALUES
('20231_Test001_01', 'Test001.01', 'Test001', '20231', '4', 1, 3, 'A101', '1-15'),
('20231_Test002_01', 'Test002.01', 'Test002', '20231', '5', 4, 6, 'B202', '1-15');
 
 
-- 11. Table: class_students
CREATE TABLE class_students (
    id SERIAL PRIMARY KEY,
    student_id VARCHAR(10) NOT NULL,
    class_id VARCHAR(50) NOT NULL,
    study_status study_status_enum NOT NULL,
    score DECIMAL(4, 2),
    CONSTRAINT fk_cs_student FOREIGN KEY (student_id) REFERENCES users(user_id),
    CONSTRAINT fk_cs_class FOREIGN KEY (class_id) REFERENCES classes(class_id)
);
 
INSERT INTO class_students (student_id, class_id, study_status, score) VALUES
('2400001', '20231_Test001_01', 'Completed', 8.5),
('2400001', '20231_Test002_01', 'Registered', NULL);
 
 
-- 12. Table: class_teachers
CREATE TABLE class_teachers (
    id SERIAL PRIMARY KEY,
    teacher_id VARCHAR(10) NOT NULL,
    class_id VARCHAR(50) NOT NULL,
    CONSTRAINT fk_ct_teacher FOREIGN KEY (teacher_id) REFERENCES users(user_id),
    CONSTRAINT fk_ct_class FOREIGN KEY (class_id) REFERENCES classes(class_id)
);
 
INSERT INTO class_teachers (teacher_id, class_id) VALUES
('T24001', '20231_Test001_01'),
('T24001', '20231_Test002_01');


CREATE TABLE sessions (
    session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(10) NOT NULL,
    session_status session_status_enum DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_session_user FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE
);

INSERT INTO sessions (session_id, user_id) VALUES
('550e8400-e29b-41d4-a716-446655440000', '2400001');


CREATE TABLE conversations (
    conversation_id SERIAL PRIMARY KEY,
    session_id UUID NOT NULL,
    chat_role chat_role_enum NOT NULL,
    content TEXT NOT NULL,
    files JSONB DEFAULT NULL,
    dynamic_profile TEXT DEFAULT NULL,
    tokens_count INT DEFAULT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_conv_session FOREIGN KEY (session_id) REFERENCES sessions(session_id) ON DELETE CASCADE
);

INSERT INTO conversations (session_id, chat_role, content) VALUES 
('550e8400-e29b-41d4-a716-446655440000', 'user', 'Hi, cho mình hỏi hôm nay mình có lịch học môn nào không?'),
('550e8400-e29b-41d4-a716-446655440000', 'model', 'Chào bạn! Theo lịch học hiện tại, hôm nay bạn có môn "Lập trình Python" tại phòng A101 từ tiết 1 đến tiết 3. Bạn nhớ đi học đúng giờ nhé!'),
('550e8400-e29b-41d4-a716-446655440000', 'user', 'Cảm ơn nhé! À, mình có file đề cương môn học này ở đây, bạn tóm tắt giúp mình được không?');
