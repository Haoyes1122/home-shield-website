// Home Shield：照片初步判定 API（使用 Cloudflare Workers AI，免費額度內不會產生費用）
// 模型只負責「分類」，不產生建議文字；建議內容寫在 ai-check.html，方便你自行修改。

const MODEL = '@cf/meta/llama-3.2-11b-vision-instruct';
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

// 依序嘗試幾種輸入格式，直到其中一種成功（不同版本的模型接受的格式略有差異）
async function runModel(env, image) {
  const base = { max_tokens: 100, temperature: 0.1 };
  const variants = [
    { prompt: PROMPT, image, ...base },
    { messages: [{ role: 'system', content: 'You are a careful visual inspector.' }, { role: 'user', content: PROMPT }], image, ...base },
    { messages: [{ role: 'user', content: [{ type: 'text', text: PROMPT }, { type: 'image_url', image_url: { url: image } }] }], ...base }
  ];
  const errors = [];
  for (const args of variants) {
    try {
      return await env.AI.run(MODEL, args);
    } catch (e) {
      const m = String((e && e.message) || e);
      if (/neuron|daily|allocation|quota|4006/i.test(m)) throw e;
      if (/agree|license|acceptable use/i.test(m)) {
        // 第一次使用需同意 Meta 的授權條款，這裡自動處理一次
        try { await env.AI.run(MODEL, { prompt: 'agree' }); return await env.AI.run(MODEL, args); }
        catch (e2) { errors.push('agree:' + String((e2 && e2.message) || e2)); continue; }
      }
      errors.push(m);
    }
  }
  throw new Error(errors.join(' | '));
}

async function classify(env, image) {
  const r = await runModel(env, image);
  const text = typeof r === 'string' ? r : (r && r.response) || '';
  const m = String(text).match(/\{[\s\S]*?\}/);
  let o = {};
  try { o = JSON.parse(m ? m[0] : '{}'); } catch (e) {}
  return {
    category: CATS.includes(o.category) ? o.category : 'unclear',
    confidence: ['low', 'medium', 'high'].includes(o.confidence) ? o.confidence : 'low',
    quality: o.quality === 'poor' ? 'poor' : 'good'
  };
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
      return json(await classify(env, img));
    } catch (e) {
      const msg = String((e && e.message) || e);
      const dbg = body && body.debug === true ? { detail: msg.slice(0, 600) } : {};
      if (/neuron|daily|allocation|quota|4006/i.test(msg)) return json({ error: 'quota', ...dbg }, 429);
      return json({ error: 'ai', ...dbg }, 502);
    }
  }
};
