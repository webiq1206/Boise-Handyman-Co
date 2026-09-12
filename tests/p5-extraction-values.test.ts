import test from "node:test";
import assert from "node:assert/strict";
import {validateAnswer,validateExtraction,combineScopeExtractions,protectPricingFacts} from "../lib/p5/scope.ts";
test("malformed numeric extraction cannot become a zero or a clarification option",()=>{
 for(const value of [",","1,,000","0x50","Infinity","80 feet"]){assert.ok(validateAnswer("sqft",value));}
 const fact=(value:string)=>({field:"sqft",value,confidence:.98,source:"scope.pdf",evidence:"Room area 80 square feet",basis:"stated"});
 const result=validateExtraction({summary:"Test scope",facts:[fact(","),fact("80.0")],conflicts:[],missingInformation:[],reviewNotes:[]});
 assert.equal(result.facts.length,1);assert.equal(result.facts[0].value,"80");
 assert.equal(result.conflicts.length,0);
 const other=validateExtraction({summary:"Same scope image",facts:[fact("80")],conflicts:[],missingInformation:[],reviewNotes:[]});
 assert.equal(combineScopeExtractions([result,other]).conflicts.length,0);
});
test("countertop length cannot become cabinet length and undocumented tall cabinets are not zero",()=>{
  const facts=[
    {field:"cabinetBaseLf",value:"13.3",confidence:1,source:"clarification answer",evidence:"13.3 LF bench top",basis:"stated"},
    {field:"cabinetTallLf",value:"0",confidence:1,source:"clarification answer",evidence:"Tall cabinet length not documented",basis:"stated"},
  ];
  const extraction=validateExtraction({summary:"Cabinet options",facts,conflicts:[],missingInformation:[],reviewNotes:[]});
  assert.deepEqual(protectPricingFacts(extraction).facts,[]);
});
