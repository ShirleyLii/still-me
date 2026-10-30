/**
 * Still Me API: a small Cloudflare Worker that sits between the website and Claude.
 *
 * The website sends { prompt }. This worker adds your Anthropic API key (kept as a secret
 * in Cloudflare, never in the website), fixes the model and length, and forwards the
 * request to the Claude Messages API. Tokens are billed to your Anthropic account.
 *
 * Settings (Cloudflare dashboard → your Worker → Settings → Variables and Secrets):
 *   ANTHROPIC_API_KEY  (Secret)  your key from the Claude Console
 *   ALLOWED_ORIGINS    (Text)    e.g. https://shirleylii.github.io
 *   MODEL              (Text, optional) defaults to claude-sonnet-5-5
 */
const MAX_PROMPT_CHARS = 8000;
const MAX_TOKENS = 1000;

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    const allowed = (env.ALLOWED_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean);
    const originOk = allowed.includes(origin);
    const cors = {
      'Access-Control-Allow-Origin': originOk ? origin : allowed[0] || 'null',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
      Vary: 'Origin',
    };
    const reply = (obj, status) => new Response(JSON.stringify(obj), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

    if (request.method === 'OPTIONS') return new Response(null, { status: originOk ? 204 : 403, headers: cors });
    if (request.method !== 'POST') return reply({ error: 'Use POST.' }, 405);
    if (!originOk) return reply({ error: 'This site is not allowed to use this server.' }, 403);
    if (!env.ANTHROPIC_API_KEY) return reply({ error: 'The server has no API key yet.' }, 500);

    let body;
    try { body = await request.json(); } catch { return reply({ error: 'Send JSON.' }, 400); }
    const prompt = typeof body.prompt === 'string' ? body.prompt : '';
    if (!prompt || prompt.length > MAX_PROMPT_CHARS) return reply({ error: 'The message is empty or too long.' }, 400);

    const upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: env.MODEL || 'claude-sonnet-5-5',
        max_tokens: MAX_TOKENS,
        messages: [{ role: 'user', content: prompt }],
      }),
    });
    const text = await upstream.text();
    return new Response(text, { status: upstream.status, headers: { ...cors, 'Content-Type': 'application/json' } });
  },
};
