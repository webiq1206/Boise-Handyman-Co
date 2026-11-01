/**
 * Third-party tag timing, split by what each tag is for (owner decision B,
 * 1 November 2026):
 *
 * - Meta Pixel requests fbevents.js at the window load event (atWindowLoad),
 *   with no interaction wait and no timeout. Paid-ad Landing Page Views matter
 *   more than the small blocking-time saving, and a visitor who bounces in the
 *   first seconds must still register.
 * - Microsoft Clarity waits for the visitor's first interaction, or for a
 *   timeout after the page has loaded (afterFirstInteraction).
 * - gtag loads before either.
 *
 * Each tag's stub still runs at once, so calls made before the script arrives
 * (Meta PageView and Lead, Clarity commands) are queued on the stub and
 * flushed by the vendor script when it loads. Nothing is dropped.
 */
export const THIRD_PARTY_INTERACTION_EVENTS = ['pointerdown', 'keydown', 'scroll', 'touchstart'] as const;

/** Never less than 5 seconds after the load event. */
export const THIRD_PARTY_TIMEOUT_MS = 5000;

/**
 * Wraps `body` (inline JavaScript) so it runs once: on the first pointerdown,
 * keydown, scroll or touchstart, or THIRD_PARTY_TIMEOUT_MS after window load,
 * whichever comes first. `body` runs in the scope where the returned code is
 * placed, so it can use that scope's variables. Its own locals (w, d, done,
 * timer, evs, opts, go, arm, _k) must not collide with names `body` needs.
 */
export function afterFirstInteraction(body: string): string {
  return `(function(w,d){var done=false,timer=0,evs=${JSON.stringify(THIRD_PARTY_INTERACTION_EVENTS)},opts={capture:true,passive:true};
function go(){if(done)return;done=true;clearTimeout(timer);for(var _k=0;_k<evs.length;_k++)w.removeEventListener(evs[_k],go,opts);${body}}
for(var _k=0;_k<evs.length;_k++)w.addEventListener(evs[_k],go,opts);
function arm(){timer=setTimeout(go,${THIRD_PARTY_TIMEOUT_MS});}
if(d.readyState==='complete')arm();else w.addEventListener('load',arm,{once:true});})(window,document);`;
}

/**
 * Wraps `body` (inline JavaScript) so it runs once at the window load event,
 * or at once if the document has already loaded. No interaction wait and no
 * timeout. `body` runs in the scope where the returned code is placed; its
 * own locals (w, d) must not collide with names `body` needs.
 */
export function atWindowLoad(body: string): string {
  return `(function(w,d){function go(){${body}}
if(d.readyState==='complete')go();else w.addEventListener('load',go,{once:true});})(window,document);`;
}
