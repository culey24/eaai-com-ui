-- Tham chiếu nhanh / snapshot ban đầu của schema học vụ.
-- Triển khai thực tế (PostgreSQL + bcrypt + role admin + bảng chatbot): xem backend/init/*.sql và docs/DATABASE.md
--
-- 1. Tạo Database
 
 
-- 2. Tạo các kiểu ENUM
CREATE TYPE user_role_enum AS ENUM ('assistant', 'student');
CREATE TYPE user_class_enum AS ENUM ('IS-1', 'IS-2', 'IS-3');
CREATE TYPE gender_enum AS ENUM ('Male', 'Female', 'Other');
CREATE TYPE day_of_week_enum AS ENUM ('2', '3', '4', '5', '6', '7', 'CN');
CREATE TYPE study_status_enum AS ENUM ('Registered', 'Canceled', 'Completed', 'Failed', 'Absent');
 
 
-- 3. Table: Education_Levels
CREATE TABLE Education_Levels (
    level_id VARCHAR(10) PRIMARY KEY,
    level_name VARCHAR(50) NOT NULL
);
 
INSERT INTO Education_Levels (level_id, level_name) VALUES
('DH', 'Đại học'),
('CH', 'Cao học');
 
 
-- 4. Table: Training_Program_Types
CREATE TABLE Training_Program_Types (
    tpt_id SERIAL PRIMARY KEY,
    level_id VARCHAR(10) NOT NULL,
    tpt_name VARCHAR(100) NOT NULL,
    CONSTRAINT fk_level FOREIGN KEY (level_id) REFERENCES Education_Levels(level_id)
);
 
INSERT INTO Training_Program_Types (level_id, tpt_name) VALUES
('DH', 'Chính quy'),
('DH', 'Chất lượng cao'),
('CH', 'Thạc sĩ nghiên cứu'),
('CH', 'Thạc sĩ ứng dụng');
 
 
-- 5. Table: Majors
CREATE TABLE Majors (
    major_code VARCHAR(7) PRIMARY KEY,
    major_name VARCHAR(200) NOT NULL
);
 
INSERT INTO Majors (major_code, major_name) VALUES
('0000000', 'Test major');
 
 
-- 6. Table: Users
--    Tham chiếu app frontend/ (src/context/AuthContext.jsx, constants/roles.js):
--    - user_role 'student'  <-> LEARNER (đăng ký / demo learner).
--    - user_role 'assistant'  <-> ASSISTANT / supporter (quản lý lớp; Class_Teachers.assistant_id).
--    - ADMIN: hiện chưa có trong user_role_enum; khi tích hợp nên mở rộng ENUM hoặc bảng Roles riêng.
--    - user_class (IS-1, IS-2, IS-3) <-> VALID_CLASS_CODES / kênh chat theo lớp (CLASS_TO_CHANNEL).
--    - pwd: trong production thay bằng hash (bcrypt/argon2), không lưu plain text như dữ liệu mẫu.
--    - Ghi danh nhiều lớp học phần: Class_Students + Classes; user_class trên Users có thể dùng làm
--      lớp “mặc định” cho chat hoặc bỏ dần nếu chỉ lấy từ Class_Students.
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
 
INSERT INTO Users (user_id, username, pwd, fullname, user_role, date_of_birth, gender, major, training_program_type, citizen_identification, date_of_issue, place_of_issue, ethnicity, religion, permanent_address, contact_address, phone_number, email, user_class) VALUES
('T24001', 'gv_a', '123456', 'Nguyễn Văn A', 'assistant', '1980-05-15', 'Male', '0000000', '', '001123456789', '2010-01-20', 'Hà Nội', 'Kinh', 'Không', 'Số 1, đường ABC, Hà Nội', 'Số 1, đường ABC, Hà Nội', '0912345678', 'a.nguyen@example.com', NULL),
('2400001', 'sv_x', '123456', 'Lê Văn X', 'student', '2000-03-25', 'Male', '0000000', 'Chính quy', '003111222333', '2018-02-15', 'Đà Nẵng', 'Kinh', 'Không', 'Số 10, đường PQR, Đà Nẵng', 'Số 20, đường QRS, TP.HCM', '0901234567', 'x.le@example.com', NULL);
 
 
-- 7. Table: Subjects
CREATE TABLE Subjects (
    subject_code VARCHAR(10) PRIMARY KEY,
    subject_name VARCHAR(255) NOT NULL,
    level_id VARCHAR(10) NOT NULL,
    credits INT,
    outline TEXT,
    CONSTRAINT fk_subject_level FOREIGN KEY (level_id) REFERENCES Education_Levels(level_id)
);
 
INSERT INTO Subjects (subject_code, subject_name, level_id, credits, outline) VALUES
('Test001', 'Test 001', 'CH', 3, ''),
('Test002', 'Test 002', 'CH', 3, '');
 
 
-- 8. Table: Major_subject
CREATE TABLE Major_subject (
    ms_id SERIAL PRIMARY KEY,
    major_code VARCHAR(7) NOT NULL,
    subject_code VARCHAR(10) NOT NULL,
    CONSTRAINT fk_ms_major FOREIGN KEY (major_code) REFERENCES Majors(major_code),
    CONSTRAINT fk_ms_subject FOREIGN KEY (subject_code) REFERENCES Subjects(subject_code)
);
 
INSERT INTO Major_subject (major_code, subject_code) VALUES
('0000000', 'Test001'),
('0000000', 'Test002');
 
 
-- 9. Table: Semesters
CREATE TABLE Semesters (
    semester_id VARCHAR(5) PRIMARY KEY,
    semester_name VARCHAR(50) NOT NULL UNIQUE
);
 
INSERT INTO Semesters (semester_id, semester_name) VALUES
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
 
 
-- 10. Table: Classes
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
 
INSERT INTO Classes (class_id, class_code, subject_code, semester_id, day_of_week, start_lesson, end_lesson, room, teaching_weeks) VALUES
('20231_Test001_01', 'Test001.01', 'Test001', '20231', '4', 1, 3, 'A101', '1-15'),
('20231_Test002_01', 'Test002.01', 'Test002', '20231', '5', 4, 6, 'B202', '1-15');
 
 
-- 11. Table: Class_Students
CREATE TABLE Class_Students (
    id SERIAL PRIMARY KEY,
    student_id VARCHAR(10) NOT NULL,
    class_id VARCHAR(50) NOT NULL,
    study_status study_status_enum NOT NULL,
    score DECIMAL(4, 2),
    CONSTRAINT fk_cs_student FOREIGN KEY (student_id) REFERENCES Users(user_id),
    CONSTRAINT fk_cs_class FOREIGN KEY (class_id) REFERENCES Classes(class_id)
);
 
INSERT INTO Class_Students (student_id, class_id, study_status, score) VALUES
('2400001', '20231_Test001_01', 'Completed', 8.5),
('2400001', '20231_Test002_01', 'Registered', NULL);
 
 
-- 12. Table: Class_Teachers
CREATE TABLE Class_Teachers (
    id SERIAL PRIMARY KEY,
    assistant_id VARCHAR(10) NOT NULL,
    class_id VARCHAR(50) NOT NULL,
    CONSTRAINT fk_ct_assistant FOREIGN KEY (assistant_id) REFERENCES Users(user_id),
    CONSTRAINT fk_ct_class FOREIGN KEY (class_id) REFERENCES Classes(class_id)
);
 
INSERT INTO Class_Teachers (assistant_id, class_id) VALUES
('T24001', '20231_Test001_01'),
('T24001', '20231_Test002_01');
 