# The AI Product Manager Skill Framework (2026)

Synthesized from industry write-ups (IIT Kanpur PM knowledge hub, LinkedIn practitioner guides, fonzi.ai) and job-description analysis of 40+ live AI PM postings (see [04-Job-Board.md](04-Job-Board.md)). Eight core competencies:

## 1. AI & Machine Learning Fundamentals
You don't need to code models, but you must understand: supervised vs. unsupervised vs. reinforcement learning, what a neural network/transformer is, how LLMs are trained (pre-training → fine-tuning → RLHF/DPO), embeddings, and basic model-evaluation metrics (precision/recall, accuracy, perplexity, hallucination rate). This vocabulary is what lets you sit in a design review with ML engineers and ask the right questions.

## 2. Product Lifecycle Management for AI
AI products differ from deterministic software: they need continuous data pipelines, retraining, drift monitoring, and MLOps. Your PRDs need new sections: data requirements, model evaluation criteria, feedback-loop design, fallback/guardrail behavior, and a plan for post-launch model monitoring — not just a launch checklist.

## 3. Data Literacy & Strategy
Understand data collection, labeling/annotation, cleaning, storage, and governance well enough to make tradeoff calls (e.g., "do we have enough labeled data to justify fine-tuning, or should we use RAG/prompting instead?"). Data quality is now a product requirement, not just an engineering concern.

## 4. Product Thinking & Strategic Vision (unchanged, but higher stakes)
Defining the user problem, prioritizing by impact, and aligning AI capability to business outcomes — while resisting "AI for AI's sake." The best AI PMs kill more AI feature ideas than they ship, because probabilistic systems have a much higher bar for "does this actually help the user."

## 5. Technical Awareness of LLM Systems
Practical grasp of: LLM architectures at a conceptual level, context windows, prompting vs. fine-tuning vs. RAG vs. agents, token costs/latency tradeoffs, and why outputs are probabilistic (same input ≠ same output). This is what lets you scope realistic AI features instead of ones that sound good in a slide.

## 6. Experimentation & Evaluation
Design experiments and build "evals" — structured test sets that measure whether the AI is actually doing its job (accuracy, relevance, safety, tone). Monitor for model drift and quality regressions the same way you'd monitor uptime. Also: use GenAI tools yourself for research synthesis, persona drafting, and PRD generation, while keeping a human in the loop to validate outputs.

## 7. Ethical & Responsible AI
Fairness, transparency, explainability, bias mitigation, privacy, and regulatory awareness (EU AI Act, India's DPDP Act, sector rules in health/finance). Responsible-AI thinking has to be designed in at the PRD stage, not bolted on before launch.

## 8. Communication & Cross-functional Collaboration
Translate between data scientists, ML engineers, legal/compliance, and business stakeholders. Set realistic expectations with leadership about what AI can/can't do reliably, and manage the "it demoed great, why doesn't it work in production" gap.

---

## Self-assessment checklist

Rate yourself 1 (none) – 5 (expert) on each. Anything below 3 is a Week-1 priority in the roadmap.

- [ ] AI/ML fundamentals & vocabulary
- [ ] AI-specific product lifecycle & MLOps awareness
- [ ] Data literacy (collection → governance)
- [ ] AI-adjusted product strategy & prioritization
- [ ] LLM/agent technical fluency (prompting, RAG, fine-tuning, agents)
- [ ] Experimentation & evals design
- [ ] Responsible AI / governance
- [ ] Cross-functional AI communication

Next: [02-Learning-Roadmap.md](02-Learning-Roadmap.md)
