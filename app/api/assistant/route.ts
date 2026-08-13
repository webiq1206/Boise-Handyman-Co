/**
 * Conversational estimating assistant.
 *
 * POST { messages, page?, draft? } -> { reply }
 *
 * Architecture rules this route enforces:
 *  - One pricing engine. The model is given tools that call the same shared
 *    resolvers as the estimator and the lead emails, and the system prompt
 *    forbids stating any figure that did not come back from a tool. See
 *    server/services/assistant/tools.ts.
 *  - Session-only. Nothing is persisted here; the transcript lives in the
 *    visitor's sessionStorage and arrives with every request.
 *  - Bounded cost. Hard caps on transcript length, message size, tool
 *    rounds, output tokens and per-IP request rate keep a conversation
 *    comfortably under $1: worst case ~25 assistant turns x ~3 engine calls
 *    x (cached system prompt + trimmed history) on claude-sonnet-5.
 */
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import Anthropic from "@anthropic-ai/sdk";
import { LRUCache } from "lru-cache";
import { ASSISTANT_TOOLS, executeAssistantTool } from "@/server/services/assistant/tools";
import { SERVICES } from "@/shared/contentData";
import { SITE_CONFIG } from "@/shared/siteConfig";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MODEL = "claude-sonnet-5";
const MAX_OUTPUT_TOKENS = 600;
const MAX_TOOL_ROUNDS = 5;
/** Assistant replies per conversation before we hand off to a human channel. */
const MAX_USER_TURNS = 25;
/** Messages actually sent to the model (older ones are dropped client-visibly-losslessly: the visitor still sees them; the model just stops re-reading them). */
const HISTORY_WINDOW = 20;
const MAX_MESSAGE_CHARS = 2_000;

const FALLBACK_REPLY = `I'm having trouble connecting right now. You can get an instant estimate with the calculator on the homepage, or call us at ${SITE_CONFIG.phone} - happy to help either way.`;

const HANDOFF_REPLY = `We've covered a lot of ground - at this point the most useful next step is a real conversation with the team. Call ${SITE_CONFIG.phone} or book a free consultation at /consultation and they'll pick up right where we left off.`;

/* Em/en dash (U+2014/U+2013), built from char codes because verify:no-em-dash
   bans both the literal and its escape forms from source. */
const MODEL_DASHES = new RegExp(`\\s*[${String.fromCharCode(0x2014, 0x2013)}]\\s*`, "g");

/* ────────────────────────────────────────────────────────── rate limiting */

const rateLimiter = new LRUCache<string, number>({ max: 5_000, ttl: 5 * 60 * 1000 });
const RATE_LIMIT = 30; // requests per IP per 5 minutes

function isRateLimited(ip: string): boolean {
  const count = (rateLimiter.get(ip) ?? 0) + 1;
  rateLimiter.set(ip, count);
  return count > RATE_LIMIT;
}

/* ─────────────────────────────────────────────────────────── request body */

const bodySchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().min(1).max(MAX_MESSAGE_CHARS),
      }),
    )
    .min(1)
    .max(2 * MAX_USER_TURNS + 4),
  page: z.string().max(200).optional(),
  draft: z.string().max(2_000).optional(),
});

/* ─────────────────────────────────────────────────────────── system prompt */

const SERVICES_SUMMARY = SERVICES.map(
  (s) => `- ${s.name} (planning from ${s.planningFrom}): ${s.shortDescription}`,
).join("\n");

/**
 * Static and therefore prompt-cacheable. Anything per-request (current page,
 * estimator draft) goes in a second, uncached system block below.
 */
