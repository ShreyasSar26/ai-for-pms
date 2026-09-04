/**
 * CVEngine — rule-based (offline, free) STAR / ATS resume analysis and rewriting.
 * No network calls. Pure functions; caller passes the loaded rulebook JSON.
 */
(function (global) {
  const STOPWORDS = new Set([
    'the','a','an','and','or','of','to','in','on','for','with','at','by','from','as','is','are',
    'was','were','be','been','being','this','that','these','those','it','its','into','than','then',
    'so','such','not','no','we','our','you','your','they','their','will','shall','can','may','also',
    'per','about','across','within','using','used','use','including','include','includes'
  ]);

  function flattenVerbs(actionVerbs) {
    return Object.values(actionVerbs || {}).flat().map((v) => v.toLowerCase());
  }

  function stripBulletMarker(text) {
    return text.replace(/^\s*[-•*▪◦‣]|\s*^\d+[.)]\s*/g, '').replace(/^\s*[-•*▪◦‣]\s*/, '').trim();
  }

  function wordCount(text) {
    return (text.trim().match(/\S+/g) || []).length;
  }

  function startsWithAny(text, phrases) {
    const t = text.toLowerCase().trimStart();
    return phrases.find((p) => t.startsWith(p.toLowerCase()));
  }

  function containsAny(text, phrases) {
    const t = text.toLowerCase();
    return phrases.filter((p) => t.includes(p.toLowerCase()));
  }

  function hasNumber(text) {
    return /\d/.test(text) || /[%$₹€£]/.test(text);
  }

  function detectPassive(text) {
    return /\b(was|were|is|are|been)\s+\w+ed\b/i.test(text) || /\bresponsible for\b/i.test(text);
  }

  function detectFirstPerson(text) {
    return /\b(I|my|me)\b/.test(text) || /^\s*we\b/i.test(text.trim());
  }

  function pickReplacementVerb(text, rulebook) {
    const t = text.toLowerCase();
    const verbs = rulebook.action_verbs || {};
    if (/team|cross-functional|stakeholder|align/.test(t)) return pick(verbs.leadership);
    if (/cost|time|efficien|process|manual|automat/.test(t)) return pick(verbs.improve_optimize);
    if (/launch|build|ship|feature|product|prototype/.test(t)) return pick(verbs.build_ship);
    if (/revenue|growth|user|adoption|retention/.test(t)) return pick(verbs.grow_increase);
    if (/data|research|analysis|metric/.test(t)) return pick(verbs.analyze_decide);
    if (/negotiat|partner|vendor|legal|compliance/.test(t)) return pick(verbs.influence_align);
    return pick(verbs.leadership);
  }

  function pick(arr) {
    if (!arr || !arr.length) return 'Led';
    return arr[0];
  }

  /**
   * Analyze a single CV bullet / statement.
   */
  function analyzeBullet(rawText, rulebook) {
    const text = stripBulletMarker(rawText || '');
    const issues = [];
    let score = 0;

    if (!text) {
      return { score: 0, issues: [{ level: 'bad', message: 'Enter a bullet point to analyze.' }], rewritten: '' };
    }

    const allVerbs = flattenVerbs(rulebook.action_verbs);
    const firstWord = (text.split(/\s+/)[0] || '').replace(/[^a-zA-Z]/g, '').toLowerCase();
    const weakOpener = startsWithAny(text, rulebook.weak_verbs_to_replace || []);
    const strongOpener = allVerbs.includes(firstWord);

    if (weakOpener) {
      issues.push({ level: 'bad', message: `Starts with a weak opener ("${weakOpener}"). Replace with a strong action verb.` });
    } else if (strongOpener) {
      score += 25;
      issues.push({ level: 'good', message: `Opens with a strong action verb ("${text.split(/\s+/)[0]}").` });
    } else {
      score += 10;
      issues.push({ level: 'warn', message: 'Doesn\'t clearly open with a recognized strong action verb — consider one from the rulebook list.' });
    }

    if (hasNumber(text)) {
      score += 25;
      issues.push({ level: 'good', message: 'Includes a quantified result (number/%/currency).' });
    } else {
      issues.push({ level: 'bad', message: 'No quantified result. Add a metric: %, $, time saved, users impacted, etc.' });
    }

    if (detectFirstPerson(text)) {
      issues.push({ level: 'warn', message: 'Contains a first-person pronoun (I/my/we) — resume bullets are implied first-person.' });
    } else {
      score += 15;
    }

    if (detectPassive(text)) {
      issues.push({ level: 'warn', message: 'Reads as passive voice ("was/were ___ed" or "responsible for"). Rewrite in active voice.' });
    } else {
      score += 15;
    }

    const wc = wordCount(text);
    if (wc < 8) {
      issues.push({ level: 'warn', message: `Only ${wc} words — likely too thin on evidence. Add method/context.` });
    } else if (wc > 35) {
      issues.push({ level: 'warn', message: `${wc} words — trim to ~1–2 lines (aim for 15–30 words).` });
    } else {
      score += 10;
    }

    const buzzwords = containsAny(text, ['team player', 'hardworking', 'detail-oriented', 'results-driven', 'synergy', 'self-starter', 'go-getter']);
    if (buzzwords.length) {
      issues.push({ level: 'warn', message: `Unsupported buzzword(s): ${buzzwords.join(', ')}. Back with a concrete example or remove.` });
    } else {
      score += 10;
    }

    score = Math.max(0, Math.min(100, score));

    return { score, issues, rewritten: rewriteBullet(text, rulebook, { weakOpener, strongOpener }) };
  }

  const GERUND_CLEANUP = [
    [/^working on\b/i, 'development of'],
    [/^helping with\b/i, 'support for'],
    [/^helping\b/i, 'supporting'],
    [/^working with\b/i, 'partnering with']
  ];

  function cleanupGerund(rest) {
    for (const [re, replacement] of GERUND_CLEANUP) {
      if (re.test(rest)) return rest.replace(re, replacement);
    }
    return rest;
  }

  function rewriteBullet(text, rulebook, ctx) {
    let out = text;

    // Replace weak opener with a contextual strong verb.
    if (ctx.weakOpener) {
      const re = new RegExp('^\\s*' + ctx.weakOpener.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      const rest = cleanupGerund(out.replace(re, '').trim());
      const verb = pickReplacementVerb(rest, rulebook);
      out = `${verb} ${rest}`;
    } else if (!ctx.strongOpener) {
      const verb = pickReplacementVerb(out, rulebook);
      out = `${verb} ${out.charAt(0).toLowerCase()}${out.slice(1)}`;
    }

    // Remove leading first-person pronouns.
    out = out.replace(/^\s*(I|We|My)\s+/i, (m) => (m.trim().toLowerCase() === 'i' ? '' : ''));

    // Soften mid-sentence passive "was responsible for".
    out = out.replace(/\bwas responsible for\b/gi, 'owned');
    out = out.replace(/\bresponsible for\b/gi, 'owning');

    // Capitalize first letter.
    out = out.charAt(0).toUpperCase() + out.slice(1);

    // Ensure it ends with a quantified-result placeholder if none present.
    if (!hasNumber(out)) {
      out = out.replace(/[.\s]*$/, '');
      out += ' — quantify the result, e.g., "(+18% conversion, saved 6 hrs/week, or $120K ARR)".';
    } else if (!/[.!]$/.test(out.trim())) {
      out = out.trim() + '.';
    }

    return out;
  }

  /**
   * Analyze a full CV's plain text.
   */
  function analyzeFullCV(text, rulebook, jobDescription) {
    const lines = (text || '').split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    const lower = (text || '').toLowerCase();

    const sectionKeywords = ['experience', 'education', 'skills', 'summary', 'projects', 'certifications', 'objective', 'profile'];
    const sectionsFound = sectionKeywords.filter((kw) =>
      lines.some((l) => l.length < 40 && new RegExp(`\\b${kw}\\b`, 'i').test(l))
    );

    const email = (text.match(/[\w.+-]+@[\w-]+\.[\w.-]+/) || [null])[0];
    const phone = (text.match(/(\+?\d[\d\s\-().]{7,}\d)/) || [null])[0];
    const linkedin = (text.match(/linkedin\.com\/[\w\-/]+/i) || [null])[0];

    const pronounMatches = (text.match(/\b(I|my|me)\b/g) || []).length;

    const bulletLines = lines.filter((l) => /^[-•*▪◦‣]|^\d+[.)]/.test(l) || (l.length > 25 && l.length < 220));
    const bulletAnalyses = bulletLines.slice(0, 60).map((l) => analyzeBullet(l, rulebook));
    const avgBulletScore = bulletAnalyses.length
      ? Math.round(bulletAnalyses.reduce((s, b) => s + b.score, 0) / bulletAnalyses.length)
      : 0;
    const missingMetricCount = bulletAnalyses.filter((b) => !hasNumber(b.rewritten) && b.issues.some((i) => /quantified/.test(i.message))).length;
    const passiveCount = bulletAnalyses.filter((b) => b.issues.some((i) => /passive/.test(i.message))).length;
    const weakOpenerCount = bulletAnalyses.filter((b) => b.issues.some((i) => /weak opener/.test(i.message))).length;

    const wc = wordCount(text);
    const estPages = Math.max(1, Math.round(wc / 500));

    let keywordMatch = null;
    if (jobDescription && jobDescription.trim()) {
      const jdWords = (jobDescription.toLowerCase().match(/[a-z][a-z0-9+.#-]{2,}/g) || [])
        .filter((w) => !STOPWORDS.has(w));
      const freq = {};
      jdWords.forEach((w) => (freq[w] = (freq[w] || 0) + 1));
      const topJdKeywords = Object.entries(freq)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 25)
        .map(([w]) => w);
      const aiKeywords = (rulebook.ai_pm_specific_keywords || []).map((k) => k.toLowerCase());
      const keywordPool = Array.from(new Set([...topJdKeywords, ...aiKeywords]));
      const matched = keywordPool.filter((k) => lower.includes(k));
      const missing = keywordPool.filter((k) => !lower.includes(k));
      keywordMatch = {
        matched,
        missing,
        percent: keywordPool.length ? Math.round((matched.length / keywordPool.length) * 100) : 0
      };
    }

    const formatWarnings = [];
    if (estPages > 2) formatWarnings.push(`Estimated ~${estPages} pages — trim to 1–2 pages.`);
    if (!email) formatWarnings.push('No email address detected.');
    if (!phone) formatWarnings.push('No phone number detected.');
    if (sectionsFound.length < 3) formatWarnings.push('Fewer than 3 standard section headings detected (Experience, Education, Skills, ...).');
    if (pronounMatches > 2) formatWarnings.push(`${pronounMatches} first-person pronoun(s) found — remove them.`);

    const sectionScore = Math.round((sectionsFound.length / sectionKeywords.length) * 100);
    const pronounPenalty = Math.min(20, pronounMatches * 4);
    let atsScore = Math.round(sectionScore * 0.25 + avgBulletScore * 0.45 - pronounPenalty * 0.5 +
      (keywordMatch ? keywordMatch.percent * 0.3 : 15));
    atsScore = Math.max(0, Math.min(100, atsScore));

    return {
      atsScore,
      wordCount: wc,
      estPages,
      sectionsFound,
      sectionKeywords,
      contact: { email, phone, linkedin },
      pronounMatches,
      bulletsAnalyzed: bulletAnalyses.length,
      avgBulletScore,
      missingMetricCount,
      passiveCount,
      weakOpenerCount,
      keywordMatch,
      formatWarnings,
      note: 'This is a best-effort text-based check. It cannot see fonts, colors, tables, or images — for full ATS confidence, also follow the formatting rulebook manually.'
    };
  }

  global.CVEngine = { analyzeBullet, analyzeFullCV, stripBulletMarker, wordCount };
})(typeof window !== 'undefined' ? window : globalThis);
