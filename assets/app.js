/**
 * App bootstrap: fetches data, wires up tabs, and renders every panel.
 */
(function () {
  const DATA = {};
  const state = { activeTab: 'overview', resourceSub: 'newsletters', jobsSub: 'live', cvSub: 'rulebook' };

  const $ = (sel, root = document) => root.querySelector(sel);
  const $all = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  async function loadJSON(path) {
    const res = await fetch(path, { cache: 'no-store' });
    if (!res.ok) throw new Error(`Failed to load ${path}: ${res.status}`);
    return res.json();
  }

  async function boot() {
    try {
      const [skills, roadmap, resources, jobs, rulebook] = await Promise.all([
        loadJSON('data/skills.json'),
        loadJSON('data/roadmap.json'),
        loadJSON('data/resources.json'),
        loadJSON('data/jobs.json'),
        loadJSON('data/cv-rulebook.json')
      ]);
      Object.assign(DATA, { skills, roadmap, resources, jobs, rulebook });
      $('#status-badge').textContent = 'Data loaded';
      renderSkills();
      renderRoadmap();
      renderResources();
      renderJobs();
      renderCVRulebook();
      renderFooter();
    } catch (err) {
      $('#status-badge').textContent = 'Data load error';
      console.error(err);
      $('#app').insertAdjacentHTML(
        'afterbegin',
        `<div class="card"><strong>Couldn't load data files.</strong> If you opened this file directly (file://), run a local static server instead — see README.md. Error: ${escapeHtml(err.message)}</div>`
      );
    }
    wireTabs();
    wireBulletCoach();
    wireLLM();
    wireVerifier();
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  // ---------- Tabs ----------
  function wireTabs() {
    $all('.tab').forEach((btn) => {
      btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });
    $all('[data-goto]').forEach((el) => {
      el.addEventListener('click', () => switchTab(el.dataset.goto));
    });
    $('#resource-subtabs').addEventListener('click', (e) => {
      const btn = e.target.closest('.subtab');
      if (!btn) return;
      state.resourceSub = btn.dataset.sub;
      $all('#resource-subtabs .subtab').forEach((b) => b.classList.toggle('active', b === btn));
      renderResources();
    });
    $('#jobs-subtabs').addEventListener('click', (e) => {
      const btn = e.target.closest('.subtab');
      if (!btn) return;
      state.jobsSub = btn.dataset.sub;
      $all('#jobs-subtabs .subtab').forEach((b) => b.classList.toggle('active', b === btn));
      renderJobs();
    });
    $('#cv-subtabs').addEventListener('click', (e) => {
      const btn = e.target.closest('.subtab');
      if (!btn) return;
      state.cvSub = btn.dataset.sub;
      $all('#cv-subtabs .subtab').forEach((b) => b.classList.toggle('active', b === btn));
      $all('.cv-sub').forEach((p) => p.classList.toggle('active', p.id === 'cv-' + btn.dataset.sub));
    });
  }

  function switchTab(tab) {
    state.activeTab = tab;
    $all('.tab').forEach((b) => b.classList.toggle('active', b.dataset.tab === tab));
    $all('.panel').forEach((p) => p.classList.toggle('active', p.id === 'panel-' + tab));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // ---------- Skills ----------
  function renderSkills() {
    const { skills } = DATA;
    $('#skills-source').textContent = skills.source_note;
    $('#skills-grid').innerHTML = skills.competencies
      .map(
        (c) => `<div class="tile">
          <h4>${c.id}. ${escapeHtml(c.title)}<span class="tag">${skills.tag_legend[c.tag]}</span></h4>
          <p>${escapeHtml(c.description)}</p>
        </div>`
      )
      .join('');

    const saved = JSON.parse(localStorage.getItem('ai-pm-hub:self-assessment') || '{}');
    $('#self-assessment').innerHTML = skills.self_assessment
      .map(
        (label, i) => `<div class="row" style="justify-content:space-between; border-bottom:1px solid var(--border); padding:8px 0;">
          <span>${escapeHtml(label)}</span>
          <select data-idx="${i}" class="self-rate" style="width:80px;">
            ${[1, 2, 3, 4, 5].map((n) => `<option value="${n}" ${Number(saved[i]) === n ? 'selected' : ''}>${n}</option>`).join('')}
          </select>
        </div>`
      )
      .join('');
    $all('.self-rate').forEach((sel) => {
      sel.addEventListener('change', () => {
        const s = JSON.parse(localStorage.getItem('ai-pm-hub:self-assessment') || '{}');
        s[sel.dataset.idx] = sel.value;
        localStorage.setItem('ai-pm-hub:self-assessment', JSON.stringify(s));
      });
    });
  }

  // ---------- Roadmap ----------
  function renderRoadmap() {
    const { roadmap } = DATA;
    $('#roadmap-title').textContent = roadmap.title;
    $('#roadmap-intro').textContent = roadmap.intro;
    $('#roadmap-after').textContent = roadmap.after;
    $('#roadmap-phases').innerHTML = roadmap.phases
      .map(
        (phase) => `<h3 class="phase-title">${escapeHtml(phase.name)}</h3>` +
          phase.weeks
            .map(
              (w) => `<div class="card week-card">
                <h4>Week ${w.week}: ${escapeHtml(w.title)}</h4>
                <div class="kv"><b>Do:</b> ${escapeHtml(w.do)}</div>
                <div class="kv"><b>Consume:</b> ${escapeHtml(w.consume)}</div>
                <div class="kv"><b>Outcome:</b> ${escapeHtml(w.outcome)}</div>
              </div>`
            )
            .join('')
      )
      .join('');
  }

  // ---------- Resources ----------
  function renderResources() {
    const { resources } = DATA;
    const sub = state.resourceSub;
    let html = '';
    if (sub === 'newsletters') {
      html = `<div class="grid">${resources.newsletters
        .map(
          (n) => `<div class="tile"><h4>${n.url ? `<a href="${n.url}" target="_blank" rel="noopener">${escapeHtml(n.name)}</a>` : escapeHtml(n.name)}</h4>
            <p><b>${escapeHtml(n.author)}</b> — ${escapeHtml(n.focus)}</p></div>`
        )
        .join('')}</div>`;
    } else if (sub === 'youtube') {
      html = `<div class="grid">${resources.youtube
        .map((y) => `<div class="tile"><h4>${escapeHtml(y.channel)}</h4><p>${escapeHtml(y.best_for)}</p></div>`)
        .join('')}</div>`;
    } else if (sub === 'courses') {
      html = `<div class="grid">${resources.courses
        .map((c) => `<div class="tile"><h4>${escapeHtml(c.name)}</h4><p><b>${escapeHtml(c.provider)}</b> — ${escapeHtml(c.notes)}</p></div>`)
        .join('')}</div>`;
    } else if (sub === 'books') {
      html = `<div class="grid">${resources.books
        .map((b) => `<div class="tile"><h4>${escapeHtml(b.title)}</h4><p><b>${escapeHtml(b.author)}</b>${b.notes ? ' — ' + escapeHtml(b.notes) : ''}</p></div>`)
        .join('')}</div>`;
    } else if (sub === 'communities') {
      html = `<ul class="checklist">${resources.communities.map((c) => `<li>${escapeHtml(c)}</li>`).join('')}</ul>`;
    } else if (sub === 'tools') {
      html = `<div class="grid">${resources.tools
        .map((t) => `<div class="tile"><h4>${escapeHtml(t.category)}</h4><p>${t.items.map(escapeHtml).join(', ')}</p></div>`)
        .join('')}</div>`;
    }
    $('#resource-content').innerHTML = html;
  }

  // ---------- Jobs ----------
  function jobsTable(rows, cols) {
    return `<table class="jobs-table"><thead><tr>${cols.map((c) => `<th>${c.label}</th>`).join('')}</tr></thead>
      <tbody>${rows
        .map(
          (r) => `<tr>${cols
            .map((c) => `<td>${c.key === 'url' ? `<a href="${r.url}" target="_blank" rel="noopener">View →</a>` : escapeHtml(r[c.key] ?? '')}</td>`)
            .join('')}</tr>`
        )
        .join('')}</tbody></table>`;
  }

  function renderJobs() {
    const { jobs } = DATA;
    const sub = state.jobsSub;
    const live = jobs.live_feed;
    $('#jobs-live-meta').textContent = live.generated_at
      ? `Live feed last refreshed: ${new Date(live.generated_at).toLocaleString()} · Curated snapshot compiled: ${jobs.curated_snapshot.compiled_at}`
      : `Curated snapshot compiled: ${jobs.curated_snapshot.compiled_at} · Live feed not yet generated — run scripts/fetch-jobs.mjs`;

    let html = '';
    if (sub === 'live') {
      if (!live.jobs.length) {
        html = `<div class="card">No live feed data yet. Run <code>node scripts/fetch-jobs.mjs</code> locally, or wait for the daily GitHub Actions run.</div>`;
      } else {
        html = jobsTable(live.jobs, [
          { key: 'title', label: 'Role' },
          { key: 'company', label: 'Company' },
          { key: 'location', label: 'Location' },
          { key: 'source', label: 'Source' },
          { key: 'posted_date', label: 'Posted' },
          { key: 'url', label: '' }
        ]);
      }
    } else if (sub === 'india') {
      html = jobsTable(jobs.curated_snapshot.india, [
        { key: 'role', label: 'Role' },
        { key: 'company', label: 'Company' },
        { key: 'experience', label: 'Experience' },
        { key: 'location', label: 'Location' },
        { key: 'url', label: '' }
      ]);
    } else if (sub === 'global') {
      html = jobsTable(jobs.curated_snapshot.global, [
        { key: 'role', label: 'Role' },
        { key: 'company', label: 'Company' },
        { key: 'location', label: 'Location' },
        { key: 'url', label: '' }
      ]);
    }
    $('#jobs-content').innerHTML = html;
    $('#jobs-saved-searches').innerHTML = jobs.curated_snapshot.saved_searches
      .map((s) => `<div><a href="${s.url}" target="_blank" rel="noopener">${escapeHtml(s.label)}</a></div>`)
      .join('');
  }

  // ---------- CV Rulebook ----------
  function renderCVRulebook() {
    const { rulebook } = DATA;
    $('#cv-title').textContent = rulebook.title;
    $('#cv-subtitle').textContent = rulebook.subtitle;

    const star = rulebook.star_framework;
    $('#star-card').innerHTML = `
      <h3>The STAR framework for PM resume bullets</h3>
      <p class="muted">${escapeHtml(star.description)}</p>
      <div class="grid">
        ${star.components.map((c) => `<div class="tile"><h4>${escapeHtml(c.label)}</h4><p>${escapeHtml(c.guidance)}</p></div>`).join('')}
      </div>
      <p><b>Formula:</b> ${escapeHtml(star.formula)}</p>
      <p class="issue-ok"><b>✓ Good:</b> ${escapeHtml(star.good_example)}</p>
      <p class="issue-bad"><b>✗ Weak:</b> ${escapeHtml(star.weak_example)}</p>
    `;

    $('#cv-formatting-rules').innerHTML = rulebook.formatting_rules
      .map(
        (r) => `<div class="tile"><h4>${escapeHtml(r.rule)}<span class="rule-severity sev-${r.severity}">${r.severity}</span></h4><p>${escapeHtml(r.why)}</p></div>`
      )
      .join('');

    $('#cv-content-rules').innerHTML = rulebook.content_rules
      .map((r) => `<div class="tile"><h4>${escapeHtml(r.rule)}</h4><p>${escapeHtml(r.why)}</p></div>`)
      .join('');

    $('#cv-checklist').innerHTML = rulebook.master_checklist.map((c) => `<li>${escapeHtml(c)}</li>`).join('');
  }

  // ---------- Bullet coach ----------
  function scoreClass(score) {
    if (score >= 75) return 'score-good';
    if (score >= 45) return 'score-mid';
    return 'score-bad';
  }

  function renderBulletResult(result) {
    $('#bullet-result').innerHTML = `
      <div class="row">
        <span class="score-badge ${scoreClass(result.score)}">${result.score}</span>
        <span class="muted">Rule-based score out of 100</span>
      </div>
      <ul class="issue-list">
        ${result.issues.map((i) => `<li class="issue-${i.level === 'good' ? 'ok' : i.level === 'bad' ? 'bad' : 'warn'}">${escapeHtml(i.message)}</li>`).join('')}
      </ul>
      <div class="rewrite-box"><b>Suggested rewrite:</b><br>${escapeHtml(result.rewritten)}</div>
    `;
  }

  function wireBulletCoach() {
    $('#bullet-analyze').addEventListener('click', () => {
      const text = $('#bullet-input').value.trim();
      if (!text) return;
      const result = CVEngine.analyzeBullet(text, DATA.rulebook);
      renderBulletResult(result);
    });
  }

  // ---------- LLM (BYO key) ----------
  function wireLLM() {
    const providerSel = $('#llm-provider');
    const keyInput = $('#llm-key');

    function loadKeyForProvider() {
      keyInput.value = LLMClient.loadKey(providerSel.value);
    }
    loadKeyForProvider();
    providerSel.addEventListener('change', loadKeyForProvider);

    $('#llm-save').addEventListener('click', () => {
      LLMClient.saveKey(providerSel.value, keyInput.value.trim());
      $('#llm-status').textContent = 'Key saved locally.';
    });
    $('#llm-clear').addEventListener('click', () => {
      LLMClient.clearKey(providerSel.value);
      keyInput.value = '';
      $('#llm-status').textContent = 'Key cleared.';
    });
    $('#llm-generate').addEventListener('click', async () => {
      const text = $('#bullet-input').value.trim();
      const provider = providerSel.value;
      const key = keyInput.value.trim() || LLMClient.loadKey(provider);
      if (!text) { $('#llm-status').textContent = 'Enter a bullet above first.'; return; }
      if (!key) { $('#llm-status').textContent = 'Paste and save an API key first.'; return; }
      $('#llm-status').textContent = 'Generating…';
      $('#llm-result').innerHTML = '';
      try {
        const out = await LLMClient.generate(provider, key, text);
        $('#llm-status').textContent = '';
        $('#llm-result').innerHTML = `<div class="rewrite-box"><b>AI-generated rewrite (${escapeHtml(provider)}):</b><br>${escapeHtml(out || '(empty response)')}</div>`;
      } catch (err) {
        $('#llm-status').textContent = '';
        $('#llm-result').innerHTML = `<div class="rewrite-box issue-bad">Request failed: ${escapeHtml(err.message)}. Some providers block direct browser calls (CORS) — OpenAI generally works best for this mode.</div>`;
      }
    });
  }

  // ---------- Verifier ----------
  async function extractTextFromFile(file) {
    const name = file.name.toLowerCase();
    if (name.endsWith('.txt')) {
      return await file.text();
    }
    if (name.endsWith('.docx')) {
      if (!window.mammoth) throw new Error('DOCX parser not loaded (offline?).');
      const buf = await file.arrayBuffer();
      const result = await window.mammoth.extractRawText({ arrayBuffer: buf });
      return result.value;
    }
    if (name.endsWith('.pdf')) {
      if (!window.pdfjsLib) throw new Error('PDF parser not loaded (offline?).');
      window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.379/pdf.worker.min.js';
      const buf = await file.arrayBuffer();
      const pdf = await window.pdfjsLib.getDocument({ data: buf }).promise;
      let text = '';
      for (let p = 1; p <= pdf.numPages; p++) {
        const page = await pdf.getPage(p);
        const content = await page.getTextContent();
        text += content.items.map((i) => i.str).join(' ') + '\n';
      }
      return text;
    }
    throw new Error('Unsupported file type. Use .txt, .docx, or .pdf.');
  }

  function renderVerifyResult(r) {
    const kw = r.keywordMatch;
    $('#cv-verify-result').innerHTML = `
      <div class="card">
        <div class="row">
          <span class="score-badge ${scoreClass(r.atsScore)}">${r.atsScore}</span>
          <span class="muted">Overall ATS-readiness score (best-effort text analysis)</span>
        </div>
        <p class="muted">${escapeHtml(r.note)}</p>
        <div class="grid">
          <div class="tile"><h4>Length</h4><p>${r.wordCount} words · ~${r.estPages} page(s) estimated</p></div>
          <div class="tile"><h4>Sections detected</h4><p>${r.sectionsFound.length ? r.sectionsFound.join(', ') : 'None detected'}</p></div>
          <div class="tile"><h4>Contact info</h4><p>Email: ${r.contact.email ? '✓' : '✗'} · Phone: ${r.contact.phone ? '✓' : '✗'} · LinkedIn: ${r.contact.linkedin ? '✓' : '✗'}</p></div>
          <div class="tile"><h4>Bullets analyzed</h4><p>${r.bulletsAnalyzed} bullets · avg score ${r.avgBulletScore}/100</p></div>
          <div class="tile"><h4>Weak openers</h4><p>${r.weakOpenerCount} bullet(s) start with a weak phrase</p></div>
          <div class="tile"><h4>Passive voice</h4><p>${r.passiveCount} bullet(s) flagged</p></div>
          <div class="tile"><h4>First-person pronouns</h4><p>${r.pronounMatches} found</p></div>
        </div>
        ${r.formatWarnings.length ? `<h3>Warnings</h3><ul class="issue-list">${r.formatWarnings.map((w) => `<li class="issue-warn">${escapeHtml(w)}</li>`).join('')}</ul>` : ''}
        ${kw ? `<h3>Keyword match vs. job description (${kw.percent}%)</h3>
          <p class="muted"><b>Matched:</b> ${kw.matched.map(escapeHtml).join(', ') || '—'}</p>
          <p class="muted"><b>Missing:</b> ${kw.missing.map(escapeHtml).join(', ') || '—'}</p>` : ''}
      </div>
    `;
  }

  function wireVerifier() {
    const fileInput = $('#cv-file');
    fileInput.addEventListener('change', async () => {
      const file = fileInput.files[0];
      if (!file) return;
      $('#cv-file-status').textContent = 'Extracting text…';
      try {
        const text = await extractTextFromFile(file);
        $('#cv-input').value = text;
        $('#cv-file-status').textContent = `Loaded ${file.name} (${text.length} characters).`;
      } catch (err) {
        $('#cv-file-status').textContent = `Couldn't read file: ${err.message}. Try pasting the text instead.`;
      }
    });

    $('#cv-verify').addEventListener('click', () => {
      const text = $('#cv-input').value.trim();
      if (!text) return;
      const jd = $('#jd-input').value.trim();
      const result = CVEngine.analyzeFullCV(text, DATA.rulebook, jd);
      renderVerifyResult(result);
    });
  }

  function renderFooter() {
    const live = DATA.jobs.live_feed;
    $('#footer-updated').textContent = live.generated_at
      ? `Last data refresh: ${new Date(live.generated_at).toLocaleString()}`
      : 'Live job feed not yet generated.';
  }

  document.addEventListener('DOMContentLoaded', boot);
})();
