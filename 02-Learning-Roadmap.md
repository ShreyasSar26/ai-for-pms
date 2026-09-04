# 8-Week AI PM Learning Roadmap

Designed for ~4–6 hours/week alongside a full-time PM job. Each week has a **Do** (hands-on, non-negotiable) and a **Consume** (reading/watching, ~2 hrs) list. Resource names are detailed in [03-Resource-Library.md](03-Resource-Library.md).

## Phase 1 — AI Literacy (Weeks 1–2)

### Week 1: How LLMs actually work
- **Do:** Create accounts on ChatGPT, Claude, and Gemini. Run the same 5 prompts across all three and log differences in tone, accuracy, and refusals in a simple spreadsheet — this builds intuition for probabilistic output fast.
- **Consume:** Andrej Karpathy's "Intro to Large Language Models" concept explainer (YouTube); DeepLearning.AI "Generative AI for Everyone" (Course, Week 1 module only).
- **Outcome:** You can explain tokens, context windows, and why the same prompt gives different answers.

### Week 2: The AI product landscape
- **Do:** Pick 3 AI products you use (e.g., Notion AI, GitHub Copilot, Perplexity) and write a 1-page teardown each: what's the core AI capability, where does it fail, how do they handle errors/fallbacks.
- **Consume:** Subscribe to *One Useful Thing* (Ethan Mollick) and read the last 5 posts; skim *Latent Space* archive for one "state of AI" roundup.
- **Outcome:** A mental map of what "good" AI UX looks like, and common failure patterns.

## Phase 2 — Technical Fluency (Weeks 3–4)

### Week 3: Prompting & RAG
- **Do:** Complete DeepLearning.AI's "ChatGPT Prompt Engineering for Developers" short course (free, ~1.5 hrs). Build one small project: a prompt template + a simple retrieval-augmented Q&A over a PDF using a no-code tool (e.g., NotebookLM or a low-code RAG builder).
- **Consume:** Read a primer on RAG vs. fine-tuning vs. prompting tradeoffs (search "RAG vs fine-tuning PM guide" — pick the top 2 results from reputable ML blogs).
- **Outcome:** You can correctly recommend prompting vs. RAG vs. fine-tuning for a given use case in a design review.

### Week 4: Agents & evaluation
- **Do:** Build a simple multi-step agent using a no-code/low-code tool (e.g., n8n, Zapier AI, or a LangChain template) that chains 2–3 actions (e.g., "read an email → summarize → draft a reply"). Then write 10 test cases (an "eval set") for it and manually score outputs.
- **Consume:** *Interconnects* (Nathan Lambert) — one deep post on model training/evals; explore Reforge or Maven course syllabi on "Applied AI for Product" to see what evaluation frameworks the industry uses.
- **Outcome:** You understand what an "eval" is and can design one — this is one of the most in-demand AI PM skills right now.

## Phase 3 — AI Product Craft (Weeks 5–6)

### Week 5: Writing AI-native PRDs
- **Do:** Rewrite one of your past (non-AI) PRDs as if it were an AI feature. Add sections for: data requirements, model/prompt choice and rationale, evaluation criteria, guardrails/fallback UX, and a monitoring plan for post-launch drift.
- **Consume:** Read Lenny's Newsletter's AI PM-focused posts and Aakash Gupta's (Product Growth) AI PM playbooks.
- **Outcome:** A portfolio-ready AI PRD template you can reuse.

### Week 6: Responsible AI & data strategy
- **Do:** Audit one of your team's (or a public) AI features for bias/fairness/privacy risks using a simple checklist (data provenance, consent, explainability, human-override path). Draft a one-page "Responsible AI checklist" for your org.
- **Consume:** Skim the EU AI Act risk-tiers summary and India's DPDP Act overview (official government or reputable law-firm summaries only); read one responsible-AI case study (e.g., a well-documented AI product failure/recall).
- **Outcome:** You can proactively flag ethical/compliance risk in a product review, not just react to legal's feedback.

## Phase 4 — Proof of Work (Weeks 7–8)

### Week 7: Build a small AI feature end-to-end
- **Do:** Using a no-code/low-code AI builder (e.g., Bubble + OpenAI API, Retool AI, or Voiceflow), ship one small working AI feature (a chatbot, summarizer, or classifier) end-to-end, including a basic eval and a simple usage dashboard.
- **Consume:** Watch 2–3 case-study videos of AI PMs at companies like OpenAI, Anthropic, or Microsoft describing how they scoped/shipped AI features (search their official YouTube/blog channels).

### Week 8: Portfolio & positioning
- **Do:** Compile Weeks 1–7 outputs into a portfolio: 1 AI product teardown, 1 AI PRD, 1 eval set, 1 responsible-AI checklist, 1 shipped mini-feature with a demo video/GIF. Update your LinkedIn/resume with AI PM keywords (LLM, RAG, agents, evals, MLOps, responsible AI) pulled from real job descriptions in [04-Job-Board.md](04-Job-Board.md).
- **Consume:** Re-read the self-assessment checklist in [01-Skill-Framework.md](01-Skill-Framework.md) and re-score yourself.
- **Outcome:** A tangible, interview-ready portfolio plus a resume tuned to what employers are actually asking for.

## After Week 8: Sustaining the habit

- Block 30 min/week to read your top 2–3 subscribed newsletters (see [03-Resource-Library.md](03-Resource-Library.md)).
- Ship one small AI-touchpoint experiment per quarter, even informally, to keep hands-on skills current.
- Re-run the self-assessment every quarter — this field moves fast enough that "current" has a ~6-month half-life.

Next: [03-Resource-Library.md](03-Resource-Library.md)
