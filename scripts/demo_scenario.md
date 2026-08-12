# Demo Script — Chatbot Conversation Flow

**Account:** `demo` / `demo123` (IS-1 learner, opened IS-1 AI Agent channel)

---

## 1. FAQ Agent — Quick Answer

> **User:** What is association rule mining?

→ FAQ pgvector match → concise answer from DB. No agent orchestration needed.

---

## 2. Provider Agent — Concept Explanation

> **User:** Explain linear regression in simple terms with an example.

→ Manager Agent routes to Provider → explains concept + KaTeX formula + real example.

---

## 3. Multi-turn: Follow-up Question

> **User:** How do I know if my linear regression model is good?

→ Same agent continues context → discusses R-squared, RMSE, residual plots.

---

## 4. Supporter Agent — Problem Solving

> **User:** I'm stuck on a problem. For a house price dataset, should I use linear regression or decision tree? Walk me through the decision.

→ Supporter Agent gives hints first, then step-by-step reasoning.

---

## 5. Suggestion Agent — Learning Materials

> **User:** Do you have any slides about neural networks?

→ Suggestion Agent returns relevant PDF slides with links.

---

## 6. Code Generation

> **User:** Show me Python code for a simple neural network in Keras.

→ Provider/Supporter returns code block with explanation.

---

## 7. Persona Adaptation (implicit)

> **User:** I'm a beginner, can you simplify backpropagation?

→ Persona Agent records "beginner level, knowledge gap: backpropagation" → subsequent answers adjust depth.

---

## 8. Reminder Agent

> **User:** When is my journal deadline?

→ Reminder Agent queries DB → returns period name + due date.

> **User:** Remind me 1 day before.

→ Confirms reminder created.

---

## 9. Quiz Generation

**Action:** Click "Gen Quiz" button on any assistant message.

→ Side panel opens with AI-generated quiz questions from that message.

---

## 10. Report Content

**Action:** Click "Report" on a reply.

→ Report submitted to admin.

---

## 11. IS-3 — Direct LLM Chat (switch channel)

> **User:** Compare supervised and unsupervised learning.

→ Raw Gemini response, no agent layer. Faster but less structure.

---

## 12. IS-2 — Human Supporter Chat (switch channel, second account)

**As learner:** "Can you check my assignment?"

**As assistant (browser 2):** Reply appears → polling delivers to learner.

---

## Optional: Show Language Switching

**Action:** Toggle to Vietnamese → ask same questions → bot responds in Vietnamese.
**Action:** Toggle back to English.

---

## Key Points to Highlight

| Feature | What it demonstrates |
|---------|---------------------|
| FAQ Agent | Semantic search, 1st-tier triage |
| Provider | Concept depth, personalization |
| Supporter | Socratic hinting, step-by-step |
| Suggestion | RAG on lecture slides |
| Persona | Dynamic learner profile |
| Reminder | Tool-based external data |
| Gen Quiz | AI → assessment |
| IS-2 vs IS-3 | Agentic vs raw LLM vs human |
| Language toggle | i18n end-to-end |
