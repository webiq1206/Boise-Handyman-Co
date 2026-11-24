"use client";
import React,{useState} from "react";
import type {P5Estimate} from "@/lib/p5/pricing";
const money=(n:number)=>n.toLocaleString("en-US",{style:"currency",currency:"USD",minimumFractionDigits:2,maximumFractionDigits:2});
export function P5LinePricing({estimate}:{estimate:P5Estimate}){
  const [filter,setFilter]=useState("");
  const lines=[...estimate.lines,...(estimate.ownerServiceLines||[])].filter(line=>`${line.description} ${line.trade}`.toLowerCase().includes(filter.toLowerCase()));
  return <section aria-label="Item pricing breakdown"><h3>Item pricing breakdown</h3>
    <p>Outside work includes direct cost, contingency, overhead and operating profit. Owner services are final $120/hour customer rates with no additional markup. Salary recovery is credited once against overlapping owner services.</p>
    {estimate.ownerServices&&<p>Outside-cost basis: {money(estimate.ownerServices.outsideDirectCost)}.
      Owner services: {money(estimate.ownerServices.total)}.
      Salary overhead credit: {money(estimate.ownerServices.salaryOverheadCredit)}.
      Net added: {money(estimate.ownerServices.netAdded)}.</p>}
    {estimate.ownerServices&&<details><summary>Service hours by milestone</summary>
      {estimate.ownerServices.milestones.map(m=><div key={m.id}><strong>{m.name}</strong>
        <ul>{Object.entries(m.hours).map(([code,hours])=><li key={code}>{code}: {hours.toLocaleString("en-US",{maximumFractionDigits:6})} hours</li>)}</ul>
      </div>)}</details>}
    <label>Find a priced item<input style={{display:"block",width:"100%",maxWidth:"100%",minHeight:44,fontSize:16,padding:12,color:"#17201b",background:"#fff",boxSizing:"border-box"}} value={filter} onChange={e=>setFilter(e.target.value)} placeholder="Description or trade"/></label>
    <p>{lines.length} matching items.</p>
    {lines.map(line=>{
      const owner=estimate.ownerServices?.lines.find(service=>service.code===line.id);
      return <details key={line.id} style={{border:"1px solid #88928c",borderRadius:8,padding:14,margin:"12px 0"}}><summary style={{minHeight:44,cursor:"pointer"}}>{line.trade}: {line.description} ({money(line.sellingAmount)})</summary>
      {owner?<p>{owner.code}: {owner.quantity.toLocaleString("en-US",{maximumFractionDigits:6})} hours at {money(owner.rate)} final client rate. Requested QBO item {owner.qboItemId}.</p>
        :<p>{line.quantity.toLocaleString("en-US")} {line.unit} at {money(line.unitCost)} direct cost per {line.unit}.</p>}
      <dl style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(min(100%,210px),1fr))",gap:16,margin:0}}>{(owner?[["Final client hourly rate",owner.rate],["Service charge",owner.amount]]:[["Direct cost",line.cost],["Contingency",line.contingency],["Overhead recovery",line.overheadRecovery],["Operating profit",line.operatingProfit],["Selling price per unit",line.sellingUnitPrice],["Selling amount",line.sellingAmount]]).map(([label,value])=><div key={String(label)}><dt>{String(label)}</dt><dd style={{margin:0,fontWeight:600}}>{money(Number(value))}</dd></div>)}</dl>
    </details>})}
  </section>;
}
