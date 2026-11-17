/**
 * One team email per request (owner decision, 17 November 2026).
 *
 * A request from this site used to put two emails in the same shared inbox:
 * this site's own team email, and the "New lead" (or "Details added") email
 * p5homeco.com sends when the request is forwarded to its intake. The p5 email
 * is the one that stays. This site's own team email is the FALLBACK: it goes
 * to the shared inbox only when p5 did not confirm that its email went.
 *
 * A lead must never end with no team email, so every answer except an exact
 * "sent" sends this site's email to everyone, exactly as before.
 *
 * Nothing here is on the visitor's path. The visitor response and the
 * customer's confirmation email never wait on p5; only the team email does,
 * inside after().
 */
import type { P5BridgeResult, P5TeamAlert } from "./p5IntakeBridge";

/** `hello@` at any of these is one mailbox: the family's shared inbox. */
export const SHARED_FAMILY_INBOX_DOMAINS = [
  "p5homeco.com",
  "boisecabinet.co",
  "boiseconstruction.co",
  "boiseremodeling.co",
  "boisehandyman.co",
  "boiseadu.co",
] as const;

/**
 * True when the address is the family's shared inbox, which is where p5's own
 * team email lands. Compared without regard to case; `Name <address>` is read
 * by its address.
 */
export function isSharedFamilyInbox(address: string | null | undefined): boolean {
  const raw = (address ?? "").trim().toLowerCase();
  const bracketed = raw.match(/<([^<>]*)>\s*$/);
  const email = (bracketed ? bracketed[1] : raw).trim();
  return SHARED_FAMILY_INBOX_DOMAINS.some((domain) => email === `hello@${domain}`);
}

/**
 * Who gets this site's team email once p5 has answered. Only a confirmed
 * "sent" leaves the shared inbox out; any other admin recipient is always kept.
 */
export function teamEmailRecipients(recipients: readonly string[], alert: P5TeamAlert): string[] {
  const all = [...new Set(recipients)];
  return alert === "sent" ? all.filter((to) => !isSharedFamilyInbox(to)) : all;
}

/**
 * The longest the team email waits for the bridge. The bridge gives up on its
 * own at 30 seconds; this is the backstop if it somehow never settles.
 */
export const TEAM_EMAIL_MAX_WAIT_MS = 45_000;

export type TeamEmailOutcome = {
  alert: P5TeamAlert;
  /** Recipients this site's team email was sent to. */
  sentTo: string[];
  /** Shared-inbox recipients left out because p5 confirmed its own email. */
  skipped: string[];
};

export type TeamEmailInput = {
  /** The bridge in flight, or null when nothing was forwarded to p5. */
  bridge: Promise<P5BridgeResult> | null | undefined;
  recipients: () => Promise<readonly string[]> | readonly string[];
  /** Sends this site's team email to one recipient. */
  send: (to: string) => Promise<void>;
  /** Log prefix, for example "consultation". */
  label: string;
  maxWaitMs?: number;
};

async function settledAlert(bridge: TeamEmailInput["bridge"], maxWaitMs: number, label: string): Promise<P5TeamAlert> {
  if (!bridge) return "unknown";
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const waited = new Promise<null>((resolve) => {
      timer = setTimeout(() => resolve(null), maxWaitMs);
    });
    const result = await Promise.race([bridge, waited]);
    if (!result) {
      console.error(`[${label}] The p5 bridge did not answer in time; sending this site's team email.`);
      return "unknown";
    }
    const alert = result.alert;
    return alert === "sent" || alert === "failed" || alert === "none" ? alert : "unknown";
  } catch (err) {
    console.error(`[${label}] The p5 bridge threw; sending this site's team email:`, err);
    return "unknown";
  } finally {
    if (timer) clearTimeout(timer);
  }
}

/**
 * Waits for the bridge, then sends this site's team email to whoever still
 * needs it. Never throws. Run it inside after(), never on the visitor's path.
 */
export async function sendTeamEmailAfterBridge(input: TeamEmailInput): Promise<TeamEmailOutcome> {
  const alert = await settledAlert(input.bridge, input.maxWaitMs ?? TEAM_EMAIL_MAX_WAIT_MS, input.label);
  const outcome: TeamEmailOutcome = { alert, sentTo: [], skipped: [] };
  try {
    const all = [...new Set(await input.recipients())];
    const wanted = teamEmailRecipients(all, alert);
    outcome.skipped = all.filter((to) => !wanted.includes(to));
    if (outcome.skipped.length) {
      console.info(
        `[${input.label}] p5 confirmed its team email; this site's copy to ${outcome.skipped.join(", ")} was not sent.`,
      );
    }
    for (const to of wanted) {
      try {
        await input.send(to);
        outcome.sentTo.push(to);
      } catch (err) {
        console.error(`[${input.label}] Team email to ${to} failed:`, err);
      }
    }
  } catch (err) {
    console.error(`[${input.label}] Team email send failed:`, err);
  }
  return outcome;
}

type After = (task: () => Promise<unknown>) => void;

/**
 * Hands the team email to after(), so the visitor's response never waits on
 * p5. If after() cannot take it (no request scope), nothing is known about the
 * bridge and the email is sent to everyone at once: the caller awaits the
 * returned promise, which is what the route did before this rule.
 */
export function scheduleTeamEmail(after: After, input: TeamEmailInput): Promise<TeamEmailOutcome> | null {
  try {
    after(() => sendTeamEmailAfterBridge(input));
    return null;
  } catch (err) {
    console.error(`[${input.label}] Could not schedule the team email; sending it now:`, err);
    return sendTeamEmailAfterBridge({ ...input, bridge: null });
  }
}
