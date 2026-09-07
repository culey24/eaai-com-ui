
-- Insert User
INSERT INTO users (user_id, username, pwd, fullname, user_role, chat_role, date_of_birth, gender, major, training_program_type, citizen_identification, date_of_issue, place_of_issue, ethnicity, religion, permanent_address, contact_address, phone_number, email) 
VALUES ('user', 'htphung', '123456', 'Huỳnh Tiểu Phụng', 'student', 'user', '2000-03-20', 'Female', '0000000', 'Chính quy', '000000000000', '2023-01-01', 'Bạc Liêu', 'Kinh', 'Không', 'Bạc Liêu', 'Q1, TPHCM', '0947036090', 'htphung2000@gmail.com')
ON CONFLICT (user_id) DO NOTHING;


-- Insert classes Học kỳ 20231
INSERT INTO classes (class_id, class_code, subject_code, semester_id, day_of_week, start_lesson, end_lesson, room, teaching_weeks) VALUES
('20231_CO5115_1_1', 'CO5115_1_1', 'CO5115', '20231', '4', 13, 15, 'B4-601', '36|37|38|--|--|--|42|43|44|45|'),
('20231_CO5115_1_2', 'CO5115_1_2', 'CO5115', '20231', '4', 13, 15, 'B4-601', '--|--|--|39|40|41|'),
('20231_CO5119_1_1', 'CO5119_1_1', 'CO5119', '20231', '5', 13, 15, 'B4-306', '--|--|--|--|--|41|42|43|44|45|'),
('20231_CO5119_1_2', 'CO5119_1_2', 'CO5119', '20231', '5', 13, 15, 'HANGOUT_TUONGTAC', '36|37|38|39|40|'),
('20231_CO5173_2', 'CO5173_2', 'CO5173', '20231', '6', 13, 15, 'B4-306', '36|37|38|39|40|41|42|43|44|45|46|47|48|'),
('20231_CO5097_1_1', 'CO5097_1_1', 'CO5097', '20231', '7', 7, 9, 'B4-505', '36|37|38|'),
('20231_CO5097_1_2', 'CO5097_1_2', 'CO5097', '20231', '7', 7, 9, 'B4-505', '-|--|--|39|40|41|42|43|44|'),
('20231_CO5097_1_3', 'CO5097_1_3', 'CO5097', '20231', '7', 10, 12, 'B4-505', '--|--|--|--|--|--|--|--|--|45|46|47|48|49|'),
('20231_CO5095_1_1', 'CO5095_1_1', 'CO5095', '20231', 'CN', 10, 12, 'B4-505', '--|--|--|--|--|--|42|43|44|--|46|47|48|'),
('20231_CO5095_1_2', 'CO5095_1_2', 'CO5095', '20231', 'CN', 10, 12, 'HANGOUT_TUONGTAC', '36|37|38|39|40|41|')
ON CONFLICT (class_id) DO NOTHING;


-- Insert class_students Học kỳ 20231
INSERT INTO class_students (student_id, class_id, study_status, score) VALUES
('user', '20231_CO5115_1_1', 'Completed', 6.2),
('user', '20231_CO5115_1_2', 'Completed', 6.2),
('user', '20231_CO5119_1_1', 'Completed', 5.7),
('user', '20231_CO5119_1_2', 'Completed', 5.7),
('user', '20231_CO5173_2', 'Completed', 7.2),
('user', '20231_CO5097_1_1', 'Completed', 7.5),
('user', '20231_CO5097_1_2', 'Completed', 7.5),
('user', '20231_CO5097_1_3', 'Completed', 7.5),
('user', '20231_CO5095_1_1', 'Completed', 6.2),
('user', '20231_CO5095_1_2', 'Completed', 6.2)
ON CONFLICT DO NOTHING;


-- Insert classes Học kỳ 20232
INSERT INTO classes (class_id, class_code, subject_code, semester_id, day_of_week, start_lesson, end_lesson, room, teaching_weeks) VALUES
('20232_CO5117_1', 'CO5117_1', 'CO5117', '20232', '4', 13, 15, 'B6-B03', '03|04|05|--|--|08|09|10|11|12|13|14|15|16|'),
('20232_CO5085_1', 'CO5085_1', 'CO5085', '20232', '5', 13, 15, 'B4-A06', '03|04|--|--|--|08|09|10|11|12|13|14|15|'),
('20232_CO5175_1', 'CO5175_1', 'CO5175', '20232', '6', 13, 15, 'B4-A05', '03|04|--|--|--|08|09|10|11|12|13|14|15|16|17|18|19|'),
('20232_CO5125_1_1', 'CO5125_1_1', 'CO5125', '20232', 'CN', 4, 6, 'B1-212', '--|--|--|--|--|--|--|--|11|12|13|--|15|16|'),
('20232_CO5125_1_2', 'CO5125_1_2', 'CO5125', '20232', 'CN', 4, 6, 'HANGOUT_TUONGTAC', '03|04|--|--|--|08|09|10|')
ON CONFLICT (class_id) DO NOTHING;


