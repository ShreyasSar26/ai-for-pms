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
  const haystack = `${title} ${description} ${(tags || []).join(' ')}`;
  return textHasAny(haystack, PM_KEYWORDS) && textHasAny(haystack, AI_KEYWORDS);
}

async function fetchRemotive() {
  try {
    const res = await fetch('https://remotive.com/api/remote-jobs?search=product%20manager');
    if (!res.ok) throw new Error(`Remotive HTTP ${res.status}`);
    const data = await res.json();
    return (data.jobs || [])
      .filter((j) => isRelevant(j.title, j.description, j.tags))
      .map((j) => ({
        title: j.title,
        company: j.company_name,
        location: j.candidate_required_location || 'Remote',
        url: j.url,
        source: 'Remotive',
        posted_date: j.publication_date ? j.publication_date.slice(0, 10) : null,
        remote: true,
        tags: j.tags || []
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
      .map((j) => ({
        title: j.title,
        company: j.company_name,
        location: j.location || (j.remote ? 'Remote' : ''),
        url: j.url,
        source: 'Arbeitnow',
        posted_date: j.created_at ? new Date(j.created_at * 1000).toISOString().slice(0, 10) : null,
        remote: !!j.remote,
        tags: j.tags || []
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
