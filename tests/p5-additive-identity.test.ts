import test from "node:test";
import assert from "node:assert/strict";
import {separateAdditiveQuantities,validateExtraction,combineScopeExtractions,type ExtractedFact,type ScopeConflict} from "../lib/p5/scope.ts";
import type {Takeoff} from "../lib/p5/documentLedger.ts";

const facts:ExtractedFact[]=[16,24].map(value=>({field:"laborHours",value:String(value),confidence:.99,source:"driveway.pdf",evidence:`${value} stated labor hours`,basis:"stated"}));
const line=(id:string,component:string,quantity:number):Takeoff=>({id,description:`${component} labor`,building:"Main",floor:"Site",component,quantity,unit:"hours",basis:"stated",evidence:`${quantity} labor hours`,sources:[{source:"driveway.pdf",page:1,sheet:"P1",revision:"1"}],supersedes:[],issues:[]});
const automatic:ScopeConflict={field:"laborHours",values:["16","24"],explanation:"The supplied information contains different values. Please confirm the intended scope."};

test("numeric excavation and concrete facts retain separate additive takeoffs",()=>{
  const takeoffs=[line("excavation","excavation",16),line("concrete","concrete",24)];
  const result=separateAdditiveQuantities(facts,[automatic],takeoffs);
  assert.equal(result.facts.length,0);
  assert.equal(result.conflicts.length,0);
  assert.deepEqual(takeoffs.map(item=>item.quantity),[16,24]);
});
test("different IDs and whitespace do not turn conflicting quantities for the same work into additive labor",()=>{
  const result=separateAdditiveQuantities(facts,[automatic],[line("excavation-a"," Excavation ",16),line("excavation-b","excavation",24)]);
  assert.deepEqual(result.facts,facts);
  assert.deepEqual(result.conflicts,[automatic]);
});
test("an explicit labor conflict survives even when matching quantities exist in separate trades",()=>{
  const conflict:ScopeConflict={...automatic,explanation:"The excavation estimate and site notes disagree about excavation labor."};
  const result=separateAdditiveQuantities(facts,[conflict],[line("excavation","excavation",16),line("concrete","concrete",24)]);
  assert.deepEqual(result.facts,facts);
  assert.deepEqual(result.conflicts,[conflict]);
});
test("an unrelated trade cannot provide the extra identity needed to erase a same-work conflict",()=>{
  const result=separateAdditiveQuantities(facts,[automatic],[line("excavation-a","excavation",16),line("excavation-b","excavation",24),line("electrical","electrical",7)]);
  assert.deepEqual(result.conflicts,[automatic]);
});

test("separate numeric facts from two source pages do not become an either-or labor question",()=>{
  const pages=[16,24].map((hours,index)=>validateExtraction({
    summary:"Driveway trade scope",facts:[facts[index]],conflicts:[],missingInformation:[],reviewNotes:[],
    takeoffs:[{...line(index?"concrete":"excavation",index?"concrete":"excavation",hours),sources:[{source:"driveway.pdf",page:index+1,sheet:`P${index+1}`,revision:"1"}]}],
  }));
  const combined=combineScopeExtractions(pages);
  assert.equal(combined.conflicts.some(conflict=>conflict.field==="laborHours"),false);
  assert.equal(combined.facts.some(fact=>fact.field==="laborHours"),false);
  assert.deepEqual(combined.takeoffs?.map(item=>item.quantity),[16,24]);
  assert.equal(combined.takeoffs?.reduce((sum,item)=>sum+(item.quantity||0),0),40);
});
