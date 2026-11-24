"use client";
import React from "react";
import {OWNER_SERVICES,type OwnerServiceOptions} from "@/lib/p5/ownerServices";

/** Internal review only. These inputs never enter the public intake payload. */
export function P5OwnerServiceReview({value,onChange}:{value:string;onChange:(value:string)=>void}) {
  let input:any;
  try {input=JSON.parse(value);} catch {return <p>Correct the cost JSON to edit project service hours.</p>;}
  const options:OwnerServiceOptions=input.ownerServices||{};
  const update=(next:OwnerServiceOptions)=>onChange(JSON.stringify({...input,ownerServices:next},null,2));
  const field=(label:string,current:number|undefined,change:(value:number|undefined)=>void)=>(
    <label style={{display:"block",margin:"8px 0"}}>{label}
      <input aria-label={label} type="number" min="0.001" step="any" value={current??""} placeholder="Automatic"
        style={{display:"block",minHeight:44,width:"100%",maxWidth:280}}
        onChange={e=>change(e.target.value===""?undefined:Number(e.target.value))}/>
    </label>
  );
  return <section aria-label="Internal project service hours">
    <h3>Project service hours</h3>
    <p>Final client rate: $120/hour for each service, all tiers. Defaults per $1,000 outside direct cost:
      management 0.50h, administration 0.20h, accounting 0.10h. Minimums apply once per project:
      0.25h, 0.125h and 0.125h. Leave blank to use defaults. Existing owner salary recovery is credited once.</p>
    {OWNER_SERVICES.map(service=><div key={service.code}>
      {field(`${service.code} ${service.name} project hours`,options.hours?.[service.code],
        hours=>update({...options,hours:{...options.hours,[service.code]:hours}}))}
    </div>)}
    <p>Milestones share the project totals by outside costs, or equally when costs are unavailable.
      Explicit milestone hours override their share; they never repeat a project minimum.</p>
    {(options.milestones||[]).map((milestone,i)=><fieldset key={milestone.id}>
      <legend>{milestone.name}</legend>
      <label>Milestone name<input value={milestone.name} onChange={e=>update({...options,milestones:options.milestones!.map((m,j)=>j===i?{...m,name:e.target.value}:m)})}/></label>
      <label>Outside cost ($), optional<input type="number" min="0" step="any" value={milestone.outsideCost??""}
        onChange={e=>update({...options,milestones:options.milestones!.map((m,j)=>j===i?{...m,outsideCost:e.target.value===""?undefined:Number(e.target.value)}:m)})}/></label>
      {OWNER_SERVICES.map(service=><div key={service.code}>{field(`${milestone.name} ${service.name} hours`,milestone.hours?.[service.code],
        hours=>update({...options,milestones:options.milestones!.map((m,j)=>j===i?{...m,hours:{...m.hours,[service.code]:hours}}:m)}))}</div>)}
      <button type="button" onClick={()=>update({...options,milestones:options.milestones!.filter((_,j)=>j!==i)})}>Remove milestone</button>
    </fieldset>)}
    <button type="button" onClick={()=>update({...options,milestones:[...(options.milestones||[]),{id:crypto.randomUUID(),name:`Milestone ${(options.milestones?.length||0)+1}`}]})}>Add milestone</button>
    <label style={{display:"block",margin:"12px 0"}}>Service-hour override reason
      <textarea rows={2} value={options.reason||""} onChange={e=>update({...options,reason:e.target.value})}/>
    </label>
  </section>;
}
