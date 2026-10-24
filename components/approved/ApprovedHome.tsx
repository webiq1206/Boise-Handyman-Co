'use client';
import {ArrowUpRight} from 'lucide-react';
import {Tabs,TabsList,TabsTrigger,TabsContent} from '@/components/ui/tabs';
import {Accordion,AccordionItem,AccordionTrigger,AccordionContent} from '@/components/ui/accordion';
import {FAQSection} from '@/components/FAQSection';
import {brands,cities} from './family-content';
import {ApprovedEstimate} from './ApprovedEstimate';
import {altForImage} from '@/shared/imageAlts';
import {imageProps} from '@/shared/imageVariants';
function Photo({src,alt,width,height}:{src:string;alt:string;width:number;height:number}){
  const variant=imageProps(src);
  return <img src={src} alt={altForImage(src)??alt} loading="lazy" width={variant?.width??width} height={variant?.height??height} srcSet={variant?.srcSet} sizes={variant?'(max-width: 900px) 100vw, 50vw':undefined}/>;
}
const Arrow=()=> <ArrowUpRight size={18} aria-hidden="true"/>;
function Title({lines}:{lines:string[]}){return <>{lines[0]}<br/><em>{lines[1]}</em></>}
function Rows({items,numbered=false}:{items:[string,string][];numbered?:boolean}){return <Accordion type="single" collapsible defaultValue="0" className="f-accordion">{items.map(([title,copy],i)=><AccordionItem value={String(i)} key={title}><AccordionTrigger>{numbered&&<span className="f-number" aria-hidden="true">{String(i+1).padStart(2,"0")}</span>}<span>{title}</span></AccordionTrigger><AccordionContent>{copy}</AccordionContent></AccordionItem>)}</Accordion>}

export function ApprovedHome(){const b=brands['handyman'];const home='';const primary='/estimate';const contact='/contact';
 const processBlock=<section className="f-section f-container f-two" id="how-we-build"><div className="f-sticky"><p className="f-eyebrow">KNOW WHAT HAPPENS NEXT</p><h2>A clear plan.<br/><em>At every step.</em></h2><p>Good work starts with a shared understanding of the scope, the decisions, and the next step.</p></div><Rows items={b.process} numbered/></section>;
 const approachBlock=<section className="f-section f-container f-two" id="why-choose-us"><div className="f-sticky"><p className="f-eyebrow">THE WAY WE WORK</p><h2>Good work.<br/><em>A better experience.</em></h2><p>{b.id==='handyman'?'Small jobs deserve a clear quote, a dependable visit, and a tidy finish.':'Clear expectations, thoughtful decisions, and someone accountable for the work. That is the P5 standard.'}</p></div><Rows items={b.approach}/></section>;

return <>
 <section className="f-section f-container" id="services"><div className="f-section-top"><div><p className="f-eyebrow">FIND YOUR STARTING POINT</p><h2><Title lines={b.serviceTitle}/></h2></div><p>{b.serviceIntro}</p></div><Tabs defaultValue={b.services[0].slug} className="f-explorer"><TabsList className="f-tabs">{b.services.slice(0,3).map(s=><TabsTrigger value={s.slug} key={s.slug}>{s.name}</TabsTrigger>)}</TabsList>{b.services.slice(0,3).map((s,i)=><TabsContent key={s.slug} value={s.slug}><div className="f-scene"><a className="f-scene-image" href={s.live || `/services/${s.slug}`} aria-label={`Explore ${s.name.toLowerCase()}`}><Photo src={s.image} alt={s.name} width={1000} height={750}/></a><div className="f-scene-copy"><p className="f-eyebrow"><span aria-hidden="true" style={{letterSpacing:0}}>{String(i+1).padStart(2,"0")}</span>{" / "}{b.name.replace("Boise ","")}</p><h3>{s.name}</h3><p>{s.summary}</p><ul>{s.includes.slice(0,2).map(t=><li key={t}>{t}</li>)}</ul><a className="f-link" href={s.live || `/services/${s.slug}`}>Explore this service <Arrow/></a></div></div></TabsContent>)}</Tabs><a className="f-link f-browse-all" href={`${home}/services`}>View all services <Arrow/></a></section>
 <ApprovedEstimate/>


 <section className="f-value"><Photo src={b.valueImage} alt={b.id==='handyman'?'Finish carpentry and trim work':b.id==='construction'?'Coordinated framing and mechanical rough-in':b.id==='adu'?'A home and its surrounding property':'Materials and careful preparation for remodeling'} width={1200} height={900}/><div><p className="f-eyebrow">{b.id==='adu'?'A SOUND STARTING POINT':'WHERE YOUR MONEY GOES'}</p><h2><Title lines={b.valueTitle}/></h2><p>{b.value}</p><a className="f-link" href={primary}>{b.action}<Arrow/></a></div></section>
 {approachBlock}{processBlock}
 <section className="f-image-pair f-container"><Photo src={b.services[1].image} alt={b.services[1].name} width={1000} height={800}/><div><Photo src={b.services[2].image} alt={b.services[2].name} width={900} height={675}/><p className="f-eyebrow">{b.id==='handyman'?'CARE IN THE SMALL DETAILS.':'A HOME THAT WORKS FOR YOU.'}</p><h3>{b.id==='handyman'?'You notice the difference. Every day.':'Thoughtful spaces. Everyday living.'}</h3></div></section>
 <section className="f-area f-section f-container"><p className="f-eyebrow">AT HOME IN IDAHO</p><h2>Local people.<br/><em>Valley-wide reach.</em></h2><p>Serving homeowners throughout the Treasure Valley.</p><div>{cities.map(city=><a key={city} href={b.id==='adu'?`${home}/contact`:`/areas/${city.toLowerCase().replaceAll(" ","-")}`}>{city}<Arrow/></a>)}</div></section>
 <FAQSection/>
 </>;}
