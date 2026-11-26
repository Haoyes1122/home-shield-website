// Home Shield：照片初步判定 API（使用 Cloudflare Workers AI，免費額度內不會產生費用）
// 模型只負責「分類」，不產生建議文字；建議內容寫在 ai-check.html，方便你自行修改。

// 依序嘗試：Gemma 4（主要）→ Llama 4 Scout → Llama 3.2 Vision（舊版備用）
const PLANS = [
  ['@cf/google/gemma-4-26b-a4b-it', 'chat'],
  ['@cf/meta/llama-4-scout-17b-16e-instruct', 'chat'],
  ['@cf/meta/llama-3.2-11b-vision-instruct', 'legacy']
];
const CATS = ['ceiling_stain','wall_dampness','paint_bubbling','mold','crack','tile_leak','ponding','no_issue','unclear'];

const PROMPT = `You are helping with a preliminary home moisture check. Look at the photo and reply with ONE JSON object only, no other text:
{"category":"<ceiling_stain|wall_dampness|paint_bubbling|mold|crack|tile_leak|ponding|no_issue|unclear>","confidence":"<low|medium|high>","quality":"<good|poor>"}
Meaning: ceiling_stain = yellow or brown water stain on a ceiling; wall_dampness = damp patches, white salt deposits or crumbling plaster on a wall; paint_bubbling = paint blistering or flaking; mold = black or green mold spots; crack = visible crack in a wall or ceiling; tile_leak = dark, wet or discolored tile grout or water near tiles; ponding = standing water on a floor, roof or balcony; no_issue = no visible problem; unclear = not a building surface, or too blurry or dark to judge.`;

const hits = new Map(); // 簡易的次數限制（每個 IP 每 10 分鐘 8 次）

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }
  });
}

function limited(ip) {
  const now = Date.now(), win = 10 * 60 * 1000;
  const list = (hits.get(ip) || []).filter(t => now - t < win);
  list.push(now);
  hits.set(ip, list);
  if (hits.size > 500) hits.clear();
  return list.length > 8;
}

function textOf(r) {
  if (!r) return '';
  if (typeof r === 'string') return r;
  if (r.response !== undefined && r.response !== null) return typeof r.response === 'string' ? r.response : JSON.stringify(r.response);
  const m = r.choices && r.choices[0] && r.choices[0].message;
  if (m && m.content) return typeof m.content === 'string' ? m.content : JSON.stringify(m.content);
  if (typeof r.output_text === 'string') return r.output_text;
  return '';
}

async function runModel(env, image) {
  const errors = [];
  for (const [model, kind] of PLANS) {
    const args = kind === 'chat'
      ? { messages: [{ role: 'user', content: [{ type: 'text', text: PROMPT }, { type: 'image_url', image_url: { url: image } }] }], max_tokens: 700, temperature: 0.1 }
      : { messages: [{ role: 'system', content: 'You are a careful visual inspector.' }, { role: 'user', content: PROMPT }], image, max_tokens: 100, temperature: 0.1 };
    try {
      const r = await env.AI.run(model, args);
      if (textOf(r)) return { r, model };
      errors.push(model.split('/').pop() + ':empty');
    } catch (e) {
      const m = String((e && e.message) || e);
      if (/neuron|daily|allocation|quota|4006/i.test(m)) throw e;
      if (/agree|license|acceptable use/i.test(m)) {
        try { await env.AI.run(model, { prompt: 'agree' }); const r2 = await env.AI.run(model, args); if (textOf(r2)) return { r: r2, model }; } catch (e2) { errors.push(model.split('/').pop() + ':' + String((e2 && e2.message) || e2)); continue; }
      }
      errors.push(model.split('/').pop() + ':' + m);
    }
  }
  throw new Error(errors.join(' | '));
}

async function classify(env, image, debug) {
  const { r, model } = await runModel(env, image);
  const text = textOf(r);
  let o = {};
  const found = (text.match(/\{[^{}]*\}/g) || []).filter(x => x.includes('category'));
  if (found.length) { try { o = JSON.parse(found[found.length - 1]); } catch (e) {} }
  let cat = typeof o.category === 'string' ? o.category.trim().toLowerCase() : '';
  if (!CATS.includes(cat)) {
    const low = text.toLowerCase();
    let best = -1; cat = 'unclear';
    for (const c of CATS) { const i = low.lastIndexOf(c); if (i > best) { best = i; cat = c; } }
  }
  const conf = String(o.confidence || '').toLowerCase();
  const out = {
    category: cat,
    confidence: ['low', 'medium', 'high'].includes(conf) ? conf : (cat === 'unclear' ? 'low' : 'medium'),
    quality: String(o.quality || '').toLowerCase() === 'poor' ? 'poor' : 'good'
  };
  if (debug) out.raw = model.split('/').pop() + ' → ' + text.slice(0, 350);
  return out;
}

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    if (url.pathname !== '/api/analyze') return new Response('Not found', { status: 404 });
    if (req.method !== 'POST') return json({ error: 'method' }, 405);

    const origin = req.headers.get('Origin');
    if (origin) { try { if (new URL(origin).host !== url.host) return json({ error: 'forbidden' }, 403); } catch (e) { return json({ error: 'forbidden' }, 403); } }
    if (limited(req.headers.get('CF-Connecting-IP') || 'x')) return json({ error: 'rate' }, 429);

    let body;
    try { body = await req.json(); } catch (e) { return json({ error: 'bad_request' }, 400); }
    const img = body && body.image;
    if (typeof img !== 'string' || !/^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(img) || img.length > 1500000) {
      return json({ error: 'bad_image' }, 400);
    }

    try {
      return json(await classify(env, img, body && body.debug === true));
    } catch (e) {
      const msg = String((e && e.message) || e);
      const dbg = body && body.debug === true ? { detail: msg.slice(0, 700) } : {};
      if (/neuron|daily|allocation|quota|4006/i.test(msg)) return json({ error: 'quota', ...dbg }, 429);
      return json({ error: 'ai', ...dbg }, 502);
    }
  }
};
