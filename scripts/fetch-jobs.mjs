// Fetches fresh AI Product Manager job listings from open, key-free job-board APIs
// and merges them into data/jobs.json (live_feed), leaving curated_snapshot untouched.
// Run: node scripts/fetch-jobs.mjs
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const JOBS_PATH = path.join(__dirname, '..', 'data', 'jobs.json');

const AI_KEYWORDS = [
  'ai', 'artificial intelligence', 'machine learning', 'ml', 'llm', 'generative ai',
  'genai', 'rag', 'nlp', 'agent', 'gpt', 'chatbot'
];
const PM_KEYWORDS = ['product manager', 'product owner', 'product lead'];

function textHasAny(text, keywords) {
  const t = (text || '').toLowerCase();
  return keywords.some((k) => t.includes(k));
}

function isRelevant(title, description, tags) {
  return textHasAny(title, PM_KEYWORDS) && textHasAny(title, AI_KEYWORDS);
}

function plainText(html = '') {
  return html
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function summarizeDescription(description) {
  const text = plainText(description);
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  const roleSentences = sentences.filter((sentence) =>
    /\b(role|product manager|you will|you'll|responsib|own|lead|drive|partner|build|deliver)\b/i.test(sentence)
  );
  return (roleSentences.length ? roleSentences : sentences).slice(0, 3).join(' ').trim().slice(0, 600);
}

function cvExpectations(title, description, tags = []) {
  const text = `${title} ${plainText(description)} ${tags.join(' ')}`.toLowerCase();
  const expectations = [
    ['roadmap', /roadmap|product strategy|vision/, 'Show product strategy, roadmap ownership, and prioritization outcomes.'],
    ['delivery', /launch|ship|delivery|go-to-market|gtm/, 'Quantify products or features launched and their customer or business impact.'],
    ['ai', /generative ai|genai|llm|machine learning|artificial intelligence|\bai\b/, 'Name the AI/ML systems you shipped and the model, data, or evaluation tradeoffs you owned.'],
    ['data', /metric|analytics|experiment|a\/b|data-driven/, 'Include metrics, experiments, and evidence used to make product decisions.'],
    ['leadership', /cross-functional|stakeholder|engineering|design|sales/, 'Demonstrate cross-functional leadership across engineering, design, data, and go-to-market teams.'],
    ['customer', /customer|user research|discovery/, 'Show customer discovery and how insights changed product decisions.']
  ];
  return expectations.filter(([, pattern]) => pattern.test(text)).slice(0, 4).map(([, , guidance]) => guidance);
}

function normalizeJob(job) {
  const description = plainText(job.description);
  return {
    ...job,
    description,
    summary: summarizeDescription(description),
    cv_expectations: cvExpectations(job.title, description, job.tags)
  };
}

async function fetchRemotive() {
  try {
    const res = await fetch('https://remotive.com/api/remote-jobs?search=product%20manager');
    if (!res.ok) throw new Error(`Remotive HTTP ${res.status}`);
    const data = await res.json();
    return (data.jobs || [])
      .filter((j) => isRelevant(j.title, j.description, j.tags))
      .map((j) => normalizeJob({
        title: j.title,
        company: j.company_name,
        location: j.candidate_required_location || 'Remote',
        url: j.url,
        source: 'Remotive',
        posted_date: j.publication_date ? j.publication_date.slice(0, 10) : null,
        remote: true,
        tags: j.tags || [],
        description: j.description || ''
      }));
  } catch (err) {
    console.error('Remotive fetch failed:', err.message);
    return [];
  }
}

async function fetchArbeitnow() {
  try {
    const res = await fetch('https://www.arbeitnow.com/api/job-board-api');
    if (!res.ok) throw new Error(`Arbeitnow HTTP ${res.status}`);
    const data = await res.json();
    return (data.data || [])
      .filter((j) => isRelevant(j.title, j.description, j.tags))
      .map((j) => normalizeJob({
        title: j.title,
        company: j.company_name,
        location: j.location || (j.remote ? 'Remote' : ''),
        url: j.url,
        source: 'Arbeitnow',
        posted_date: j.created_at ? new Date(j.created_at * 1000).toISOString().slice(0, 10) : null,
        remote: !!j.remote,
        tags: j.tags || [],
        description: j.description || ''
      }));
  } catch (err) {
    console.error('Arbeitnow fetch failed:', err.message);
    return [];
  }
}

function dedupe(jobs) {
  const seen = new Set();
  return jobs.filter((j) => {
    const key = `${j.title}|${j.company}|${j.url}`.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function main() {
  const [remotive, arbeitnow] = await Promise.all([fetchRemotive(), fetchArbeitnow()]);
  const merged = dedupe([...remotive, ...arbeitnow]).sort((a, b) => {
    return (b.posted_date || '').localeCompare(a.posted_date || '');
  });

  const raw = await readFile(JOBS_PATH, 'utf-8');
  const store = JSON.parse(raw);

  store.live_feed = {
    generated_at: new Date().toISOString(),
    sources: ['Remotive API', 'Arbeitnow API'],
    jobs: merged
  };

  await writeFile(JOBS_PATH, JSON.stringify(store, null, 2) + '\n', 'utf-8');
  console.log(`Wrote ${merged.length} live AI PM jobs to ${JOBS_PATH}`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
