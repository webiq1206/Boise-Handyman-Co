"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, ChevronRight, FileUp, ListChecks, MessageSquare, Phone } from "lucide-react";
import { P5Estimator } from "@/components/P5Estimator";
import EstimatorFrame from "@/components/estimator/EstimatorFrame";
import EstimatorAnalytics from "@/components/estimator/EstimatorAnalytics";
import { trackEvent } from "@/lib/analytics";
import { SITE_CONFIG } from "@/shared/siteConfig";
import styles from "./Re10Wizard.module.css";

/**
 * RE-10 app: one screen at a time, the same layout on every device.
 *
 * Screen 1 asks one question: tap the repairs, or send the file. Each path is
 * an engine that already exists, so nothing here computes a price:
 *   - "Tap the repairs" frames the P5 instant estimator (EstimatorFrame), the
 *     one estimator for the family. Its range is the estimator's own output.
 *   - "Send the file" is the shared document intake (P5Estimator, re10), which
 *     reads the RE-10, routes the request and keeps the written-quote promise.
 * Lead delivery for both paths is unchanged: each engine sends its own lead.
 *
 * #re10-price and #re10-send open a path directly, so links and the hero can
 * point at a screen. The bottom bar suppresses the site sticky bar while the
 * app is on screen (data-family-bar-yield, data-suppress-sticky-cta), so there
 * is only one.
 */
type Screen = "start" | "price" | "send";
const HASH: Record<string, Screen> = { "#re10-price": "price", "#re10-send": "send" };
const HEADER_OFFSET = 72;

export function Re10Wizard() {
  const [screen, setScreen] = useState<Screen>("start");
  const top = useRef<HTMLElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);

  const go = useCallback((next: Screen, focus = true) => {
    setScreen(next);
    if (next !== "start") trackEvent("re10_path_selected", { path: next });
    if (focus) requestAnimationFrame(() => {
      top.current?.scrollIntoView({ block: "start", behavior: "smooth" });
      heading.current?.focus({ preventScroll: true });
    });
  }, []);

  useEffect(() => {
    const read = () => {
      const next = HASH[window.location.hash];
      if (next) go(next);
    };
    read();
    window.addEventListener("hashchange", read);
    return () => window.removeEventListener("hashchange", read);
  }, [go]);

  const back = () => {
    if (HASH[window.location.hash]) history.replaceState(null, "", window.location.pathname + window.location.search + "#re10-wizard");
    go("start");
  };

  return (
    <section id="re10-wizard" ref={top} className={styles.wrap} aria-label="Price your RE-10 repairs" data-suppress-sticky-cta data-family-bar-yield>
      <div className={styles.app} data-screen={screen}>
        <header className={styles.bar}>
          <span className={styles.brand}>RE-10 repairs</span>
          <span className={styles.stepText}>{screen === "start" ? "Start here" : screen === "price" ? "Tap your repairs" : "Send your list"}</span>
        </header>

        {screen === "start" && (
          <div className={styles.screen}>
            <h2 ref={heading} tabIndex={-1} className={styles.title}>How do you want to price your RE-10?</h2>
            <p className={styles.lead}>Pick one. You can switch at any time.</p>
            <div className={styles.choices}>
              <button type="button" className={styles.choice} onClick={() => go("price")} data-testid="re10-choose-price">
                <span className={styles.icon} aria-hidden="true"><ListChecks size={24} /></span>
                <span className={styles.choiceText}>
                  <strong>Tap the repairs on my list</strong>
                  <span>See a price range on screen in about a minute.</span>
                </span>
                <ChevronRight className={styles.chev} size={20} aria-hidden="true" />
              </button>
              <button type="button" className={styles.choice} onClick={() => go("send")} data-testid="re10-choose-send">
                <span className={styles.icon} aria-hidden="true"><FileUp size={24} /></span>
                <span className={styles.choiceText}>
                  <strong>Send my RE-10 or photos</strong>
                  <span>We read the whole list and reply with one written price.</span>
                </span>
                <ChevronRight className={styles.chev} size={20} aria-hidden="true" />
              </button>
            </div>
            <p className={styles.note}>Either way, you get a written price before any work starts. Questions? Call or text Nick at {SITE_CONFIG.phone}.</p>
          </div>
        )}

        {screen === "price" && (
          <div className={styles.screen}>
            <h2 ref={heading} tabIndex={-1} className={styles.title}>Tap the repairs on your RE-10</h2>
            <p className={styles.lead}>
              Choose each item and how many. Your price range shows at the end.
            </p>
            <div className={styles.engine}>
              <EstimatorAnalytics />
              <EstimatorFrame brand="handyman" project="handyman" title={`${SITE_CONFIG.name} RE-10 price range`} headerOffset={HEADER_OFFSET} />
            </div>
            <p className={styles.note}>
              Item not on the list?{" "}
              <button type="button" className={styles.link} onClick={() => go("send")}>Send your RE-10 instead</button>
            </p>
          </div>
        )}

        {screen === "send" && (
          <div className={styles.screen}>
            <h2 ref={heading} tabIndex={-1} className={styles.title}>Send your RE-10</h2>
            <p className={styles.lead}>Add the RE-10 and inspection pages, or type the list. We confirm it with you and send one written price.</p>
            <div className={styles.intake}>
              <P5Estimator headingAs="h2" defaultService="re10" layout="embedded" />
            </div>
          </div>
        )}

        <nav className={styles.dock} aria-label="RE-10 actions">
          {screen !== "start" && (
            <button type="button" className={styles.dockBack} onClick={back} aria-label="Back to the first step">
              <ArrowLeft size={20} aria-hidden="true" />
            </button>
          )}
          <a className={styles.dockPrimary} href={SITE_CONFIG.phoneHref} data-testid="re10-app-call">
            <Phone size={18} aria-hidden="true" /> Call Nick
          </a>
          <a className={styles.dockSecondary} href={SITE_CONFIG.phoneSmsHref} data-testid="re10-app-text">
            <MessageSquare size={18} aria-hidden="true" /> Text
          </a>
        </nav>
      </div>
    </section>
  );
}
