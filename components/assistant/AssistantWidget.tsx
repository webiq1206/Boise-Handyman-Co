"use client";

/**
 * Floating chat widget for the conversational estimating assistant.
 *
 * Session-only by design: the transcript lives in sessionStorage and is sent
 * whole with every request; nothing is stored server-side. The panel is
 * labelled "Virtual assistant" so a visitor always knows what they are
 * talking to - the conversation itself does the human part.
 */
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useFormInView } from "@/hooks/use-form-in-view";
import Link from "next/link";
import { MessageCircle, Send, X } from "lucide-react";
import { continueAssistantProject } from "@/lib/p5/assistantContinuation";
import { trackEvent } from "@/lib/analytics";
import { requestHideMobileNavBar } from "@/lib/mobileNavBar";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const STORAGE_KEY = "brc_assistant_v1";
const WIZ_DRAFT_KEY = "brc_estimate_wizard_v1";
const MAX_INPUT_CHARS = 2_000;

const GREETING: ChatMessage = {
  role: "assistant",
  content:
    "I can help you describe a repair or installation and answer questions about our handyman service in the Treasure Valley. Our team reviews your project before confirming an estimate. What needs doing?",
};

/** Paths the widget must never appear on. */
// The ad funnel keeps Call and Text as its only actions.
const EXCLUDED_PREFIXES = ["/admin", "/subcontractor", "/handyman"];

/**
 * Replies reference internal pages as bare paths ("/consultation",
 * "/#calculator"). Render those as links; everything else stays plain text.
 */
