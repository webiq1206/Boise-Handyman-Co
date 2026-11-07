'use client';
import {ServiceArea} from '@/components/family/ServiceArea';
import type {ReactNode} from 'react';
import Link from 'next/link';
import {ArrowUpRight} from 'lucide-react';
import {Accordion,AccordionItem,AccordionTrigger,AccordionContent} from '@/components/ui/accordion';
import {brands,cities} from './family-content';
const Arrow=()=> <ArrowUpRight size={18} aria-hidden="true"/>;
function Rows({items,numbered=false}:{items:[string,string][];numbered?:boolean}){return <Accordion type="single" collapsible defaultValue="0" className="f-accordion">{items.map(([title,copy],i)=><AccordionItem value={String(i)} key={title}><AccordionTrigger>{numbered&&<span className="f-number" aria-hidden="true">{String(i+1).padStart(2,"0")}</span>}<span>{title}</span></AccordionTrigger><AccordionContent>{copy}</AccordionContent></AccordionItem>)}</Accordion>}

/*
 * Homepage sections: each promise is said once. The process (how it works),
 * the founder, a quiet mid-page ask and the service area; the services block
 * and the FAQ are rendered from app/page.tsx.
 */

/**
 * How it works: the five numbered steps, with the standing promises
 * ("What you can count on") in the sticky column beside them, so the page
 * says them once, next to the process they describe.
 */
export function ApprovedHowItWorks({aside}:{aside?:ReactNode}){const b=brands['handyman'];
 return <section className="f-section f-container f-two" id="how-we-build"><div className="f-sticky"><p className="f-eyebrow">KNOW WHAT HAPPENS NEXT</p><h2>A clear plan.<br/><em>At every step.</em></h2><p>Good work starts with a shared understanding of the scope, the decisions, and the next step.</p>{aside}</div><Rows items={b.process} numbered/></section>;}

/** Who you are hiring: the family photograph beside the founder's words. Full photo, never cropped. */
export function ApprovedFounder(){
 return <section className="f-section f-container" id="who-you-are-hiring" aria-labelledby="who-hiring-heading">
  <div className="fr-founder">
   <img className="family-people-photo" src="/images/about/perkins-family-meridian-idaho-1x1.webp" alt="Nick Perkins with his wife and five children at a pumpkin patch in Meridian, Idaho" width="2048" height="2048" loading="lazy" style={{objectFit:'contain'}}/>
   <div>
    <p className="f-eyebrow">WHO YOU ARE HIRING</p>
    <h2 id="who-hiring-heading">Nick Perkins, founder.</h2>
    <p>Construction project manager with a bachelor&apos;s degree in Construction with an emphasis in Project Management, and more than a decade of custom homes, remodels and developments. Husband, father of five. The family moved to the Treasure Valley in 2025.</p>
    <blockquote>&ldquo;Work hard. Keep your word. Treat people right.&rdquo;</blockquote>
    <p><Link className="f-link" href="/about">Read Nick&apos;s story <Arrow/></Link></p>
   </div>
  </div>
 </section>;}

/** A quiet ask halfway down the page, for the reader who is already convinced. */
export function ApprovedCtaStrip(){
 return <section className="fr-cta-strip" aria-label="Send your list">
  <div className="f-container">
   <div><h2>Got a list? Send it over.</h2><p>Photos help. You get one written quote before any work starts, and we show up when we say we will.</p></div>
   <div className="fr-cta-strip-actions"><a className="f-button f-dark" href="/#consult">Send your list and photos</a><a className="f-link" href="/contact">Call or text us <Arrow/></a></div>
  </div>
 </section>;}

/** Service area: every area page as one line of linked cities. */
export function ApprovedServiceArea(){
 return <ServiceArea image={{src:'/family/drive/square-1-front-door-smart-lock.webp',alt:'Door handle and lock beside painted trim',width:1200,height:1200}}><p className="f-eyebrow">AT HOME IN IDAHO</p><h2>Local people.<br/><em>Valley-wide reach.</em></h2><p>Serving homeowners throughout the Treasure Valley.</p><nav className="fr-cities" aria-label="Service area cities">{cities.map(city=><a key={city} href={`/areas/${city.toLowerCase().replaceAll(" ","-")}`} aria-label={`Handyman services in ${city}`}>{city}</a>)}</nav></ServiceArea>;}
