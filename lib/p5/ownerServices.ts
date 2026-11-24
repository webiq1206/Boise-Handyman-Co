/**
 * Owner-authorized planning assumption, 2026-11-23.
 * These are FINAL customer rates, not direct-cost rates. Never apply tier,
 * contingency, overhead, profit or an urgency multiplier to them.
 * Pure/browser-safe so document pricing and consultation recomputation agree.
 */
export const OWNER_SERVICE_POLICY = "p5-owner-services-2026-11-23";
export const OWNER_RATE = 120;
export const OWNER_SERVICES = [
  {code:"01-31-03", name:"Project management", qboItemId:"48", perThousand:.50, minimum:.25},
  {code:"01-31-04", name:"Project administration", qboItemId:"49", perThousand:.20, minimum:.125},
  {code:"01-31-05", name:"Project accounting", qboItemId:"47", perThousand:.10, minimum:.125},
] as const;
export type OwnerServiceCode = typeof OWNER_SERVICES[number]["code"];
export type OwnerHours = Partial<Record<OwnerServiceCode, number>>;
export interface OwnerMilestone {id:string; name:string; outsideCost?:number; hours?:OwnerHours}
export interface OwnerServiceOptions {
  hours?:OwnerHours;
  milestones?:OwnerMilestone[];
  /** Explicit internal salary-overlap dollars; capped at actual recovered overhead. */
  salaryOverheadCredit?:number;
  reason?:string;
}
export interface OwnerServiceLine {
  code:OwnerServiceCode; description:string; qboItemId:string;
  quantity:number; plannedHours:number; unit:"hour"; rate:120; amount:number;
}
const positive=(n:number,label:string)=> {
  if(!Number.isFinite(n)||n<=0) throw new Error(`${label} must be finite and positive`);
  return n;
};
const nonnegative=(n:number,label:string)=>{
  if(!Number.isFinite(n)||n<0)throw new Error(`${label} must be finite and nonnegative`);
  return n;
};
export const cents=(n:number)=>Math.round((n+Number.EPSILON)*100)/100;
export function ownerServiceCode(value:string):OwnerServiceCode|undefined {
  return OWNER_SERVICES.find(s=>value.includes(s.code))?.code;
}
/** Known duplicate owner time only. Distinct outside field supervision stays. */
export function duplicateOwnerTime(line:{id?:string;code?:string;description?:string;ownerLaborTreatment?:string}) {
  const key=`${line.code||""} ${line.id||""} ${line.description||""}`;
  if(/\b01-31-0[12]\b|\bL-03-00\b/.test(key)||line.ownerLaborTreatment==="included-in-overhead")return true;
  if(/\b(?:outside|third[- ]party|subcontract|independent)\b.*\b(?:supervision|superintendent|supervisor)\b/i.test(key))return false;
  return /\b(?:owner|project) (?:management|administration|accounting)(?: and supervision)?\b|\bowner (?:supervision|salary|coordination)\b/i.test(line.description||"");
}
export function excludedOutsideCost(line:{id?:string;code?:string;description?:string;category?:string}) {
  const text=`${line.id||""} ${line.code||""} ${line.description||""}`;
  return !!ownerServiceCode(text)||duplicateOwnerTime(line)
    || line.category==="owner-production"
    || /\b(?:overhead (?:recovery|allocation|allowance|cost|charge)|(?:gross|operating) profit|sales tax|taxes|contingency|owner salary)\b/i.test(text)
    || /^(?:overhead|profit|tax)$/i.test(line.description?.trim()||"");
}
export function planOwnerServices(outsideDirectCost:number,options:OwnerServiceOptions={}) {
  nonnegative(outsideDirectCost,"Outside direct cost");
  const milestones=options.milestones?.length?options.milestones:[{id:"project",name:"Entire project"}];
  if(milestones.length>100||new Set(milestones.map(m=>m.id)).size!==milestones.length||milestones.some(m=>!m.id.trim()||!m.name.trim()))throw new Error("Milestones need unique identifiers and names (maximum 100)");
  for(const m of milestones)if(m.outsideCost!==undefined)nonnegative(m.outsideCost,"Milestone outside cost");
  const weighted=milestones.every(m=>m.outsideCost!==undefined)&&milestones.reduce((n,m)=>n+(m.outsideCost||0),0)>0;
  const costSum=milestones.reduce((n,m)=>n+(m.outsideCost||0),0);
  const assignments=milestones.map(m=>({id:m.id,name:m.name,hours:{} as Record<OwnerServiceCode,number>}));
  const lines:OwnerServiceLine[]=OWNER_SERVICES.map(service=>{
    const defaultHours=Math.max(service.minimum,outsideDirectCost/1000*service.perThousand);
    const projectOverride=options.hours?.[service.code];
    if(projectOverride!==undefined)positive(projectOverride,`${service.code} project hours`);
    let fixed=0;
    const open:number[]=[];
    milestones.forEach((m,i)=>{
      const override=m.hours?.[service.code];
      if(override===undefined)open.push(i);
      else {assignments[i].hours[service.code]=positive(override,`${service.code} milestone hours`);fixed+=override;}
    });
    // Milestone overrides are authoritative. Project totals distribute only
    // their remaining hours; the project minimum is NEVER repeated per phase.
    const total=projectOverride??defaultHours;
    if(projectOverride!==undefined&&fixed>total+1e-9)throw new Error("Milestone hours exceed the project override");
    if(!open.length&&projectOverride!==undefined&&Math.abs(fixed-total)>1e-9)throw new Error("Milestone hours must sum to the project override");
    const remaining=Math.max(0,total-fixed);
    const openWeight=open.reduce((n,i)=>n+(weighted?(milestones[i].outsideCost||0):1),0);
    let allocated=0;
    open.forEach((i,j)=>{
      const hours=projectOverride===undefined
        ? defaultHours*(weighted?(milestones[i].outsideCost||0)/costSum:1/milestones.length)
        : j===open.length-1?remaining-allocated:remaining*(openWeight>0?(weighted?(milestones[i].outsideCost||0):1)/openWeight:1/open.length);
      assignments[i].hours[service.code]=hours;allocated+=hours;
    });
    const plannedHours=assignments.reduce((n,m)=>n+m.hours[service.code],0);
    positive(plannedHours,`${service.code} total hours`);
    const amount=cents(plannedHours*OWNER_RATE);
    positive(amount,`${service.code} amount`);
    // QBO derives UnitPrice from Amount / Qty. Cent-normalized billed hours
    // keep that rate EXACTLY $120, even for cost-proportional fractional hours.
    // The unrounded internal override/default remains recorded as plannedHours.
    const quantity=amount/OWNER_RATE;
    let assigned=0;
    assignments.forEach((m,i)=>{
      m.hours[service.code]=i===assignments.length-1?quantity-assigned:m.hours[service.code]*quantity/plannedHours;
      assigned+=m.hours[service.code];
    });
    return {code:service.code,description:service.name,qboItemId:service.qboItemId,quantity,plannedHours,unit:"hour",rate:OWNER_RATE,amount};
  });
  const total=cents(lines.reduce((n,l)=>n+l.amount,0));
  return {policyVersion:OWNER_SERVICE_POLICY,outsideDirectCost,lines,milestones:assignments,total,options,
    assumption:"Editable planning assumption: hours per $1,000 outside direct cost are 0.50/0.20/0.10, with project minimums 0.25/0.125/0.125; final customer rate $120/hour."};
}
/** Never credit more salary recovery than either owner labor or actual overhead. */
export function ownerSalaryCredit(total:number,recoveredOverhead:number,override?:number) {
  if(override!==undefined)nonnegative(override,"Owner salary overhead credit");
  return cents(Math.min(total,Math.max(0,recoveredOverhead),override??total));
}