const SYSTEM_PROMPT = `You are the virtual assistant on the Boise Handyman Co website (boisehandyman.co). Boise Handyman Co is a local handyman service for SMALL repair, maintenance, and install jobs - typically 1 to 8 hours of work - serving Idaho's Treasure Valley - Ada and Canyon County: Boise, Meridian, Eagle, Star, Kuna, Nampa, Caldwell, Middleton and nearby.

# Who you are
You help visitors figure out what a repair or install would cost, how the process works, and what to do next - the way a sharp, friendly in-house scheduler would over text. You are a virtual assistant, not a human employee. You don't volunteer that in every message, but you NEVER claim to be human, never invent a personal name or personal history, and if anyone asks whether they're talking to a bot or an AI, you confirm it plainly in one short sentence and carry on being useful.

# How you talk
- Like a person texting: warm, direct, contractions, plain words. Short messages - usually 1-3 sentences, never a wall of text.
- One question at a time. Never stack two questions in one message.
- No markdown headers, no bullet lists unless you're listing 3+ priced items, no exclamation-mark enthusiasm, no "As an AI" boilerplate, no restating their question back at them.
- Mirror their energy: brief with brief people, chattier with chatty people.

# The iron rule on numbers
Every dollar figure you say MUST come from a tool result in this conversation. price_re10_repairs for repair lists (RE-10 or any homeowner's list of small repairs), get_business_info for planning-from starting points. You never estimate, round differently, extrapolate, adjust, or "ballpark" a number yourself - if you haven't called the tool, you don't have a number. When the list changes, call the pricer again before quoting. If a tool says something can't be priced or flags it as needing review, say the team needs to look at it - never fill the gap with a guess.

# How a pricing conversation flows
1. Find out what needs doing. If they're vague, ask what's on their list - one loose handle or a whole punch list, both are welcome.
2. For a list of specific repairs, map each task to the pricer's catalog and call price_re10_repairs. Give the range conversationally, with the reminder that it's a planning number confirmed with a firm quote before work starts.
3. Explain the pricing model when it helps: an hourly rate plus one flat trip fee per visit, quoted upfront, materials as their own line. Several tasks in one visit share a single trip fee, so a list is the best value. Exact rates come with the quote - never invent an hourly figure.
4. When they seem ready, offer next steps: sending the form with their task list (/consultation), calling or texting ${SITE_CONFIG.phone}, or leaving contact info so the team follows up with a firm quote within one business day.

# What the company does NOT do
No new builds, additions, full remodels, commercial construction, re-roofs, HVAC replacement, repipes or panel swaps, structural work, or anything needing a general contractor or major permits. If a visitor asks for that scale of work, say kindly that it's outside what a handyman service takes on and that the team is happy to suggest who to call instead - don't force a lead. (calculate_estimate exists for legacy budget context on big projects; if you use it, be explicit the company would refer that work out.)

# Lead capture
If the visitor wants the team to reach out, or wants their estimate emailed: ask for their name and email (phone optional). Only after they've given real contact details AND clearly want follow-up, call submit_lead - include the latest estimate inputs if you calculated one. Never call submit_lead with invented, partial or assumed details, and never pressure anyone.

# Facts you may state without a tool call
${SERVICES_SUMMARY}
- Phone: ${SITE_CONFIG.phone} · Email: ${SITE_CONFIG.email}
- Based in ${SITE_CONFIG.address.cityState}, serving ${SITE_CONFIG.address.serviceArea}.
- Process: send the task list (photos help) -> upfront quote within one business day -> agreed arrival time, not a half-day window -> one-trip fix with the right materials -> walkthrough and cleanup, workmanship made right if it ever falls short.
- Planning-from figures are per-visit starting points for a small job of that type, not bids or averages.
For anything beyond this, use get_business_info - don't rely on memory.

# Honesty guardrails
- Never fabricate reviews, past jobs, credentials, timelines or availability.
- Never claim the company is licensed, bonded or insured; if asked, say licensing and insurance details are available on request from the team.
- Don't give legal, financing, structural-engineering or code-compliance advice - point those at the team.
- If a job is outside the service area or outside handyman scope, say so kindly and don't force a lead.
- Items the pricer flags as "needs review" are not priced - say a human will confirm those, never guess.`;

/* ────────────────────────────────────────────────────────────── handler */

