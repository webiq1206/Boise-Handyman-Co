"use client";
import { SITE_CONFIG } from "@/shared/siteConfig";

/** Direct contact never requires the estimator or a third-party service. */
export function LandingContactActions({formId,formLabel,onDark=false}:{formId:string;formLabel:string;onDark?:boolean}) {
  const base="inline-flex min-h-12 items-center justify-center rounded-sm px-4 py-3 font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";
  return <div className="my-4 w-full max-w-xl" data-landing-contact>
    <div className="grid grid-cols-2 gap-3">
      <a href={SITE_CONFIG.phoneHref} aria-label={`Call ${SITE_CONFIG.name}`} className={`${base} ${onDark?'bg-background text-foreground':'bg-primary text-primary-foreground'}`}>Call Us</a>
      <a href={SITE_CONFIG.phoneSmsHref} aria-label={`Text ${SITE_CONFIG.name}`} className={`${base} border ${onDark?'border-white text-white':'border-current text-foreground'}`}>Text Us</a>
    </div>
    <a href={`#${formId}`} className="mt-2 inline-flex min-h-11 items-center underline underline-offset-4 focus-visible:outline focus-visible:outline-2" onClick={()=>document.getElementById(formId)?.focus({preventScroll:true})}>{formLabel}</a>
    <p className="text-sm">{SITE_CONFIG.phone} · Prefer another option? Use the form below.</p>
  </div>;
}
