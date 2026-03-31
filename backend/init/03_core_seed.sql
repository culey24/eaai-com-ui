-- Dữ liệu tham chiếu + người dùng mẫu (mật khẩu đã hash bcrypt qua pgcrypto).

INSERT INTO Education_Levels (level_id, level_name) VALUES
('DH', 'Đại học'),
('CH', 'Cao học');

INSERT INTO Training_Program_Types (level_id, tpt_name) VALUES
('DH', 'Chính quy'),
('DH', 'Chất lượng cao'),
('CH', 'Thạc sĩ nghiên cứu'),
('CH', 'Thạc sĩ ứng dụng');

INSERT INTO Majors (major_code, major_name) VALUES
('0000000', 'Test major');

INSERT INTO Subjects (subject_code, subject_name, level_id, credits, outline) VALUES
('Test001', 'Test 001', 'CH', 3, ''),
('Test002', 'Test 002', 'CH', 3, '');

INSERT INTO Major_subject (major_code, subject_code) VALUES
('0000000', 'Test001'),
('0000000', 'Test002');

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

INSERT INTO Classes (class_id, class_code, subject_code, semester_id, day_of_week, start_lesson, end_lesson, room, teaching_weeks) VALUES
('20231_Test001_01', 'Test001.01', 'Test001', '20231', '4', 1, 3, 'A101', '1-15'),
('20231_Test002_01', 'Test002.01', 'Test002', '20231', '5', 4, 6, 'B202', '1-15');

-- Mật khẩu plain text tương ứng — xem docs/DATABASE.md
INSERT INTO Users (
    user_id, username, pwd, fullname, user_role, date_of_birth, gender, major, training_program_type,
    citizen_identification, date_of_issue, place_of_issue, ethnicity, religion,
    permanent_address, contact_address, phone_number, email, user_class
) VALUES
(
    'A00001', 'admin', crypt('admin123', gen_salt('bf')), 'Quản trị hệ thống', 'admin',
    '1990-01-01', 'Other', '0000000', 'Chính quy',
    '009000000001', '2015-01-01', 'TP.HCM', 'Kinh', 'Không',
    'HCMUT', 'HCMUT', '0900000001', 'admin@example.local', NULL
),
(
    'T24001', 'gv_a', crypt('123456', gen_salt('bf')), 'Nguyễn Văn A', 'support',
    '1980-05-15', 'Male', '0000000', 'Chính quy',
    '001123456789', '2010-01-20', 'Hà Nội', 'Kinh', 'Không',
    'Số 1, đường ABC, Hà Nội', 'Số 1, đường ABC, Hà Nội', '0912345678', 'a.nguyen@example.com', NULL
),
(
    'T24002', 'assistant1', crypt('assistant123', gen_salt('bf')), 'Supporter Một', 'support',
    '1985-06-10', 'Female', '0000000', 'Chính quy',
    '009000000002', '2012-03-01', 'Hà Nội', 'Kinh', 'Không',
    'Hà Nội', 'Hà Nội', '0911111111', 'assistant1@example.local', NULL
),
(
    'T24003', 'assistant2', crypt('assistant123', gen_salt('bf')), 'Supporter Hai', 'support',
    '1986-07-11', 'Male', '0000000', 'Chính quy',
    '009000000003', '2013-04-01', 'Đà Nẵng', 'Kinh', 'Không',
    'Đà Nẵng', 'Đà Nẵng', '0922222222', 'assistant2@example.local', NULL
),
(
    '2400001', 'sv_x', crypt('123456', gen_salt('bf')), 'Lê Văn X', 'student',
    '2000-03-25', 'Male', '0000000', 'Chính quy',
    '003111222333', '2018-02-15', 'Đà Nẵng', 'Kinh', 'Không',
    'Số 10, đường PQR, Đà Nẵng', 'Số 20, đường QRS, TP.HCM', '0901234567', 'x.le@example.com', NULL
),
(
    '2400002', 'demo', crypt('demo123', gen_salt('bf')), 'Sinh viên Demo', 'student',
    '2001-04-01', 'Female', '0000000', 'Chính quy',
    '009000000004', '2019-01-01', 'TP.HCM', 'Kinh', 'Không',
    'TP.HCM', 'TP.HCM', '0933333333', 'demo@example.local', 'IS-1'
);

INSERT INTO Class_Students (student_id, class_id, study_status, score) VALUES
('2400001', '20231_Test001_01', 'Completed', 8.5),
('2400001', '20231_Test002_01', 'Registered', NULL),
('2400002', '20231_Test001_01', 'Registered', NULL);

INSERT INTO Class_Teachers (assistant_id, class_id) VALUES
('T24001', '20231_Test001_01'),
('T24001', '20231_Test002_01'),
('T24002', '20231_Test001_01'),
('T24003', '20231_Test002_01');
