import os
import csv
import json
import re

# Setup paths relative to the script directory
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
LISTALL_PATH = os.path.join(SCRIPT_DIR, 'EAAI - Chấm bài - LISTALL.csv')
QUESTIONS_JSON_PATH = os.path.join(SCRIPT_DIR, 'questions.json')
KET_QUA_TEST_DIR = os.path.join(SCRIPT_DIR, 'ket-qua-test')
OUTPUT_DIR = os.path.join(KET_QUA_TEST_DIR, 'an-danh')

# Ensure output directory exists
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Helper function to normalize Vietnamese names for matching fallback
def normalize_name(s):
    if not s:
        return ''
    s = s.lower().strip()
    s = re.sub(r'\s+', ' ', s)
    # Simple accent removal for vietnamese
    accents = {
        'a': 'áàảãạăắằẳẵặâấầẩẫậ',
        'e': 'éèẻẽẹêếềểễệ',
        'i': 'íìỉĩị',
        'o': 'óòỏõọôốồổỗộơớờởỡợ',
        'u': 'úùủũụưứừửữự',
        'y': 'ýỳỷỹỵ',
        'd': 'đ'
    }
    for char, group in accents.items():
        for g in group:
            s = s.replace(g, char)
    return s.replace(' ', '')

# 1. Load and update LISTALL.csv with anonymized student IDs
students = []
header = []

if os.path.exists(LISTALL_PATH):
    with open(LISTALL_PATH, mode='r', encoding='utf-8') as f:
        reader = csv.reader(f)
        header = next(reader)
        for row in reader:
            if row:
                students.append(row)

# Check if ID_MAPPED column already exists
id_mapped_idx = -1
for i, h in enumerate(header):
    if h == 'ID_MAPPED':
        id_mapped_idx = i
        break

if id_mapped_idx == -1:
    header.append('ID_MAPPED')
    id_mapped_idx = len(header) - 1
    # Generate new IDs sequentially
    for idx, student in enumerate(students):
        student_id = f"STUDENT_{idx + 1:03d}"
        student.append(student_id)
else:
    # Ensure all rows have an ID, generate if missing
    for idx, student in enumerate(students):
        while len(student) < len(header):
            student.append('')
        if not student[id_mapped_idx]:
            student[id_mapped_idx] = f"STUDENT_{idx + 1:03d}"

# Write the updated LISTALL.csv back
with open(LISTALL_PATH, mode='w', encoding='utf-8', newline='') as f:
    writer = csv.writer(f)
    writer.writerow(header)
    writer.writerows(students)

print(f"Successfully verified/updated ID_MAPPED in {LISTALL_PATH}")

# Create matching lookups
# Header structure: Mã số ID, Họ, Tên, Địa chỉ thư điện tử, Nhóm, Tài khoản, ID_MAPPED
mssv_map = {}
username_map = {}
fullname_map = {}

# Index lookup for LISTALL
mssv_col_idx = 0
email_col_idx = 3
username_col_idx = 5

for student in students:
    student_id = student[id_mapped_idx]
    mssv = student[mssv_col_idx].strip()
    email = student[email_col_idx].strip()
    username = student[username_col_idx].strip()
    fullname = f"{student[1].strip()} {student[2].strip()}"

    if mssv:
        mssv_map[mssv] = student_id
    if username:
        username_map[username.lower()] = student_id
    if email:
        email_prefix = email.split('@')[0].lower()
        if email_prefix not in username_map:
            username_map[email_prefix] = student_id
    if fullname:
        fullname_map[normalize_name(fullname)] = student_id

# 2. Load questions.json
with open(QUESTIONS_JSON_PATH, 'r', encoding='utf-8') as f:
    questions_data = json.load(f)

# Section A Friendly Question Text Map
SECTION_A_TEXTS = {
    'yearOfStudy': '1. Current year of study',
    'gender': '2. Gender',
    'studentStatus': '3. Current status',
    'selfLearningScale': '4. Self-learning ability (1-5)',
    'topicFirst': '5. First topic selected for assessment',
    'topicSecond': '6. Second topic selected for assessment',
    'studiedTopic1': '7. Studied Topic 1 before?',
    'studiedTopic2': '8. Studied Topic 2 before?',
    'familiarityTopic1Scale': '9. Familiarity with Topic 1 (1-5)',
    'familiarityTopic2Scale': '10. Familiarity with Topic 2 (1-5)',
    'usedGenAi': '11. Used GenAI tools for learning?',
    'aiLearningFrequency': '12. Frequency of using AI for learning',
    'aiToolPrimary': '13. AI tool used most',
    'aiStudyPurpose': '14. Primary purpose of using AI',
    'attendedAiTraining': '15. Attended AI course or workshop?'
}

