"use client";

import {useEffect, useReducer, useRef, useState} from "react";
import Link from "next/link";
import {Reveal} from "@/components/Reveal";
import {Section} from "@/components/marketing/Section";
import {CTA_SECONDARY} from "@/shared/ctaCopy";
import {formatPublicHandymanRange, type HandymanPlanningData} from "@/shared/handymanPlanning";
import {initialPlanningState, planningSelection, readPlanningState, updatePlanningState, type PlanningAction} from "@/shared/handymanPlanningState";
import styles from "./HandymanPlanningRange.module.css";

const STORAGE_KEY = "handyman-home-planning-v1";
const SHORT_LABELS: Record<string, string> = {
  "drywall-repair": "Drywall", "painting-touch-ups": "Painting", "plumbing-repairs": "Plumbing",
  "electrical-repairs": "Electrical", "mounting-assembly": "Mounting", "carpentry-trim-repair": "Carpentry",
};
const TASK_LABELS: Record<string, string> = {
  "drywall-small-patch": "Small patch", "drywall-large-patch": "Large patch", "drywall-ceiling-patch": "Ceiling patch", "drywall-texture-match": "Texture match",
  "paint-room-touch-up": "Room touch-up", "paint-accent-wall": "Single wall", "paint-door-trim": "Door or trim", "paint-exterior-spot": "Exterior",
  "plumbing-faucet-swap": "Faucet swap", "plumbing-toilet-repair": "Toilet repair", "plumbing-toilet-replace": "Toilet swap", "plumbing-disposal-swap": "Disposal swap",
  "electrical-outlet-switch": "Outlet / switch", "electrical-light-fixture": "Light fixture", "electrical-ceiling-fan": "Ceiling fan", "electrical-smoke-detector": "Smoke detector",
  "mount-tv": "TV mount", "mount-shelves": "Shelves / art", "assemble-furniture": "Furniture", "mount-curtain-rods": "Curtain rods",
  "carpentry-door-adjust": "Door repair", "carpentry-trim-repair": "Trim repair", "carpentry-cabinet-repair": "Cabinet door", "carpentry-window-repair": "Window / screen",
};

