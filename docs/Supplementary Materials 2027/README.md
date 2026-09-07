# Scaffolding Self-Learning with AI Agents: A Comparative Study of an AI-Agent Tutor, General-Purpose AI, and Human Mentors - Supplementary materials.

## Abstract.
General-purpose AI makes self-learning more accessible, but it often provides complete solutions rather than supporting learners in finding them. This may encourage cognitive offloading instead of independent reasoning. Human mentors provide such scaffolding, but one-to-one mentorship does not scale. We study whether a pedagogically constrained AI-agent tutor can provide a scalable alternative. We conduct a semester-long study with 100 computer-science students. Each student received one of three forms of support: an AI-agent tutor, a general-purpose AI assistant, or a human mentor. We measured learning before the course, immediately after it, and again two months later. The immediate posttest showed strong ceiling effects and could not distinguish the conditions. At the delayed posttest, however, the AI-tutor group scored 8.0 percentage points above the general-AI group after adjusting for pretest performance. The tutor group also performed better on an unseen application scenario and reported greater agency in using support for guidance rather than finished answers. These results suggest that pedagogically constrained AI support can scaffold self-learning in ways that persist after the support is removed.

## Supplementary Material overview.
This repository contains supplementary materials for reproducibility and verification of [Scaffolding Self-Learning with AI Agents: A Comparative Study of an AI-Agent Tutor, General-Purpose AI, and Human Mentors].

## Materials structure.
- `AgentManual`: This folder includes a manual document and a video guiding learners/users on How to use the interactive website system.
- `MentorProfile`: This folder includes an anonymized sheet of Mentors who participated in the Program as an Tutor.
- `MultiAgentSystem`: A detailed Description of the Multi Agent System used in this Program and its source code.
- `Results`: This folder includes scored submissions of learners, including Journals and Pretest/Posttest1/Posttest2 results (which is scored by Mentors).  
- `Slides`: Main lecture materials of the course, provided to Learners, and is used as course-related knowledge source.
- `Submissions`: Inital submitted tests and journals of the Learners before scoring.
    - For Pretest/Posttest1/Posttest2: This includes selection of Learners seperated by their ID.
    - For Journals: Journals of the Leaners are in compiled PDF format, may include personal information and different languages (maybe written in English or Vietnamese). Therefore, we may not provide it here, and we will decide to publish when the paper is accepted.
- `TestKey`: This folder includes a list of question-answer pairs, section information and topic related. This serves as ground truth for the three test Pretest/Posttest1/Posttest2
- `StudentID.csv`: A anonymized list of learners participated in this Program, grouped by Class code.

## Ethics Statement & Data Anonymization
- All student identifiers have been pseudonymized using randomly assigned ID (STUDENT-XXX). Any direct personal identifiers, institutional references, or contact details have been removed.
- Raw qualitative journals (Submissions/Journals) contain personal reflections in mixed languages (English and Vietnamese). To ensure strict adherence to participant privacy agreements, full raw text journals are withheld during review and will be selectively published or made available upon request post-acceptance.
- All experimental protocols involving human subjects were conducted with informed consent from participating computer science students.