export async function POST(request: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ reply: FALLBACK_REPLY }, { status: 503 });
  }

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";
  if (isRateLimited(ip)) {
    return NextResponse.json(
      { reply: "You're sending messages faster than I can keep up - give it a minute and try again." },
      { status: 429 },
    );
  }

  let body: z.infer<typeof bodySchema>;
  try {
    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ message: "Invalid request" }, { status: 400 });
    }
    body = parsed.data;
  } catch {
    return NextResponse.json({ message: "Invalid request" }, { status: 400 });
  }

  const userTurns = body.messages.filter((m) => m.role === "user").length;
  if (userTurns > MAX_USER_TURNS) {
    return NextResponse.json({ reply: HANDOFF_REPLY });
  }
  if (body.messages[body.messages.length - 1]?.role !== "user") {
    return NextResponse.json({ message: "Last message must be from the user" }, { status: 400 });
  }

  const origin = new URL(request.url).origin;
  const client = new Anthropic({ apiKey });

  /* Per-request context the static prompt can't carry. Kept in its own
     system block so the big block above still prompt-caches. */
  const contextBlock = [
    body.page ? `The visitor is currently on the page: ${body.page}` : null,
    body.draft
      ? `The visitor has a partially completed estimator draft (answers so far, JSON): ${body.draft}\nIf relevant, acknowledge what they've already told the estimator instead of re-asking it.`
      : null,
  ]
    .filter(Boolean)
    .join("\n\n");

  const history: Anthropic.Messages.MessageParam[] = body.messages
    .slice(-HISTORY_WINDOW)
    .map((m) => ({ role: m.role, content: m.content }));
  // The trim window can land on an assistant message; the API requires the
  // transcript to open with the user.
  while (history[0]?.role === "assistant") history.shift();

  try {
    let totalIn = 0;
    let totalOut = 0;
    let totalCacheRead = 0;
    let totalCacheWrite = 0;
    const tally = (u: Anthropic.Messages.Usage) => {
      totalIn += u.input_tokens;
      totalOut += u.output_tokens;
      totalCacheRead += u.cache_read_input_tokens ?? 0;
      totalCacheWrite += u.cache_creation_input_tokens ?? 0;
    };

    let response = await client.messages.create({
      model: MODEL,
      max_tokens: MAX_OUTPUT_TOKENS,
      system: [
        { type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } },
        ...(contextBlock ? [{ type: "text" as const, text: contextBlock }] : []),
      ],
      tools: ASSISTANT_TOOLS,
      messages: history,
    });
    tally(response.usage);

    let rounds = 0;
    while (response.stop_reason === "tool_use" && rounds < MAX_TOOL_ROUNDS) {
      rounds++;
      const toolResults: Anthropic.Messages.ToolResultBlockParam[] = [];
      for (const block of response.content) {
        if (block.type === "tool_use") {
          const result = await executeAssistantTool(block.name, block.input, origin);
          toolResults.push({ type: "tool_result", tool_use_id: block.id, content: result });
        }
      }
      history.push({ role: "assistant", content: response.content });
      history.push({ role: "user", content: toolResults });

      response = await client.messages.create({
        model: MODEL,
        max_tokens: MAX_OUTPUT_TOKENS,
        system: [
          { type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } },
          ...(contextBlock ? [{ type: "text" as const, text: contextBlock }] : []),
        ],
        tools: ASSISTANT_TOOLS,
        messages: history,
      });
      tally(response.usage);
    }

    /* Site-wide brand rule (enforced on source by verify:no-em-dash): no em
       dashes. The model can't be trusted to follow a style note 100% of the
       time, so normalize the output instead. */
    const reply = response.content
      .filter((b): b is Anthropic.Messages.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("\n")
      .replace(MODEL_DASHES, " - ")
      .trim();

    /* Cost monitoring: one line per request with real token counts. Sonnet 5
       list price: $3/M input, $15/M output, $3.75/M cache write, $0.30/M
       cache read. */
    const estCost =
      (totalIn * 3 + totalCacheWrite * 3.75 + totalCacheRead * 0.3 + totalOut * 15) / 1_000_000;
    console.log(
      `[assistant] ip=${ip} turns=${userTurns} rounds=${rounds} in=${totalIn} cacheW=${totalCacheWrite} cacheR=${totalCacheRead} out=${totalOut} est=$${estCost.toFixed(4)}`,
    );

    return NextResponse.json({
      reply: reply || "Sorry, I lost my train of thought - could you say that again?",
    });
  } catch (err) {
    console.error("[assistant] API error:", err);
    return NextResponse.json({ reply: FALLBACK_REPLY }, { status: 502 });
  }
}
