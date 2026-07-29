'use strict';
/* ────────────────────────────────────────────────────────────────
   AI recipe breakdowns — metadata-grounded, not transcript-grounded.

   Why not transcripts: YouTube's caption endpoint now requires a
   session-bound token a server-side request cannot produce without
   actively defeating their bot detection. This project does not
   circumvent platform protections anywhere else (see server/meta.js,
   the Ads Transparency Center note in README) and does not start
   here. So the model works from what the Data API actually gives us
   for free: title, description, and top comments.

   That is a real constraint on quality, not a rounding error, and the
   UI must say so on every card this produces — "AI read the title,
   description and comments" is a different claim from "AI read the
   dialogue," and confusing the two is exactly the kind of overclaim
   this whole site exists to avoid making about ad performance.

   The model is told explicitly: if the material does not support a
   specific beat, omit it rather than invent one. Output is validated
   before being served — malformed or suspiciously generic output is
   rejected, not patched.
   ──────────────────────────────────────────────────────────────── */

const MODEL = process.env.RECIPE_MODEL || 'gpt-5.4-nano';
const KEY = () => process.env.OPENAI_API_KEY || '';

const SYSTEM = `You reverse-engineer advertising structure for a study tool. You will be given a video's title, description, and top public comments — nothing else. You have NOT seen the video.

Ground rules, followed exactly:
- Never invent dialogue, a shot, or a timestamp. You cannot know these from text metadata.
- Every beat you output must be something the given text actually supports — a stated concept, a described mechanism, a reaction people are commenting on. If you cannot support a beat from the material, do not include it.
- Write beats as STRUCTURAL observations ("opens on a stated problem before naming the product") not as claims about specific visuals or lines you have not seen.
- If the material is too thin to say anything specific (a generic title, no description, few comments), return fewer beats — 2 or 3 honest ones beat 6 fabricated ones.
- Output strict JSON only, matching the schema given. No prose outside the JSON.`;

const SCHEMA_HINT = `{
  "mechanism": "one sentence: the core structural idea, inferred from the material",
  "confidence": "low" | "medium",
  "beats": [
    { "label": "short beat name", "note": "what the material actually supports, one sentence" }
  ],
  "groundedIn": ["short phrases quoted or closely paraphrased from the title/description/comments that a beat is based on"]
}`;

async function call(body) {
  if (!KEY()) throw new Error('OPENAI_API_KEY is not set');
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${KEY()}`
    },
    body: JSON.stringify(body)
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`OpenAI ${res.status}: ${json?.error?.message || res.statusText}`);
  return json;
}

/* Reject output that does not actually meet the contract, rather than
   trusting the model to have followed instructions. */
function validate(parsed, material) {
  if (!parsed || typeof parsed !== 'object') return 'not an object';
  if (!Array.isArray(parsed.beats) || !parsed.beats.length) return 'no beats';
  if (parsed.beats.length > 6) return 'too many beats for metadata-only grounding';
  for (const b of parsed.beats) {
    if (!b.label || !b.note) return 'beat missing label/note';
    if (b.note.length > 240) return 'beat note implausibly specific for metadata-only source';
  }
  /* The model cites in one of two shapes, unpredictably: a top-level
     groundedIn array, or a groundedIn array inside each beat. Both are
     honest work — accept either rather than rejecting good output for
     putting its citations in the wrong drawer. */
  const citations = [
    ...(Array.isArray(parsed.groundedIn) ? parsed.groundedIn : []),
    ...parsed.beats.flatMap(b => Array.isArray(b.groundedIn) ? b.groundedIn : [])
  ].map(String).filter(Boolean);

  if (!citations.length) return 'no grounding citations';
  parsed._citations = citations;   /* reuse below rather than re-deriving */

  /* Word-overlap, not exact substring: the model legitimately paraphrases
     (joins two nearby sentences, drops filler) when citing, so requiring
     a byte-exact quote rejects honest output. What must not happen is a
     citation with no real relationship to the material at all. */
  const STOP = new Set(['the','a','an','is','it','to','of','and','in','on','for','with','that','this','was','are','as','at','by']);
  const words = s => (s.toLowerCase().match(/[a-z0-9']{3,}/g) || []).filter(w => !STOP.has(w));
  const hayWords = new Set(words(material));

  const overlapRatio = phrase => {
    const w = words(phrase);
    if (!w.length) return 0;
    return w.filter(x => hayWords.has(x)).length / w.length;
  };

  const grounded = citations.filter(g => overlapRatio(g) >= 0.5);
  if (grounded.length < Math.ceil(citations.length * 0.6)) {
    return 'most grounding citations do not overlap with the source material';
  }
  return null;
}

async function breakdown({ title, description, comments = [] }) {
  const material = [
    `Title: ${title}`,
    description ? `Description: ${description.slice(0, 1200)}` : null,
    comments.length ? `Top comments:\n${comments.slice(0, 8).map(c => `- ${c.slice(0, 200)}`).join('\n')}` : null
  ].filter(Boolean).join('\n\n');

  if (material.replace(/Title: /, '').trim().length < 20) {
    return { ok: false, reason: 'Not enough public text to work from — title alone is too thin.' };
  }

  const res = await call({
    model: MODEL,
    messages: [
      { role: 'system', content: SYSTEM },
      { role: 'user', content: `Schema:\n${SCHEMA_HINT}\n\nMaterial:\n${material}` }
    ],
    response_format: { type: 'json_object' },
    temperature: 0.3
  });

  const raw = res.choices?.[0]?.message?.content || '{}';
  let parsed;
  try { parsed = JSON.parse(raw); } catch { return { ok: false, reason: 'Model returned invalid JSON.' }; }

  const problem = validate(parsed, material);
  if (problem) return { ok: false, reason: `Rejected: ${problem}.` };

  return {
    ok: true,
    source: 'metadata-only',
    model: MODEL,
    disclosure: 'AI-generated from the title, description and public comments only — the model has not seen or heard the ad itself. Treat this as a starting hypothesis, not a verified breakdown.',
    mechanism: parsed.mechanism,
    confidence: parsed.confidence === 'medium' ? 'medium' : 'low',
    beats: parsed.beats.slice(0, 6),
    /* Normalised: whichever shape the model used, the client always
       receives one flat list of what the breakdown was drawn from. */
    groundedIn: parsed._citations || []
  };
}

module.exports = { breakdown, configured: () => !!KEY(), MODEL };
