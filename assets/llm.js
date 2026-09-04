/**
 * LLMClient — optional "bring your own API key" rewrite mode.
 * Keys are stored ONLY in this browser's localStorage and sent directly
 * to the provider's API from the browser. Never sent anywhere else.
 */
(function (global) {
  const STORAGE_PREFIX = 'ai-pm-hub:llm-key:';

  function saveKey(provider, key) {
    localStorage.setItem(STORAGE_PREFIX + provider, key);
  }
  function loadKey(provider) {
    return localStorage.getItem(STORAGE_PREFIX + provider) || '';
  }
  function clearKey(provider) {
    localStorage.removeItem(STORAGE_PREFIX + provider);
  }

  function buildPrompt(userText) {
    return `You are a resume-writing coach for Product Managers. Rewrite the following CV bullet point or statement into a single, ATS-friendly, STAR-style resume bullet:
- Start with a strong action verb (not "Responsible for" / "Worked on" / "Helped with").
- Use active voice, no first-person pronouns.
- End with a quantified result (%, $, time, users). If no real number is given, insert a clearly marked bracketed placeholder like [quantify: e.g. +18% conversion] instead of inventing a fake number.
- One line, max ~30 words. Return ONLY the rewritten bullet, no preamble or quotes.

Input: "${userText}"`;
  }

  async function callOpenAI(apiKey, userText) {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        temperature: 0.4,
        messages: [{ role: 'user', content: buildPrompt(userText) }]
      })
    });
    if (!res.ok) throw new Error(`OpenAI error ${res.status}: ${await safeText(res)}`);
    const data = await res.json();
    return data.choices?.[0]?.message?.content?.trim();
  }

  async function callAnthropic(apiKey, userText) {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true'
      },
      body: JSON.stringify({
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 200,
        messages: [{ role: 'user', content: buildPrompt(userText) }]
      })
    });
    if (!res.ok) throw new Error(`Anthropic error ${res.status}: ${await safeText(res)}`);
    const data = await res.json();
    return data.content?.[0]?.text?.trim();
  }

  async function callGemini(apiKey, userText) {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: buildPrompt(userText) }] }] })
      }
    );
    if (!res.ok) throw new Error(`Gemini error ${res.status}: ${await safeText(res)}`);
    const data = await res.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
  }

  async function safeText(res) {
    try { return await res.text(); } catch { return '(no body)'; }
  }

  async function generate(provider, apiKey, userText) {
    if (!apiKey) throw new Error('No API key provided.');
    if (provider === 'openai') return callOpenAI(apiKey, userText);
    if (provider === 'anthropic') return callAnthropic(apiKey, userText);
    if (provider === 'gemini') return callGemini(apiKey, userText);
    throw new Error('Unknown provider: ' + provider);
  }

  global.LLMClient = { saveKey, loadKey, clearKey, generate };
})(typeof window !== 'undefined' ? window : globalThis);
