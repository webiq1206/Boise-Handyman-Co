import test from "node:test";
import assert from "node:assert/strict";
import {planOwnerServices,ownerSalaryCredit,OWNER_SERVICES,duplicateOwnerTime} from "../lib/p5/ownerServices.ts";
import {calculateP5Estimate,customerEstimate,COST_CATEGORIES,DEFAULT_FINANCE,type PricingInput} from "../lib/p5/pricing.ts";
import {customerPresentation} from "../lib/p5/customerProjection.ts";
import {documentEstimateBody,linesByTrade} from "../lib/p5/documentEstimateFigures.ts";
import {resolveInternalEstimate,resolveQuotedRange} from "../shared/costs/resolve.ts";
import {EMPTY_REFINEMENTS} from "../shared/estimateEngine.ts";
import React from "react";
import {renderToStaticMarkup} from "react-dom/server";
import {P5OwnerServiceReview} from "../components/P5OwnerServiceReview.tsx";
import {P5LinePricing} from "../components/P5LinePricing.tsx";

const near=(a:number,b:number)=>assert.ok(Math.abs(a-b)<1e-7,`${a} != ${b}`);
const now=new Date("2026-11-23T12:00:00Z");
function input(cost=1000):PricingInput {
  return {service:"handyman",revision:"new-test-project",scopeSummary:"Repair the exterior trim",locationProvided:true,uncertainty:"medium",
    lines:[{id:"outside",description:"Outside trim crew",category:"subcontractors",quantity:1,unit:"package",unitCost:cost,priceBasis:"direct-cost",quantitySource:"Measured scope",
      evidence:{basis:"written-quote",reference:"supplier-test",verifiedAt:"2026-11-01",validUntil:"2027-01-01"}}],
    coverage:COST_CATEGORIES.map(category=>({category,status:category==="subcontractors"?"included":"not-applicable",reason:"Reviewed test scope"})),
    risks:[],assumptions:[],exclusions:[],missingInformation:[],allowances:[]};
}
test("small projects apply each minimum once; large projects use the outside-cost formula",()=>{
  assert.deepEqual(planOwnerServices(100).lines.map(l=>l.quantity),[.25,.125,.125]);
  assert.equal(planOwnerServices(100).total,60);
  assert.deepEqual(planOwnerServices(100000).lines.map(l=>l.quantity),[50,20,10]);
  assert.equal(planOwnerServices(100000).total,9600);
  for(const cost of [0,100,1000,1250.37,100000,1000000])for(const line of planOwnerServices(cost).lines)near(line.amount,line.quantity*120);
});
test("milestones divide project hours, not project minimums; overrides take precedence",()=>{
  const p=planOwnerServices(100,{milestones:[{id:"a",name:"Prep",outsideCost:25},{id:"b",name:"Complete",outsideCost:75}]});
  assert.equal(p.milestones[0].hours["01-31-03"],.0625);
  assert.equal(p.milestones[1].hours["01-31-03"],.1875);
  const equal=planOwnerServices(100,{milestones:[{id:"a",name:"Prep"},{id:"b",name:"Complete"}]});
  assert.equal(equal.milestones[0].hours["01-31-04"],.0625);
  const edited=planOwnerServices(100000,{hours:{"01-31-03":3},milestones:[{id:"a",name:"Prep",hours:{"01-31-03":1}},{id:"b",name:"Complete"}]});
  assert.equal(edited.lines[0].quantity,3);
  assert.equal(edited.milestones[1].hours["01-31-03"],2);
  assert.throws(()=>planOwnerServices(100,{hours:{"01-31-03":-1}}));
  assert.throws(()=>planOwnerServices(100,{hours:{"01-31-03":1},milestones:[{id:"a",name:"Prep",hours:{"01-31-03":2}}]}));
});
test("all document services, including cabinets, receive exactly three final-rate lines and reconcile",()=>{
  for(const service of ["handyman","cabinet-product","cabinet-install","re10","new-construction"] as const){
    const result=calculateP5Estimate({...input(10000),service},DEFAULT_FINANCE,[],now);
    assert.ok(result.publishable);
    assert.equal(result.ownerServices?.outsideDirectCost,10000);
    for(const def of OWNER_SERVICES){
      const rows=result.ownerServiceLines.filter(l=>l.id===def.code);
      assert.equal(rows.length,1);
      assert.equal(rows[0].sellingUnitPrice,120);
      near(rows[0].sellingAmount,rows[0].quantity*120);
      assert.equal(rows[0].contingency,0);
    }
    near([...result.lines,...result.ownerServiceLines].reduce((n,l)=>n+l.sellingAmount,0),result.contractPrice);
    near(result.riskAdjustedDirectCost+result.allocationDollars.overhead+result.operatingProfit+(result.ownerServices?.total||0),result.contractPrice);
  }
});
test("legacy owner allowances and salary recovery are credited once; outside supervision stays",()=>{
  const i=input(1000);
  i.lines.push({...i.lines[0],id:"01-31-01",description:"Prior owner allowance",unitCost:500});
  i.lines.push({...i.lines[0],id:"outside-supervisor",description:"Outside safety superintendent",unitCost:200});
  const result=calculateP5Estimate(i,DEFAULT_FINANCE,[],now);
  assert.ok(!result.lines.some(l=>l.id==="01-31-01"));
  assert.ok(result.lines.some(l=>l.id==="outside-supervisor"));
  assert.equal(result.ownerServices?.outsideDirectCost,1200);
  assert.equal(result.ownerServices?.replacedOwnerLines.length,1);
  assert.equal(result.ownerServices?.salaryOverheadCredit,result.ownerServices?.total);
  const repeated=calculateP5Estimate({...i,lines:result.lines},DEFAULT_FINANCE,[],now);
  near(repeated.contractPrice,result.contractPrice);
  assert.equal(ownerSalaryCredit(60,10),10);
  assert.equal(ownerSalaryCredit(60,100,5),5);
  assert.equal(duplicateOwnerTime({description:"Outside field supervision"}),false);
  assert.equal(duplicateOwnerTime({description:"Outside project management and supervision"}),false);
  assert.equal(duplicateOwnerTime({description:"Owner supervision"}),true);
});
test("project-specific cost-book hours precede defaults and internal overrides precede those hours",()=>{
  const i=input(10000);
  i.lines.push({...i.lines[0],id:"01-31-03",description:"Project management",unit:"hour",quantity:2,unitCost:120});
  assert.equal(calculateP5Estimate(i,DEFAULT_FINANCE,[],now).ownerServices?.lines[0].quantity,2);
  i.ownerServices={hours:{"01-31-03":3},reason:"Reviewed internal project hours"};
  assert.equal(calculateP5Estimate(i,DEFAULT_FINANCE,[],now).ownerServices?.lines[0].quantity,3);
});
test("overhead doors are real outside work, not financial overhead",()=>{
  const i=input(10000);i.lines[0].description="Replace overhead garage doors";
  assert.equal(calculateP5Estimate(i,DEFAULT_FINANCE,[],now).ownerServices?.outsideDirectCost,10000);
});
test("stored/historical pricing is not enriched; public output retains only scope and total",()=>{
  const historical=calculateP5Estimate({...input(),pricingState:"historical"},DEFAULT_FINANCE,[],now);
  assert.equal(historical.ownerServices,null);
  assert.equal(historical.lines.length,1);
  const result=calculateP5Estimate(input(),DEFAULT_FINANCE,[],now);
  const before=JSON.stringify(result);
  const publicResult=customerPresentation(customerEstimate(result,"Trim repairs"));
  assert.ok(publicResult.range);
  assert.ok(publicResult.lineItems.every((l:any)=>l.amount===undefined&&l.unitLow===undefined&&l.unitHigh===undefined&&l.qboItemId===undefined));
  assert.equal(publicResult.ownerServices,undefined);
  assert.equal(JSON.stringify(result),before);
});
test("QBO detail retains SKU mapping, $120/hour and exact sum even when grouping trade lines",()=>{
  const internal=calculateP5Estimate(input(100),DEFAULT_FINANCE,[],now);
  const customer=customerEstimate(internal,"Trim repairs");
  const exported=documentEstimateBody({internal,customer})!;
  near(exported.lines.reduce((n,l)=>n+l.amount,0),internal.contractPrice);
  for(const service of OWNER_SERVICES){
    const row=exported.lines.find(l=>l.sku===service.code)!;
    assert.equal(row.qboItemId,service.qboItemId);
    near(row.amount/row.quantity!,120);
  }
  const grouped=linesByTrade([...exported.lines,...Array.from({length:65},(_,i)=>({title:`Trade ${i}`,amount:1,division:"Painting"}))]);
  assert.equal(grouped.filter(l=>l.sku).length,3);
});
test("consultation recomputation uses the same service plan, removes old management and reconciles",()=>{
  for(const sqft of [50,2000]){
    const result=resolveInternalEstimate("kitchen","mid-range",sqft,EMPTY_REFINEMENTS)!;
    assert.ok(result);
    assert.ok(!result.internal.lines.some(l=>l.code==="L-03-00"));
    assert.equal(result.internal.ownerServices.lines.length,3);
    near(result.admin.trades.reduce((n,l)=>n+l.customerAmount,0),result.admin.customerPrice);
    const range=resolveQuotedRange("kitchen","mid-range",sqft,EMPTY_REFINEMENTS)!;
    assert.equal(range.priceLow,result.range.low);
    assert.equal(range.priceHigh,result.range.high);
  }
});
test("internal hour controls render project and milestone editing without customer calculation fields",()=>{
  const html=renderToStaticMarkup(React.createElement(P5OwnerServiceReview,{value:JSON.stringify({ownerServices:{milestones:[{id:"a",name:"Installation"}]}}),onChange:()=>{}}));
  assert.match(html,/01-31-03 Project management project hours/);
  assert.match(html,/Installation Project accounting hours/);
  assert.match(html,/Add milestone/);
  assert.match(html,/Remove milestone/);
});
test("internal line detail renders both new fees and pre-policy saved estimates",()=>{
  const current=calculateP5Estimate(input(),DEFAULT_FINANCE,[],now);
  const currentHtml=renderToStaticMarkup(React.createElement(P5LinePricing,{estimate:current}));
  assert.match(currentHtml,/Project management/);assert.match(currentHtml,/\$120\.00/);
  const old=calculateP5Estimate({...input(),pricingState:"historical"},DEFAULT_FINANCE,[],now);
  delete (old as Partial<typeof old>).ownerServiceLines;delete (old as Partial<typeof old>).ownerServices;
  const oldHtml=renderToStaticMarkup(React.createElement(P5LinePricing,{estimate:old}));
  assert.match(oldHtml,/Outside trim crew/);assert.doesNotMatch(oldHtml,/Project management/);
});
