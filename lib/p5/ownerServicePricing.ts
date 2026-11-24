import {cents,duplicateOwnerTime,excludedOutsideCost,ownerSalaryCredit,ownerServiceCode,planOwnerServices,type OwnerServiceOptions} from "./ownerServices.ts";
import type {DirectCostLine} from "./pricing.ts";

export function outsideOwnerLines(lines:DirectCostLine[]) {
  return lines.filter(l=>!duplicateOwnerTime(l)&&!ownerServiceCode(`${l.id} ${l.description}`));
}
/**
 * Called only while pricing a NEW result, never while reading/rendering saved
 * estimates. Credits are embedded in existing selling lines so QBO receives
 * three positive owner-service lines and a reconciling customer total.
 */
export function addOwnerServices<T extends {
  contractPrice:number; planningRange:{low:number;high:number}; planningBandHigh:number;
  riskAdjustedDirectCost:number;
  allocationDollars:{overhead:number};
  lines:(DirectCostLine&{cost:number;sellingAmount:number;sellingUnitPrice:number;overheadRecovery:number;operatingProfit:number;contingency:number;riskAdjustedCost:number})[];
}>(base:T,original:DirectCostLine[],options:OwnerServiceOptions={}) {
  const outside=base.lines.filter(l=>!excludedOutsideCost(l)).reduce((n,l)=>n+l.cost-(l.landed?.tax||0)*l.quantity,0);
  const recordedHours:NonNullable<OwnerServiceOptions["hours"]>={};
  for(const line of original){
    const code=ownerServiceCode(`${line.id} ${line.description}`);
    if(code&&/^(?:hours?|hr|hrs)$/i.test(line.unit)){
      if(!Number.isFinite(line.quantity)||line.quantity<=0)throw new Error("Recorded owner-service hours must be positive");
      recordedHours[code]=(recordedHours[code]||0)+line.quantity;
    }
  }
  const plan=planOwnerServices(Math.max(0,outside),{...options,hours:{...recordedHours,...options.hours}});
  const salaryCredit=ownerSalaryCredit(plan.total,base.allocationDollars.overhead,options.salaryOverheadCredit);
  // Integer-cent allocation ensures exact reconciliation without changing any
  // owner line's final hourly rate.
  const target=cents(base.contractPrice-salaryCredit);
  const lines=base.lines.map(line=>{
    const credit=base.allocationDollars.overhead>0?salaryCredit*line.overheadRecovery/base.allocationDollars.overhead:0;
    const sellingAmount=cents(line.sellingAmount-credit);
    return {...line,sellingAmount,sellingUnitPrice:sellingAmount/line.quantity,overheadRecovery:Math.max(0,line.overheadRecovery-credit)};
  });
  const drift=cents(target-lines.reduce((n,l)=>n+l.sellingAmount,0));
  if(lines.length) {
    const largest=lines.reduce((a,b)=>a.sellingAmount>b.sellingAmount?a:b);
    largest.sellingAmount=cents(largest.sellingAmount+drift);largest.sellingUnitPrice=largest.sellingAmount/largest.quantity;
  }
  const ownerLines=plan.lines.map(l=>({
    id:l.code,code:l.code,qboItemId:l.qboItemId,description:l.description,
    category:"other-direct" as const,trade:"General Conditions" as const,
    quantity:l.quantity,unit:l.unit,unitCost:0,cost:0,
    sellingAmount:l.amount,sellingUnitPrice:l.rate,finalClientRate:l.rate,
    overheadRecovery:0,operatingProfit:0,contingency:0,riskAdjustedCost:0,
    quantitySource:plan.assumption,evidence:{basis:"approved-cost-book" as const,reference:l.code,verifiedAt:"2026-11-23",validUntil:"2099-12-31"},
  }));
  const delta=cents(plan.total-salaryCredit);
  const contractPrice=cents(target+plan.total);
  return {...base,contractPrice:cents(target+plan.total),
    planningRange:{low:Math.ceil(base.planningRange.low+delta),high:Math.ceil(base.planningRange.high+delta)},
    planningBandHigh:Math.ceil(base.planningBandHigh+delta),
    operatingProfit:contractPrice-base.riskAdjustedDirectCost-cents(base.allocationDollars.overhead-salaryCredit)-plan.total,
    allocationDollars:{...base.allocationDollars,overhead:cents(base.allocationDollars.overhead-salaryCredit)},
    reconciliation:0,
    // Cost ledgers feed scope audits and must contain cost-bearing work only.
    // Final-rate owner services have their own priced ledger, joined solely by
    // internal and QBO presenters, never mistaken for unpriced scope components.
    lines,ownerServiceLines:ownerLines,
    ownerServices:{...plan,salaryOverheadCredit:salaryCredit,netAdded:delta,
      replacedOwnerLines:original.filter(l=>!outsideOwnerLines([l]).length).map(l=>({id:l.id,quantity:l.quantity,unitCost:l.unitCost}))}};
}
