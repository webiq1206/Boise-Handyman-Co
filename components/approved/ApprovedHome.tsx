'use client';
import type {ReactNode} from 'react';
import {ArrowUpRight} from 'lucide-react';
import {Accordion,AccordionItem,AccordionTrigger,AccordionContent} from '@/components/ui/accordion';
import {brands,cities} from './family-content';
const Arrow=()=> <ArrowUpRight size={18} aria-hidden="true"/>;
function Rows({items,numbered=false}:{items:[string,string][];numbered?:boolean}){return <Accordion type="single" collapsible defaultValue="0" className="f-accordion">{items.map(([title,copy],i)=><AccordionItem value={String(i)} key={title}><AccordionTrigger>{numbered&&<span className="f-number" aria-hidden="true">{String(i+1).padStart(2,"0")}</span>}<span>{title}</span></AccordionTrigger><AccordionContent>{copy}</AccordionContent></AccordionItem>)}</Accordion>}

/*
 * Phase 3 homepage: each promise is said once. The services tab explorer, the
 * "Pay for the fix" value band and the "Good work" approach list restated the
 * written quote, materials line and trip-fee promises already carried by the
 * hero proof strip, so they are gone. What survives here is the process (how it
 * works) and the service area; the FAQ is rendered from app/page.tsx.
 */

/**
 * How it works: the five numbered steps, with the standing promises
 * ("What you can count on") in the sticky column beside them, so the page
 * says them once, next to the process they describe.
 */
export function ApprovedHowItWorks({aside}:{aside?:ReactNode}){const b=brands['handyman'];
 return <section className="f-section f-container f-two" id="how-we-build"><div className="f-sticky"><p className="f-eyebrow">KNOW WHAT HAPPENS NEXT</p><h2>A clear plan.<br/><em>At every step.</em></h2><p>Good work starts with a shared understanding of the scope, the decisions, and the next step.</p>{aside}</div><Rows items={b.process} numbered/></section>;}

/** Service area: the eight area pages as a rule list. */
export function ApprovedServiceArea(){
 return <section className="f-area f-section f-container"><p className="f-eyebrow">AT HOME IN IDAHO</p><h2>Local people.<br/><em>Valley-wide reach.</em></h2><p>Serving homeowners throughout the Treasure Valley.</p><div>{cities.map(city=><a key={city} href={`/areas/${city.toLowerCase().replaceAll(" ","-")}`}>{city}<Arrow/></a>)}</div></section>;}
