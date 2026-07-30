'use strict';
/* ────────────────────────────────────────────────────────────────
   AI brief writer.

   The split here is deliberate. The BEAT STRUCTURE and its TIMINGS
   come from the formula the user picked — real proportions taken
   from campaigns that worked, computed on the client and sent here
   as fact. The model only writes the words that go in each beat.

   That means the model cannot invent a structure, move a timecode,
   or claim a pattern that no campaign used. It is doing the thing
   language models are good at (writing to a brief) and none of the
   thing they are bad at (inventing evidence).

   If the call fails, times out, or comes back malformed, the client
   still has its own deterministic brief — so the button always
   produces something usable and the AI is an upgrade rather than a
   dependency.
   ──────────────────────────────────────────────────────────────── */

const MODEL = process.env.BRIEF_MODEL || 'gpt-5.4-nano';
const KEY = () => process.env.OPENAI_API_KEY || '';

const SYSTEM = `You are a senior copywriter briefing a director for a short ad film. You write for people shooting on a small budget in India, so every instruction must be shootable without a studio.

Rules:
- You are given a fixed beat structure with fixed timecodes. Do NOT change, merge, reorder or re-time the beats. Write content for the beats you are given, in the order given.
- Write plainly. No agency language, no "leverage", no "elevate", no "in today's world".
- Every hook must be sayable out loud in under four seconds.
- The shot list must be things a two-person crew can actually get: locations, props, one camera move at most per shot.
- Name the specific way THIS ad will fail if it is made badly. Be concrete, not general.
- Never claim a result, a statistic, or a customer quote. You do not have any.
- Output strict JSON matching the schema. No prose outside it.`;

const SCHEMA = `{
  "hooks": ["three opening lines, each under four seconds spoken"],
  "beats": [{ "id": "the beat id you were given", "direction": "one or two sentences: what happens on screen and what is said" }],
  "shots": ["five to eight concrete shots, each one line"],
  "trap": "the specific way this particular ad goes wrong",
  "vo": "the full voiceover or on-screen text, as one short block"
}`;

async function call(body) {
  if (!KEY()) throw new Error('OPENAI_API_KEY is not set');
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${KEY()}` },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(45_000)
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`OpenAI ${res.status}: ${json?.error?.message || res.statusText}`);
  return json;
}

/* Reject rather than repair. A brief that quietly lost two beats is
   worse than one that failed loudly, because the reader would shoot
   the short version without noticing. */
function validate(parsed, beats) {
  if (!parsed || typeof parsed !== 'object') return 'not an object';
  if (!Array.isArray(parsed.hooks) || parsed.hooks.length < 2) return 'needs at least two hooks';
  if (!Array.isArray(parsed.beats)) return 'no beats';
  if (parsed.beats.length !== beats.length) {
    return `returned ${parsed.beats.length} beats for a ${beats.length}-beat structure`;
  }
  if (!Array.isArray(parsed.shots) || parsed.shots.length < 3) return 'needs at least three shots';
  if (!parsed.trap) return 'no failure mode';
  return null;
}

async function write({ product, brand, audience, promise, formula, lengthSeconds, beats }) {
  const spec = beats.map(b => `- id "${b.id}" (${b.time}): ${b.heading}`).join('\n');

  const brief = [
    `Brand: ${brand}`,
    `Product: ${product}`,
    `Audience: ${audience}`,
    `The one claim they can prove on camera: ${promise}`,
    `Format: ${formula} · total runtime ${lengthSeconds} seconds`,
    '',
    'Fixed beat structure — write content for exactly these, in this order:',
    spec
  ].join('\n');

  const res = await call({
    model: MODEL,
    messages: [
      { role: 'system', content: SYSTEM },
      { role: 'user', content: `Schema:\n${SCHEMA}\n\nBrief:\n${brief}` }
    ],
    response_format: { type: 'json_object' },
    temperature: 0.7            /* higher than the analysis routes — this is writing */
  });

  const raw = res.choices?.[0]?.message?.content || '{}';
  let parsed;
  try { parsed = JSON.parse(raw); } catch { throw new Error('Model returned invalid JSON.'); }

  const problem = validate(parsed, beats);
  if (problem) throw new Error(`Rejected: ${problem}.`);

  /* Re-attach the timings from OUR structure, not the model's, so a
     timecode can never drift from the formula it came from. */
  const byId = new Map(parsed.beats.map(b => [String(b.id), b]));
  return {
    ok: true,
    model: MODEL,
    hooks: parsed.hooks.slice(0, 3).map(String),
    beats: beats.map(b => ({
      id: b.id,
      time: b.time,
      heading: b.heading,
      direction: String(byId.get(String(b.id))?.direction || '').trim()
    })),
    shots: parsed.shots.slice(0, 8).map(String),
    trap: String(parsed.trap),
    vo: String(parsed.vo || '')
  };
}

module.exports = { write, configured: () => !!KEY(), MODEL };