function renderMessageText(text: string) {
  const parts = text.split(/(\/(?:#[a-z-]+|[a-z][a-z0-9\-/#]*))(?=[\s.,;:!?)]|$)/g);
  return parts.map((part, i) =>
    part.startsWith("/") && part.length > 1 ? (
      <Link key={i} href={part} className="underline underline-offset-2 text-accent-legible hover:opacity-80">
        {part}
      </Link>
    ) : (
      <span key={i}>{part}</span>
    ),
  );
}

export function AssistantWidget() {
  const pathname = usePathname();
  const formInView = useFormInView(pathname, true);
  const [open, setOpen] = useState(false);
  const openedOnce = useRef(false);
  const logRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    const openFromBar = () => {
      setOpen(true);
      if (!openedOnce.current) {
        openedOnce.current = true;
        trackEvent("assistant_opened", { page: pathname ?? "" });
      }
    };
    window.addEventListener("p5:assistant-open", openFromBar);
    return () => window.removeEventListener("p5:assistant-open", openFromBar);
  }, [pathname]);
  const [messages, setMessages] = useState<ChatMessage[]>([GREETING]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);

  /* Restore the session transcript once on mount. */
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as ChatMessage[];
        if (Array.isArray(saved) && saved.length > 0) setMessages(saved);
      }
    } catch {
      /* corrupt draft: start fresh */
    }
  }, []);

  /* Persist after every change. The untouched greeting-only state is never
     written: under StrictMode's double effect run it would race the restore
     effect and clobber a saved transcript with the empty greeting. */
  useEffect(() => {
    if (messages.length === 1 && messages[0] === GREETING) return;
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-60)));
    } catch {
      /* storage full/unavailable: chat still works, just won't survive nav */
    }
  }, [messages]);

  /* Opening always starts at the welcome. Later turns follow the newest line. */
  const baselineCount = useRef(0);
  const messageCount = useRef(messages.length);
  messageCount.current = messages.length;
  useLayoutEffect(() => {
    if (!open) return;
    baselineCount.current = messageCount.current;
    if (logRef.current) logRef.current.scrollTop = 0;
  }, [open]);
  useEffect(() => {
    if (!open) return;
    if (messages.length <= baselineCount.current && !sending) return;
    const log = logRef.current;
    if (log) log.scrollTo({ top: log.scrollHeight });
  }, [messages, sending, open]);

  useEffect(() => {
    if (!open) return;
    const coarse = window.matchMedia("(pointer: coarse)").matches || window.matchMedia("(max-width: 700px)").matches;
    if (coarse) return;
    inputRef.current?.focus({ preventScroll: true });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const release = requestHideMobileNavBar();
    const root = document.documentElement;
    const prevHtml = root.style.overflow;
    const prevBody = document.body.style.overflow;
    root.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    const sheet = () => document.querySelector<HTMLElement>("[data-testid='panel-assistant']");
    const pin = () => {
      const node = sheet();
      if (!node) return;
      const narrow = window.matchMedia("(max-width: 700px)").matches;
      if (!narrow) {
        node.style.top = "";
        node.style.height = "";
        node.style.left = "";
        node.style.right = "";
        node.style.bottom = "";
        node.style.borderRadius = "";
        return;
      }
      const vv = window.visualViewport;
      const top = vv?.offsetTop ?? 0;
      const height = vv?.height ?? window.innerHeight;
      node.style.top = `${top}px`;
      node.style.left = "0px";
      node.style.right = "0px";
      node.style.bottom = "auto";
      node.style.height = `${height}px`;
      node.style.borderRadius = "0px";
    };
    pin();
    window.visualViewport?.addEventListener("resize", pin);
    window.visualViewport?.addEventListener("scroll", pin);
    window.addEventListener("resize", pin);
    return () => {
      release();
      root.style.overflow = prevHtml;
      document.body.style.overflow = prevBody;
      window.visualViewport?.removeEventListener("resize", pin);
      window.visualViewport?.removeEventListener("scroll", pin);
      window.removeEventListener("resize", pin);
    };
  }, [open]);

  const close = useCallback(() => setOpen(false), []);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close]);

  const continueProject = () => {
    try { continueAssistantProject(messages,input); window.location.assign('/estimate?review=1'); }
    catch(error) { setMessages(cur=>[...cur,{role:'assistant',content:error instanceof Error?error.message:'Your project could not be saved. Please retry.'}]); }
  };

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || sending) return;
    setInput("");

    const next: ChatMessage[] = [...messages, { role: "user", content: text.slice(0, MAX_INPUT_CHARS) }];
    setMessages(next);
    setSending(true);
    trackEvent("assistant_message_sent", { page: pathname ?? "" });

    let draft: string | undefined;
    try {
      draft = sessionStorage.getItem(WIZ_DRAFT_KEY)?.slice(0, 2_000) ?? undefined;
    } catch {
      draft = undefined;
    }

    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          /* The greeting is client-side furniture, not part of the billed
             conversation: drop leading assistant messages so the API
             transcript starts with the visitor. */
          messages: next.slice(next.findIndex((m) => m.role === "user")),
          page: pathname ?? undefined,
          draft,
        }),
      });
      const data = (await res.json().catch(() => null)) as { reply?: string } | null;
      const reply =
        data?.reply ??
        "I'm having trouble connecting right now. Send a request on this page, or call (208) 477-1169.";
      setMessages((cur) => [...cur, { role: "assistant", content: reply }]);
    } catch {
      setMessages((cur) => [
        ...cur,
        {
          role: "assistant",
          content:
            "I'm having trouble connecting right now. Send a request on this page, or call (208) 477-1169.",
        },
      ]);
    } finally {
      setSending(false);
    }
  }, [input, sending, messages, pathname]);

  if (pathname && EXCLUDED_PREFIXES.some((p) => pathname.startsWith(p))) return null;

  return (
    <>
      {/* Launcher */}
      {!open && !formInView && (
        <button
          type="button"
          onClick={() => {
            setOpen(true);
            if (!openedOnce.current) {
              openedOnce.current = true;
              trackEvent("assistant_opened", { page: pathname ?? "" });
            }
          }}
          aria-label="Chat with our estimating assistant"
          data-testid="button-assistant-open"
          data-assistant-launcher
          className="fixed bottom-[calc(96px+env(safe-area-inset-bottom))] right-4 z-40 hidden min-[1180px]:flex h-13 w-13 min-h-11 min-w-11 items-center justify-center rounded-full bg-accent-legible text-background shadow-lg transition-transform hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-legible lg:bottom-6 lg:right-6"
          style={{ height: 52, width: 52 }}
        >
          <MessageCircle className="h-6 w-6" strokeWidth={1.75} />
        </button>
      )}

      {/* Panel */}
      {open && (
        <div
          role="dialog"
          aria-label="Estimating assistant chat"
          data-testid="panel-assistant"
          className="assistant-sheet fixed inset-x-0 bottom-0 z-[180] flex h-[100dvh] flex-col overflow-hidden border border-card-border bg-background shadow-2xl min-[701px]:inset-x-auto min-[701px]:bottom-5 min-[701px]:right-5 min-[701px]:h-[560px] min-[701px]:max-h-[calc(100dvh-6rem)] min-[701px]:w-[380px] min-[701px]:rounded-md"
        >
          {/* Header */}
          <div className="flex items-center justify-between gap-3 border-b border-card-border bg-card px-4 py-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-normal text-foreground">Boise Handyman Co</p>
              <p className="text-xs text-muted-foreground">Virtual assistant · project help</p>
            </div>
            <button
              type="button"
              onClick={close}
              aria-label="Close chat"
              data-testid="button-assistant-close"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-legible"
            >
              <X className="h-5 w-5" strokeWidth={1.75} />
            </button>
          </div>

          {/* Transcript */}
          <div
            ref={logRef}
            role="log"
            aria-live="polite"
            data-clarity-mask="True"
            className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4"
          >
            {messages.map((m, i) => (
              <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
                <div
                  className={
                    m.role === "user"
                      ? "max-w-[85%] whitespace-pre-wrap rounded-md rounded-br-sm bg-accent px-3.5 py-2.5 text-sm leading-relaxed text-accent-foreground"
                      : "max-w-[85%] whitespace-pre-wrap rounded-md rounded-bl-sm bg-card px-3.5 py-2.5 text-sm leading-relaxed text-foreground"
                  }
                >
                  {m.role === "assistant" ? renderMessageText(m.content) : m.content}
                </div>
              </div>
            ))}
            {sending && (
              <div className="flex justify-start" aria-hidden>
                <div className="flex items-center gap-1.5 rounded-md rounded-bl-sm bg-card px-4 py-3">
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:0ms]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:150ms]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:300ms]" />
                </div>
              </div>
            )}
          </div>

          <button type="button" onClick={continueProject} disabled={sending} data-testid="button-assistant-continue" className="mx-3 mb-2 min-h-11 rounded-sm border border-card-border px-3 py-2 text-sm text-foreground disabled:opacity-40">Continue project</button>
          {/* Composer */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void send();
            }}
            className="flex items-end gap-2 border-t border-card-border bg-card px-3 py-3"
          >
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void send();
                }
              }}
              rows={1}
              maxLength={MAX_INPUT_CHARS}
              placeholder="Ask about a repair or install..."
              aria-label="Message"
              name="assistant-message"
              autoComplete="off"
              enterKeyHint="send"
              data-testid="input-assistant-message"
              className="max-h-28 min-h-11 flex-1 resize-none rounded-sm border border-card-border bg-background px-3 py-2.5 text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-legible"
            />
            <button
              type="submit"
              disabled={sending || !input.trim()}
              aria-label="Send message"
              data-testid="button-assistant-send"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-sm bg-accent-legible text-background transition-opacity disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-legible"
            >
              <Send className="h-4.5 w-4.5" strokeWidth={1.75} style={{ height: 18, width: 18 }} />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
