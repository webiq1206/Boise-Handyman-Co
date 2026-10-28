'use client';
import {ArrowUpRight} from 'lucide-react';
import {Tabs,TabsList,TabsTrigger,TabsContent} from '@/components/ui/tabs';
import {Accordion,AccordionItem,AccordionTrigger,AccordionContent} from '@/components/ui/accordion';
import {FAQSection} from '@/components/FAQSection';
import {brands,cities} from './family-content';
const Arrow=()=> <ArrowUpRight size={18} aria-hidden="true"/>;
function Title({lines}:{lines:string[]}){return <>{lines[0]}<br/><em>{lines[1]}</em></>}
function Rows({items,numbered=false}:{items:[string,string][];numbered?:boolean}){return <Accordion type="single" collapsible defaultValue="0" className="f-accordion">{items.map(([title,copy],i)=><AccordionItem value={String(i)} key={title}><AccordionTrigger>{numbered&&<span className="f-number" aria-hidden="true">{String(i+1).padStart(2,"0")}</span>}<span>{title}</span></AccordionTrigger><AccordionContent>{copy}</AccordionContent></AccordionItem>)}</Accordion>}

export function ApprovedHome(){const b=brands['handyman'];const home='';const primary='/contact';
 // H-4: lead with everyday repairs; RE-10 lives on its own page with a short agents line.
 const tabs=b.services.filter(s=>s.slug!=='inspection-repairs').slice(0,3);
 const processBlock=<section className="f-section f-container f-two" id="how-we-build"><div className="f-sticky"><p className="f-eyebrow">KNOW WHAT HAPPENS NEXT</p><h2>A clear plan.<br/><em>At every step.</em></h2><p>Good work starts with a shared understanding of the scope, the decisions, and the next step.</p></div><Rows items={b.process} numbered/></section>;
 const approachBlock=<section className="f-section f-container f-two" id="why-choose-us"><div className="f-sticky"><p className="f-eyebrow">THE WAY WE WORK</p><h2>Good work.<br/><em>A better experience.</em></h2><p>{b.id==='handyman'?'Small jobs deserve a clear quote, a dependable visit, and a tidy finish.':'Clear expectations, thoughtful decisions, and someone accountable for the work. That is the P5 standard.'}</p></div><Rows items={b.approach}/></section>;

return <>
 <section className="f-section f-container" id="services"><div className="f-section-top"><div><p className="f-eyebrow">FIND YOUR STARTING POINT</p><h2><Title lines={b.serviceTitle}/></h2></div><p>{b.serviceIntro}</p></div><Tabs defaultValue={tabs[0].slug} className="f-explorer"><TabsList className="f-tabs">{tabs.map(s=><TabsTrigger value={s.slug} key={s.slug}>{s.name}</TabsTrigger>)}</TabsList>{tabs.map((s,i)=><TabsContent key={s.slug} value={s.slug}><div className="f-scene"><a className="f-scene-image" href={s.live || `/services/${s.slug}`} aria-label={`Explore ${s.name.toLowerCase()}`}><img src={s.image} alt={s.name} loading="lazy" width="1000" height="750"/></a><div className="f-scene-copy"><p className="f-eyebrow"><span aria-hidden="true" style={{letterSpacing:0}}>{String(i+1).padStart(2,"0")}</span>{" / "}{b.name.replace("Boise ","")}</p><h3>{s.name}</h3><p>{s.summary}</p><ul>{s.includes.slice(0,2).map(t=><li key={t}>{t}</li>)}</ul><a className="f-link" href={s.live || `/services/${s.slug}`}>Explore this service <Arrow/></a></div></div></TabsContent>)}</Tabs><p className="f-section-top" style={{marginTop:'1.5rem'}}><strong>For agents:</strong> RE-10 and inspection repair lists have their own page with document upload. <a className="f-link" href="/re-10-repairs-boise">Send the list and photos <Arrow/></a></p><a className="f-link f-browse-all" href={`${home}/services`}>View all services <Arrow/></a></section>

 <section className="f-value"><img src={b.valueImage} alt={b.id==='handyman'?'Finish carpentry and trim work':b.id==='construction'?'Coordinated framing and mechanical rough-in':b.id==='adu'?'A home and its surrounding property':'Materials and careful preparation for remodeling'} loading="lazy" width="1200" height="900"/><div><p className="f-eyebrow">{b.id==='adu'?'A SOUND STARTING POINT':'WHERE YOUR MONEY GOES'}</p><h2><Title lines={b.valueTitle}/></h2><p>{b.value}</p><a className="f-link" href={primary}>{b.action}<Arrow/></a></div></section>
 {approachBlock}{processBlock}
 <section className="f-area f-section f-container"><p className="f-eyebrow">AT HOME IN IDAHO</p><h2>Local people.<br/><em>Valley-wide reach.</em></h2><p>Serving homeowners throughout the Treasure Valley.</p><div>{cities.map(city=><a key={city} href={b.id==='adu'?`${home}/contact`:`/areas/${city.toLowerCase().replaceAll(" ","-")}`}>{city}<Arrow/></a>)}</div></section>
 <FAQSection/>
 </>;}
