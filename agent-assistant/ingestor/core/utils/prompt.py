# SUMMARIZING_DATA_PROMPT = """
# # Primary goal
# Summarize the following syllabus content in **Vietnamese** in two separate parts, each part is a paragraph:
 
# ## Part 1: Core knowledge:
# - Summarize the core understanding, principles, theories that the learner will **understand/know** after completing this module (START WITH: Về kiến thức,...).
 
# ## Part 2: Skills acquired:
# - Summarize the practical skills, analytical skills, application skills that the learner will **acquire** after completing this module (START WITH: Về kỹ năng,...).
 
# # MANDATORY REQUIREMENTS:
# 1. The output must be written in **TWO PARAGRAPHS** clearly.
# 2. Absolutely **DO NOT INCLUDE** information about teaching methods, assessment methods, or course structure.
# 3. The summary must be based entirely on the text provided below.
# 4. If the outline **does not** provide detailed information about the knowledge or skills acquired upon completion of the course, return **Không có thông tin**
# """


SUMMARIZING_DATA_PROMPT = """
# ROLE
You are an expert Academic Analyst. Your task is to extract and summarize educational content from the provided course syllabus (outline) into a structured JSON format.
 
# PRIMARY GOAL
Summarize the syllabus into the following specific categories in **Vietnamese**. The output must be a valid JSON object.
 
# JSON STRUCTURE & FIELD DESCRIPTIONS
1. "knowledge": Summarize core theories, principles, and academic concepts the student will master.
2. "skills": Summarize technical, soft, and analytical skills the student will acquire.
3. "attitude": Summarize the professional ethics, awareness, or responsibility developed.
4. "textbooks": List the main required textbooks or learning materials mentioned.
5. "brief_summary": A concise 2-3 sentence overview of the entire course.

# MANDATORY REQUIREMENTS
- Output Language: **Vietnamese** (for values).
- Output Format: **Strict JSON only**. No conversational text before or after the JSON.
- Content Source: Use **ONLY** the provided text.
- Missing Information: If any field cannot be found, set its value to "Không có thông tin".
- Exclusion: Do NOT include assessment methods, grading scales, or weekly schedules.
"""
