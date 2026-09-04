# AI for Product Managers — Upskilling Hub &amp; CV Toolkit

An interactive, self-updating webpage for a Product Manager becoming "AI-ready": a skill framework, an 8-week learning roadmap, a curated resource library, a live + curated AI PM job feed, and an ATS/Workday CV rulebook with a STAR bullet coach and a full-CV verifier.

**Live site:** open `index.html` (via a local server, see below) or your published GitHub Pages URL once deployed.

## What's in here

| Path | Purpose |
|---|---|
| `index.html` + `assets/` | The interactive single-page app (tabs: Overview, Skill Framework, Roadmap, Resources, Jobs, CV Toolkit) |
| `assets/cv-engine.js` | The rule-based "agent" that scores a CV bullet and rewrites it into ATS/STAR form — runs entirely in the browser, free, no API key |
| `assets/llm.js` | Optional "bring your own API key" mode (OpenAI / Anthropic / Gemini) for higher-quality bullet rewrites — key stays in your browser's localStorage only |
| `data/*.json` | All content: skills, roadmap, resources, jobs, CV rulebook. Edit these to update the site — no HTML changes needed |
| `scripts/fetch-jobs.mjs` | Node script that pulls fresh AI PM listings from open, key-free job-board APIs (Remotive, Arbeitnow) into `data/jobs.json` |
| `.github/workflows/daily-update.yml` | GitHub Actions workflow that runs the fetch script daily and commits the refreshed job data |
| `01-04-*.md` | The original markdown write-ups these pages are built from (kept for offline/plain-text reading) |

## Running it locally

Browsers block `fetch()` of local JSON files opened via `file://`, so serve the folder instead of double-clicking `index.html`:

```powershell
npx serve -l 5500 .
# then open http://localhost:5500
```

To manually refresh the job feed:

```powershell
node scripts/fetch-jobs.mjs
```

## Deploying with daily auto-updates (GitHub Pages + Actions)

1. Create a new GitHub repo and push this folder's contents to it (`git init`, `git add -A`, `git commit`, then add the remote and push).
2. In the repo's **Settings → Pages**, set Source = "Deploy from a branch", branch = `main`, folder = `/ (root)`.
3. The included workflow (`.github/workflows/daily-update.yml`) runs every day at 03:17 UTC (and on-demand via the Actions tab → "Run workflow"), fetches fresh listings from Remotive + Arbeitnow, and commits `data/jobs.json` if anything changed. GitHub Pages automatically redeploys on every push.
4. LinkedIn/Naukri are **not** scraped automatically (both block bots and require JS rendering) — the "Jobs" tab keeps a manually curated snapshot from those platforms plus saved-search links so you can check them yourself.

## The CV Toolkit

- **Rulebook tab:** ATS/Workday formatting rules + the STAR framework for writing bullets, compiled from current ATS guidance (`data/cv-rulebook.json`).
- **Bullet Coach tab:** paste one statement/bullet → get a 0–100 rule-based score, specific issues (weak opener, passive voice, missing metric, pronouns, length), and an auto-rewrite. Optionally add your own OpenAI/Anthropic/Gemini API key for a fully generated rewrite (key never leaves your browser).
- **Full CV Verifier tab:** paste your whole CV (or upload `.docx`/`.pdf`/`.txt`) and optionally a target job description, to get an overall ATS-readiness score, section/contact-info checks, bullet-level issues, and a keyword-match report against the job description.

The verifier is a **best-effort text analysis** — it cannot see fonts, colors, tables, or images, so still run through the manual formatting checklist before submitting.

## Guiding principle

You do **not** need to become a data scientist. You need to be able to:
- Have a technically literate conversation with ML/AI engineers (architecture, tradeoffs, limitations).
- Make good product decisions under probabilistic, non-deterministic system behavior.
- Design responsibly (bias, safety, privacy) and measure quality (evals, not just uptime/latency).
- Use AI tools yourself to move faster (prompting, agents, no-code builders) as a personal productivity multiplier.
- Present your own experience the way an ATS and a hiring manager both need to see it.

Last compiled: September 2026. The job feed refreshes daily automatically; re-check the newsletter/course list in `data/resources.json` every 4–6 weeks since it doesn't auto-update.
