// Pro-only AI features. The Anthropic API key lives here (server-side), never in the browser.
import Anthropic from "npm:@anthropic-ai/sdk@1";
import { ACTIVE_STATUSES, adminClient, corsHeaders, env, getUser, json } from "../_shared/util.ts";

const MODEL = "claude-opus-5-5";
const DAILY_LIMIT = Number(Deno.env.get("AI_DAILY_LIMIT") ?? "40");
const MAX_FIELD = 4000;

const SYSTEMS: Record<string, string> = {
  journal:
    "You help Canadian premed students prepare for medical school interviews (MMI and panel). " +
    "Given one experience from a student's journal, write a 3-4 sentence, first-person, interview-ready summary " +
    "they could adapt when asked about it. Show what they did, what they learned, and why it matters for medicine. " +
    "Use only the facts provided; never invent names, numbers, outcomes or patient details. If the description is thin, " +
    "keep the summary modest rather than embellishing. Reply with the summary only, as plain text with no headings or markdown.",
  wellness:
    "You write short, warm reflections for a premed student's daily wellness check-in. " +
    "In 2-3 sentences, acknowledge how they're doing and offer one small, practical, kind suggestion. " +
    "Be genuine, not saccharine, and don't diagnose or give medical advice. If the note mentions self-harm, " +
    "hopelessness or crisis, gently encourage them to reach out to someone they trust and mention that in Canada " +
    "they can call or text 988 any time. Reply with the reflection only, as plain text with no markdown.",
};

function clean(v: unknown, max = MAX_FIELD): string {
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

function buildPrompt(body: Record<string, unknown>): string | null {
  if (body.kind === "journal") {
    const e = (body.entry ?? {}) as Record<string, unknown>;
    const title = clean(e.title, 300);
    if (!title) return null;
    const tags = Array.isArray(e.tags) ? e.tags.filter((t) => typeof t === "string").slice(0, 20).join(", ") : "";
    return [
      `Title: ${title}`,
      `Type: ${clean(e.type, 40) || "experience"}`,
      e.date ? `Date: ${clean(e.date, 20)}` : "",
      `Description: ${clean(e.desc) || "(none given)"}`,
      tags ? `Tags: ${tags}` : "",
    ].filter(Boolean).join("\n");
  }
  if (body.kind === "wellness") {
    const c = (body.checkin ?? {}) as Record<string, unknown>;
    const n = (v: unknown, lo: number, hi: number) => Math.min(hi, Math.max(lo, Number(v) || lo));
    return [
      `Mood: ${n(c.mood, 1, 5)}/5`,
      `Sleep: ${n(c.sleep, 0, 24)} hours`,
      `Appetite: ${n(c.appetite, 1, 5)}/5`,
      `Stress: ${n(c.stress, 1, 5)}/5 (5 = overwhelming)`,
      `Note: ${clean(c.note, 2000) || "(none)"}`,
    ].join("\n");
  }
  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const user = await getUser(req);
  if (!user) return json({ error: "Please sign in again." }, 401);

  const body = await req.json().catch(() => ({}));
  const prompt = buildPrompt(body);
  if (!prompt) return json({ error: "Nothing to summarize yet — add a title first." }, 400);

  const db = adminClient();
  const { data: sub } = await db.from("subscriptions").select("status").eq("user_id", user.id).maybeSingle();
  if (!sub || !ACTIVE_STATUSES.includes(sub.status)) {
    return json({ error: "AI features are part of Lost2Med Pro." }, 402);
  }

  const { data: allowed, error: limitErr } = await db.rpc("consume_ai_credit", { p_user: user.id, p_limit: DAILY_LIMIT });
  if (limitErr) {
    console.error("consume_ai_credit failed", limitErr);
    return json({ error: "Something went wrong. Please try again." }, 500);
  }
  if (!allowed) return json({ error: `You've reached today's limit of ${DAILY_LIMIT} AI requests. It resets tomorrow.` }, 429);

  const client = new Anthropic({ apiKey: env("ANTHROPIC_API_KEY") });
  try {
    const response = await client.beta.messages.create({
      model: MODEL,
      max_tokens: 4000,
      output_config: { effort: "low" },
      // On a safety decline, let the API retry on its default fallback model in the same call.
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      system: SYSTEMS[body.kind as string],
      messages: [{ role: "user", content: prompt }],
    });

    if (response.stop_reason === "refusal") {
      return json({ error: "The AI couldn't help with this one. Try rewording your entry." }, 422);
    }
    let text = "";
    for (const block of response.content) {
      if (block.type === "text") text += block.text;
    }
    text = text.trim();
    if (!text) return json({ error: "The AI didn't return anything. Please try again." }, 502);
    return json({ text });
  } catch (err) {
    if (err instanceof Anthropic.RateLimitError) {
      return json({ error: "The AI is busy right now. Please try again in a minute." }, 503);
    } else if (err instanceof Anthropic.APIError) {
      console.error(`Anthropic API error ${err.status}`, err.message);
    } else {
      console.error("AI request failed", err);
    }
    return json({ error: "Couldn't reach the AI. Please try again." }, 502);
  }
});