/** Instant public ranges are prepared on the server. No internal pricing inputs enter this component. */
export function HandymanPlanningRange({planning}: {planning: HandymanPlanningData}) {
  const [state, dispatch] = useReducer((current: ReturnType<typeof initialPlanningState>, action: PlanningAction) => updatePlanningState(planning, current, action), planning, initialPlanningState);
  const [restored, setRestored] = useState(false);
  const [fixedNav, setFixedNav] = useState(false);
  const [storageIssue, setStorageIssue] = useState(false);
  const panel = useRef<HTMLDivElement>(null);
  const navigation = useRef<HTMLElement>(null);
  const engaged = useRef(false);
  const historyMode = useRef<"push" | "replace">("replace");
  const fromHistory = useRef(false);
  const direction = useRef("forward");
  const lastStep = useRef(state.step);
  const {category, task} = planningSelection(planning, state);
  const stepNumber = state.step === "category" ? 1 : state.step === "task" ? 2 : state.step === "review" ? 3 : 4;
  const canContinue = state.step === "category" ? Boolean(category) : Boolean(task);

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (stored) dispatch({type: "restore", state: readPlanningState(planning, JSON.parse(stored))});
    } catch { setStorageIssue(true); }
    setRestored(true);
  }, [planning]);
  useEffect(() => {
    const update = () => {
      if (!panel.current) return;
      const r = panel.current.getBoundingClientRect();
      const h = document.querySelector("[data-family-header]")?.getBoundingClientRect().bottom || 0;
      panel.current.style.setProperty("--planner-left", `${r.left}px`);
      panel.current.style.setProperty("--planner-width", `${r.width}px`);
      const overlay = ["familyMenuOpen", "assistantOpen", "hideMobileNavBar", "p5EstimatorActive"].some(key => document.body.dataset[key] === "true");
      setFixedNav(!overlay && innerWidth < 1024 && r.top <= h + 24 && r.bottom > h + 64);
    };
    window.addEventListener("scroll", update, {passive: true}); window.addEventListener("resize", update); update();
    const observer = new MutationObserver(update); observer.observe(document.body, {attributes: true});
    return () => {observer.disconnect(); window.removeEventListener("scroll", update); window.removeEventListener("resize", update);};
  }, [state.step]);
  useEffect(() => {
    if (!panel.current || !navigation.current) return;
    const measure = () => panel.current?.style.setProperty("--planner-nav-height", `${navigation.current?.getBoundingClientRect().height || 0}px`);
    const observer = new ResizeObserver(measure); observer.observe(navigation.current); measure();
    return () => observer.disconnect();
  }, [fixedNav, state.step]);
  useEffect(() => {
    if (!restored) return;
    try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { setStorageIssue(true); }
    if (fromHistory.current) { fromHistory.current = false; historyMode.current = "replace"; return; }
    const snapshot = {...history.state, handymanHomePlanning: state};
    if (engaged.current && historyMode.current === "push") history.pushState(snapshot, "", window.location.href);
    else history.replaceState(snapshot, "", window.location.href);
    historyMode.current = "replace";
  }, [state, restored]);
  useEffect(() => {
    const restoreHistory = (event: PopStateEvent) => {
      if (!event.state?.handymanHomePlanning) return;
      fromHistory.current = true;
      engaged.current = true;
      const restoredState = readPlanningState(planning, event.state.handymanHomePlanning);
      const order = {category: 0, task: 1, review: 2, result: 3};
      direction.current = order[restoredState.step] < order[lastStep.current] ? "back" : "forward";
      dispatch({type: "restore", state: restoredState});
    };
    window.addEventListener("popstate", restoreHistory);
    return () => window.removeEventListener("popstate", restoreHistory);
  }, [planning]);
  useEffect(() => {
    lastStep.current = state.step;
    if (!engaged.current || !panel.current) return;
    const element = panel.current;
    const frame = requestAnimationFrame(() => {
      const header = document.querySelector<HTMLElement>("[data-family-header]");
      const top = (header?.getBoundingClientRect().height || 0) + (window.innerHeight < 500 ? 4 : 12);
      window.scrollTo({top: Math.max(0, element.getBoundingClientRect().top + window.scrollY - top), behavior: "auto"});
      element.querySelector<HTMLElement>("[data-step-first]")?.focus({preventScroll: true});
    });
    return () => cancelAnimationFrame(frame);
  }, [state.step]);
  const act = (action: PlanningAction) => {
    engaged.current = true;
    historyMode.current = action.type === "category" || action.type === "task" ? "replace" : "push";
    direction.current = action.type === "back" || action.type.startsWith("edit-") ? "back" : "forward";
    dispatch(action);
  };
  const arrowChoice = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (!["ArrowDown", "ArrowRight", "ArrowUp", "ArrowLeft", "Home", "End"].includes(event.key)) return;
    const choices = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>('button[role="radio"]'));
    const current = choices.indexOf(event.target as HTMLButtonElement);
    if (current < 0) return;
    event.preventDefault();
    const next = event.key === "Home" ? 0 : event.key === "End" ? choices.length - 1 : (current + (["ArrowDown", "ArrowRight"].includes(event.key) ? 1 : -1) + choices.length) % choices.length;
    choices[next]?.click(); choices[next]?.focus({preventScroll: true});
  };

  return <Section id="planning-range" surface="dark" spacing="xl" edge className="handyman-planning-range fr-band" data-testid="handyman-planning-range">
    <div className="ed-shell relative z-10">
      <div className="ed-split ed-split-end">
        <Reveal><p className="ed-eyebrow">Planning range</p><h2 className="ed-h2 ed-statement-wide">See a ballpark before you <em className="not-italic" style={{color: "var(--ed-accent)"}}>send the list</em>.</h2></Reveal>
        <Reveal delay={60}><p className="ed-body">Pick a common job. You get a planning range right away, then a written price before any work starts.</p></Reveal>
      </div>

      <div ref={panel} className={styles.panel} data-family-bar-yield="" data-testid="proof-step-panel" data-ready={restored} data-step={state.step} data-fixed-nav={fixedNav} data-direction={direction.current}>
        {category ? <>
          <div key={state.step} className={styles.stepBody}>
          <p className={styles.progress} aria-live="polite" data-testid="proof-progress">Step {stepNumber} of 4 <span aria-hidden="true">·</span> {storageIssue ? <span data-testid="proof-storage-note">Not saved on refresh</span> : state.step === "category" ? "Job" : state.step === "task" ? SHORT_LABELS[category.id] || "Task" : state.step === "review" ? "Review" : "Range"}</p>
          <h3 className={styles.heading} id="proof-step-heading"><span className={styles.shortProgress}>Step {stepNumber} of 4{storageIssue ? ": Not saved on refresh" : ""}: </span>{state.step === "category" ? "What kind of job?" : state.step === "task" ? "Which task?" : state.step === "review" ? "Your choices" : "Your planning range"}</h3>
          {state.step === "category" && <div role="radiogroup" aria-labelledby="proof-step-heading" className={styles.choices} onKeyDown={arrowChoice}>
            {planning.categories.map(item => <button type="button" key={item.id} role="radio" aria-label={item.label} aria-checked={category.id === item.id} tabIndex={category.id === item.id ? 0 : -1} data-step-first={category.id === item.id ? "" : undefined} data-testid={`proof-category-${item.id}`} className={styles.choice} onClick={() => act({type: "category", id: item.id})}>
              <span>{SHORT_LABELS[item.id] || item.label}</span>
            </button>)}
          </div>}
          {state.step === "task" && <>
            <div role="radiogroup" aria-labelledby="proof-step-heading" className={styles.choices} onKeyDown={arrowChoice}>
              {category.tasks.map((item, index) => <button type="button" key={item.id} role="radio" aria-label={item.label} aria-checked={task?.id === item.id} tabIndex={task?.id === item.id || (!task && index === 0) ? 0 : -1} data-step-first={task?.id === item.id || (!task && index === 0) ? "" : undefined} data-testid={`proof-task-${item.id}`} className={styles.choice} onClick={() => act({type: "task", id: item.id})}>
                <span>{TASK_LABELS[item.id] || item.label}</span>
              </button>)}
            </div>
            <p className={styles.hint} data-testid="proof-selection-help">{task?.description || (task ? task.label : "Choose a task to continue.")}</p>
          </>}
          {state.step === "review" && <div className={styles.result} data-testid="proof-review">
            <dl className={styles.summary}>
              <div><dt>Job</dt><dd>{SHORT_LABELS[category.id] || category.label}</dd><button type="button" onClick={() => act({type: "edit-category"})} data-step-first="" data-testid="proof-edit-category" aria-label="Change job">Change</button></div>
              <div><dt>Task</dt><dd>{task?.label || "Not chosen"}</dd><button type="button" onClick={() => act({type: "edit-task"})} data-testid="proof-edit-task" aria-label="Change task">Change</button></div>
            </dl>
            {task?.description && <p className={styles.notice} data-testid="proof-task-description">{task.description}</p>}
          </div>}
          {state.step === "result" && <div className={styles.result} aria-live="polite" data-testid="proof-result">
            {task?.range ? <><p className={styles.range} data-testid="proof-range-value">{formatPublicHandymanRange(task.range)}</p><p className={styles.taskName}>{task.label}</p><p className={styles.notice}>Preliminary guidance. Scope, materials and written price are confirmed before work starts.</p></> : <p className={styles.unpriced} data-testid={task ? "proof-unpriced" : "proof-empty"}>{task ? "This task needs a closer look. Send the list for a written price." : "Choose a task to see a planning range. No email required."}</p>}
            {task?.description && <p className={styles.qualifier} data-testid="proof-result-description">{task.description}</p>}
          </div>}
          </div>
          <nav ref={navigation} className={styles.navigation} aria-label="Planning range steps">
            <button type="button" className={styles.back} onClick={() => act({type: "back"})} data-testid="proof-back" data-step-first={state.step === "result" ? "" : undefined} aria-label={state.step === "category" ? "Back to range" : state.step === "result" ? "Review choices" : "Back"}>Back</button>
            {state.step === "result" ? <Link href="/#consult" className={styles.primary} data-testid="proof-cta-contact">{CTA_SECONDARY}</Link> : <button type="button" className={styles.primary} disabled={!canContinue} onClick={() => act({type: "next"})} data-testid="proof-next">{state.step === "category" ? "Choose task" : state.step === "task" ? "Review" : "See range"}</button>}
          </nav>
        </> : <div className={styles.result}><h3 className={styles.heading}>Planning range unavailable</h3><p>Send the list for a written price.</p><Link href="/#consult" className={styles.primary} data-testid="proof-cta-contact">{CTA_SECONDARY}</Link></div>}
      </div>
    </div>
  </Section>;
}