TOPIC_FRIENDLY_NAMES = {
    'association_rules_mining': 'Association Rules Mining',
    'recommender_system': 'Recommender System',
    'fuzzy_logic': 'Fuzzy Logic',
    'linear_regression': 'Linear Regression',
    'logistic_regression': 'Logistic Regression',
    'latent_dirichlet_allocation': 'Latent Dirichlet Allocation',
    'deep_neural_networks': 'Deep Neural Networks',
    'word_embedding': 'Word Embedding'
}

# 3. Process test results
files_to_process = [
    {
        'raw_name': 'pretest-submissions-2026-07-06.csv',
        'out_name': 'pretest.csv',
        'key': 'pretest'
    },
    {
        'raw_name': 'posttest-submissions-2026-07-06.csv',
        'out_name': 'posttest1.csv',
        'key': 'posttest'
    },
    {
        'raw_name': 'posttest2-submissions-2026-07-06.csv',
        'out_name': 'posttest2.csv',
        'key': 'posttest2'
    }
]

output_fields = ['student_id', 'question_id', 'question_text', 'reference_answer', 'student_answer', 'section', 'topic']

for file_info in files_to_process:
    raw_path = os.path.join(KET_QUA_TEST_DIR, file_info['raw_name'])
    out_path = os.path.join(OUTPUT_DIR, file_info['out_name'])

    if not os.path.exists(raw_path):
        print(f"Warning: Raw file {raw_path} not found. Skipping.")
        continue

    print(f"Processing {raw_path}...")
    output_rows = []
    skipped_count = 0
    mapped_count = 0

    with open(raw_path, mode='r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            # Map student
            sub_mssv = (row.get('mssv') or '').strip()
            sub_username = (row.get('username') or '').strip()
            sub_fullname = (row.get('fullname') or '').strip()

            student_id = None
            if sub_mssv in mssv_map:
                student_id = mssv_map[sub_mssv]
            elif sub_username.lower() in username_map:
                student_id = username_map[sub_username.lower()]
            elif normalize_name(sub_fullname) in fullname_map:
                student_id = fullname_map[normalize_name(sub_fullname)]

            if not student_id:
                # print(f"Skipping unmapped user: mssv={sub_mssv}, username={sub_username}")
                skipped_count += 1
                continue
            
            mapped_count += 1

            # --- Section A ---
            for field, q_text in SECTION_A_TEXTS.items():
                ans_key = f"sectionA_{field}"
                ans_val = row.get(ans_key, '')
                output_rows.append({
                    'student_id': student_id,
                    'question_id': ans_key,
                    'question_text': q_text,
                    'reference_answer': '',
                    'student_answer': ans_val,
                    'section': 'Section A',
                    'topic': ''
                })

            # --- Section B ---
            topic1 = row.get('sectionA_topicFirst', '')
            topic2 = row.get('sectionA_topicSecond', '')
            
            survey_qs = questions_data[file_info['key']]['sectionB']

            for topic_id in [topic1, topic2]:
                if not topic_id or topic_id not in survey_qs:
                    continue
                
                friendly_topic = TOPIC_FRIENDLY_NAMES.get(topic_id, topic_id)
                topic_questions = survey_qs[topic_id]

                for q in topic_questions:
                    q_id = q['id']  # e.g. "q1"
                    ans_key = f"sectionB_{topic_id}_{q_id}"
                    ans_val = row.get(ans_key, '')
                    output_rows.append({
                        'student_id': student_id,
                        'question_id': ans_key,
                        'question_text': q['text'],
                        'reference_answer': q['correctAnswer'],
                        'student_answer': ans_val,
                        'section': 'Section B',
                        'topic': friendly_topic
                    })

            # --- Section C ---
            survey_c_items = questions_data[file_info['key']]['sectionC']
            for item in survey_c_items:
                c_id = item['id']  # e.g. "c1"
                ans_key = f"sectionC_{c_id}"
                ans_val = row.get(ans_key, '')
                output_rows.append({
                    'student_id': student_id,
                    'question_id': ans_key,
                    'question_text': item['text'],
                    'reference_answer': '',
                    'student_answer': ans_val,
                    'section': 'Section C',
                    'topic': ''
                })

    # Write output CSV
    with open(out_path, mode='w', encoding='utf-8', newline='') as f:
        f.write('\ufeff')
        writer = csv.DictWriter(f, fieldnames=output_fields)
        writer.writeheader()
        writer.writerows(output_rows)

    print(f"Saved {len(output_rows)} rows to {out_path} (Mapped: {mapped_count}, Skipped test rows: {skipped_count})")

print("All tasks completed successfully!")