-- Insert class_students Học kỳ 20232
INSERT INTO class_students (student_id, class_id, study_status, score) VALUES
('user', '20232_CO5117_1', 'Absent', 13),
('user', '20232_CO5085_1', 'Failed', 2.8),
('user', '20232_CO5175_1', 'Completed', 6.3),
('user', '20232_CO5125_1_1', 'Completed', 4.0),
('user', '20232_CO5125_1_2', 'Completed', 4.0)
ON CONFLICT DO NOTHING;

-- Insert classes Học kỳ 20241
INSERT INTO classes (class_id, class_code, subject_code, semester_id, day_of_week, start_lesson, end_lesson, room, teaching_weeks) VALUES
('20241_GK5045_1', 'GK5045_1', 'GK5045', '20241', '3', 13, 15, 'B4-303', '37|38|39|40|41|42|43|44|45|46|'),
('20241_CO5117_1', 'CO5117_1', 'CO5117', '20241', '4', 13, 15, 'B1-314', '37|38|39|40|41|42|43|44|45|46|47|48|'),
('20241_CO5085_1_1', 'CO5085_1_1', 'CO5085', '20241', '5', 13, 15, 'B4-604', '37|--|--|--|--|--|--|--|45|46|'),
('20241_CO5085_1_2', 'CO5085_1_2', 'CO5085', '20241', '5', 13, 15, 'B4-604', '--|38|39|40|41|42|43|44|'),
('20241_CO5125_1_1', 'CO5125_1_1', 'CO5125', '20241', 'CN', 4, 6, 'B10-202', '--|--|--|--|--|--|--|44|'),
('20241_CO5125_1_2', 'CO5125_1_2', 'CO5125', '20241', 'CN', 4, 6, 'B4-401', '37|38|39|40|41|42|43|--|45|46|')
ON CONFLICT (class_id) DO NOTHING;

-- Insert class_students Học kỳ 20241
INSERT INTO class_students (student_id, class_id, study_status, score) VALUES
('user', '20241_GK5045_1', 'Completed', 7.3),
('user', '20241_CO5117_1', 'Completed', 7.2),
('user', '20241_CO5085_1_1', 'Completed', 7.6),
('user', '20241_CO5085_1_2', 'Completed', 7.6),
('user', '20241_CO5125_1_1', 'Completed', 7.7),
('user', '20241_CO5125_1_2', 'Completed', 7.7)
ON CONFLICT DO NOTHING;

-- Insert classes Học kỳ 20242
INSERT INTO classes (class_id, class_code, subject_code, semester_id, day_of_week, start_lesson, end_lesson, room, teaching_weeks) VALUES
('20242_GK5009_1', 'GK5009_1', 'GK5009', '20242', '2', 13, 15, 'B4-601', '03|--|--|06|07|08|09|10|11|12|13|14|'),
('20242_CO5135_1_1', 'CO5135_1_1', 'CO5135', '20242', '4', 13, 15, 'B4-A06', '--|--|--|--|07|08|09|10|--|12|--|--|15|16|'),
('20242_CO5135_1_2', 'CO5135_1_2', 'CO5135', '20242', '4', 13, 15, 'B4-A06', '--|--|--|--|--|--|--|--|11|--|13|14|'),
('20242_AS5113_1', 'AS5113_1', 'AS5113', '20242', 'CN', 2, 6, 'B4-601', '03|--|--|06|07|08|09|10|'),
('20242_CO5107_1', 'CO5107_1', 'CO5107', '20242', 'CN', 13, 15, 'DUTTRU_CS1', '03')
ON CONFLICT (class_id) DO NOTHING;

-- Insert class_students Học kỳ 20242
INSERT INTO class_students (student_id, class_id, study_status, score) VALUES
('user', '20242_GK5009_1', 'Completed', 6.9),
('user', '20242_CO5135_1_1', 'Completed', 7.3),
('user', '20242_CO5135_1_2', 'Completed', 7.3),
('user', '20242_AS5113_1', 'Completed', 7.6),
('user', '20242_CO5107_1', 'Completed', 9.5)
ON CONFLICT DO NOTHING;

-- Insert classes Học kỳ 20251
INSERT INTO classes (class_id, class_code, subject_code, semester_id, day_of_week, start_lesson, end_lesson, room, teaching_weeks) VALUES
('20251_CO5109_1', 'CO5109_1', 'CO5109', '20251', NULL, NULL, NULL, 'CS_LTK', '--|36|37|38|39|40|41|42|--|44|45|46|47|48|49|50|'),
('20251_CO5087_1', 'CO5087_1', 'CO5087', '20251', '2', 13, 15, 'B4-505', '--|--|37|38|39|40|41|42|--|44|45|46|'),
('20251_CO5179_1', 'CO5179_1', 'CO5179', '20251', '3', 13, 15, 'B4-505', '--|--|37|38|39|40|41|42|--|44|45|46|')
ON CONFLICT (class_id) DO NOTHING;

-- Insert class_students Học kỳ 20251
INSERT INTO class_students (student_id, class_id, study_status) VALUES
('user', '20251_CO5109_1', 'Registered'),
('user', '20251_CO5087_1', 'Registered'),
('user', '20251_CO5179_1', 'Registered')
ON CONFLICT DO NOTHING;
