# Evaluation

This system acts as an "Auditor," running in parallel with or after the main system to assess quality.

## 1. Workflow

1. `Preparation:` Create a CSV file containing the `user_id`, `query`, and `expected_output`.
2. `Initialization:` Call the API `/insert_test_users` to prepare user data.
3. `Execution:`
    - Run Full System: Call API `/run_test_queries` with the environment variable `ENABLE_PERSONA=true`.
    - Run without Persona: Call API `/run_test_queries` with the environment variable `ENABLE_PERSONA=false`.
    - Response from ONLY Gemini: Call API `/run-only-gemini`.
4. `Evaluation:` Send the two resulting files to `/evaluate/ablation-study`.

## 2. APIs

### 2.1. Test Data Management

- Method: `POST /insert_test_users`
- Function: Automatically creates "mock users" based on CSV files.

### 2.2. Run Test Queries

- Method: `POST /run_test_queries`
- Function: Simulates real users sending questions in bulk.
- State Capture: Not only saves the answer, but also captures changes in dynamic_profile and user_context after each question.
- Retry Mechanism: Automatically retry when encountering model overload errors.

### 2.3. Quality Assessment

- Method: `POST /evaluate/llm-as-judge`
- Function: Uses a high-level LLM (GPT-4o) to score the answers.
- Scoring criteria (10 points):
    - `Personalization:` The ability to leverage data from both types of profiles.
    - `Accuracy:` Accuracy relative to Expected Output (Ground Truth).
    - `Context Adherence:` Adherence to contextual and tone constraints.

### 2.4. Ablation Study

- Method: `POST /evaluate/ablation-study`
- Function: Uses a high-level LLM (GPT-4o) to evaluate the answers from Ablated System (without Persona).
- Scoring criteria (10 points):
    - `Personalization:` The ability to leverage data from both types of profiles.
    - `Accuracy:` Accuracy relative to Expected Output (Ground Truth).
    - `Context Adherence:` Adherence to contextual and tone constraints.
