import test from 'node:test';
import assert from 'node:assert/strict';
import {instructionPrompts,resolveInstructionChoice,withoutInstructionAnswers} from '../lib/p5/clarifications.ts';
import {require as tsxRequire} from 'tsx/cjs/api';
import {pathToFileURL} from 'node:url';
const resolver=()=>tsxRequire('../lib/p5/clarificationAnswer.ts',pathToFileURL(`${process.cwd()}/tests/p5-clarifications.test.ts`).href) as typeof import('../lib/p5/clarificationAnswer.ts');
import {emptyInstructions} from '../lib/p5/instructions.ts';
import {scopeQuestions} from '../lib/p5/adaptive.ts';
import type {ScopeExtraction} from '../lib/p5/scope.ts';
const scope=():ScopeExtraction=>({summary:'Trim scope',facts:[],conflicts:[],reviewNotes:[],missingInformation:[],instructions:{...emptyInstructions(),inclusions:['Trim'],exclusions:['Plumbing'],questions:['Labor only or materials only?','Should we include or exclude painting?']},documentCoverage:{expectedPages:80,complete:true,pages:[]},takeoffs:[]});

test('legacy paragraphs become distinct, concise questions and exact duplicates collapse',()=>{
  const e=scope();e.instructions!.questions=['Labor only or materials only? Should we include or exclude painting?','Labor only or materials only?'];
  const q=instructionPrompts(e,{});assert.equal(q.length,2);assert.deepEqual(q[0].values,['Labor only','Materials only','Labor and materials']);assert.equal(q[1].question,'Should we include or exclude painting?');
});
test('legacy company-fit questions use the service picker instead of an instruction loop',()=>{
  const e=scope();e.instructions!.questions=['Does the submitted scope require residential remodel work?','Which of the following services does your requested estimate cover?'];
  const q=scopeQuestions({},e);assert.equal(q.some(q=>q.instructionId),false);assert.ok(q.find(q=>q.field==='service')?.values?.length);
  e.instructions!.questions=['Which of the following services does your estimate cover? Should we include or exclude painting?'];
  assert.deepEqual(instructionPrompts(e,{}).map(q=>q.question),['Should we include or exclude painting?']);
});
test('answered questions stay resolved for the same scope without hiding changed questions',()=>{
  const e=scope();const answered=instructionPrompts(e,{})[1];
  const history=[{id:answered.id,question:answered.question,answer:'Exclude it'}];
  assert.deepEqual(instructionPrompts(e,{},history).map(q=>q.question),['Labor only or materials only?']);
  e.instructions!.questions=['Should we include or exclude flooring?'];
  assert.deepEqual(instructionPrompts(e,{},history).map(q=>q.question),['Should we include or exclude flooring?']);
});
test('replacement scopes discard prior clarification transcripts but preserve typed instructions',()=>{
  const history=[{id:'painting',question:'Should we include painting?',answer:'Exclude it'}];
  const value='Keep the first-floor trim.\n\nQuestion: Should we include painting?\nAnswer: Exclude it';
  assert.equal(withoutInstructionAnswers(value,history),'Keep the first-floor trim.');
});
test('exact retained four-option bench top question exposes choices and excludes are not selections',()=>{
  const e=scope();
  e.instructions!.questions=['Which bench top option should be included in the estimate?'];
  e.summary='Bench top schedule: Option 1: butcher block; Option 2: matching painted MDF/wood; Option 3: laminate; Option 4: quartz.';
  const prompt=instructionPrompts(e,{})[0];
  assert.deepEqual(prompt.values,['Butcher block','Matching painted MDF/wood','Laminate','Quartz']);
  const answer='Option 2: matching painted MDF/wood bench top only. Exclude butcher block, laminate and quartz alternatives.';
  assert.deepEqual(resolveInstructionChoice(prompt.values,answer),{selected:'Matching painted MDF/wood',excluded:['Butcher block','Laminate','Quartz'],ambiguous:false});
  assert.deepEqual(resolveInstructionChoice(prompt.values,'Option 2 only. Exclude option 1, option 3 and option 4.'),{selected:'Matching painted MDF/wood',excluded:['Butcher block','Laminate','Quartz'],ambiguous:false});
  assert.equal(resolveInstructionChoice(prompt.values,'Exclude butcher block, laminate and quartz.').selected,undefined);
  assert.equal(resolveInstructionChoice(prompt.values,'Butcher block or quartz.').ambiguous,true);
});
test('bench top clarification applies complete 14-hour scope without rereading pages',async()=>{
  const {resolveInstructionAnswer}=await resolver();
  process.env.OPENAI_API_KEY='synthetic';delete process.env.AI_INTEGRATIONS_OPENAI_API_KEY;
  const e=scope();e.instructions!.questions=['Which bench top option should be included in the estimate?'];
  e.summary='Option 1: butcher block; Option 2: matching painted MDF/wood; Option 3: laminate; Option 4: quartz.';
  e.facts=[
    {field:'laborHours',value:'10',confidence:.99,source:'cabinet.pdf',evidence:'Assembly 2 hours plus cabinet installation 8 hours',basis:'calculated'},
    {field:'installation',value:'Install butcher block or quartz top',confidence:.99,source:'cabinet.pdf',evidence:'Butcher block or quartz alternate',basis:'stated'},
    {field:'taskList',value:'Install quartz alternate',confidence:.99,source:'cabinet.pdf',evidence:'Quartz alternate',basis:'stated'},
  ];
  const answer='Option 2: matching painted MDF/wood bench top only. Exclude butcher block, laminate and quartz alternatives. Include the two cabinet units and 9 knobs/pulls. Assembly 2 hours + cabinet installation 8 hours + selected top fabrication/install 4 hours = 14 labor hours.';
  const id=instructionPrompts(e,{})[0].id;
  const request:typeof fetch=async(_url,options)=>{
    const body=JSON.parse(String(options?.body));assert.equal(body.input[0].content.some((c:any)=>c.type==='input_file'),false);
    const output={summary:'Selected cabinet scope',facts:[
      {field:'laborHours',value:'10',confidence:.99,source:'clarification answer',evidence:'Partial cabinet subtotal',basis:'stated'},
      {field:'taskList',value:'Install two cabinet units, 9 knobs/pulls and the selected bench top',confidence:1,source:'clarification answer',evidence:'Explicit selected scope',basis:'stated'},
      {field:'fixtureCount',value:'9',confidence:1,source:'clarification answer',evidence:'9 knobs/pulls',basis:'stated'},
      {field:'cabinetBaseLf',value:'13.3',confidence:1,source:'clarification answer',evidence:'13.3 LF bench top',basis:'stated'},
      {field:'cabinetTallLf',value:'0',confidence:1,source:'clarification answer',evidence:'Tall cabinet length not documented',basis:'stated'},
      {field:'installation',value:'Install all four top alternatives',confidence:1,source:'clarification answer',evidence:'Install all four options',basis:'stated'},
    ],conflicts:[],reviewNotes:[],missingInformation:[],clarifications:[],instructions:{...e.instructions,inclusions:['Matching painted MDF/wood'],exclusions:['Butcher block','Laminate','Quartz'],questions:[]},pages:[],takeoffs:[]};
    return Response.json({status:'completed',output:[{content:[{type:'output_text',text:JSON.stringify(output)}]}]});
  };
  try{
    const result=await resolveInstructionAnswer(e,{service:'cabinet-install',laborHours:'10',installation:'Install butcher block or quartz top',taskList:'Install quartz alternate'},{id,answer},[],request);
    assert.equal(result.answers.laborHours,'14');assert.equal(result.answers.materials,'Matching painted MDF/wood');
    assert.equal(result.answers.fixtureCount,'9');assert.match(result.answers.taskList||'',/two cabinet units.*9 knobs\/pulls/i);
    assert.equal(result.answers.cabinetBaseLf,undefined);assert.equal(result.answers.cabinetTallLf,undefined);
    assert.equal(result.answers.installation,undefined);assert.doesNotMatch(result.answers.taskList||'',/butcher|quartz/i);
    assert.equal(result.extraction?.documentCoverage,e.documentCoverage);assert.equal(result.extraction?.takeoffs,e.takeoffs);
    assert.deepEqual(result.extraction?.instructions?.exclusions,['Butcher block','Laminate','Quartz']);
  }finally{delete process.env.OPENAI_API_KEY;}
});
test('partial labor subtotals stay unresolved while explicit additive trade total applies',async()=>{
  const {resolveInstructionAnswer}=await resolver();
  process.env.OPENAI_API_KEY='synthetic';delete process.env.AI_INTEGRATIONS_OPENAI_API_KEY;
  const make=()=>{const e=scope();e.instructions!.questions=['Confirm the complete labor scope?'];return e};
  const request:typeof fetch=async()=>Response.json({status:'completed',output:[{content:[{type:'output_text',text:JSON.stringify({summary:'Labor',facts:[{field:'laborHours',value:'10',confidence:1,source:'clarification answer',evidence:'Assembly 2 and installation 8',basis:'calculated'}],conflicts:[],reviewNotes:[],missingInformation:[],clarifications:[],instructions:{...emptyInstructions(),questions:[]},pages:[],takeoffs:[]})}]}]});
  try{
    const partial=make(),partialId=instructionPrompts(partial,{})[0].id;
    const held=await resolveInstructionAnswer(partial,{service:'handyman'},{id:partialId,answer:'Assembly 2 hours and cabinet installation 8 hours.'},[],request);
    assert.equal(held.answers.laborHours,undefined);
    const additive=make(),additiveId=instructionPrompts(additive,{})[0].id;
    const applied=await resolveInstructionAnswer(additive,{service:'handyman'},{id:additiveId,answer:'Driveway excavation 16 plus concrete placement 24, totaling 40 labor hours.'},[],request);
    assert.equal(applied.answers.laborHours,'40');
  }finally{delete process.env.OPENAI_API_KEY;}
});
test('clarification updates instructions without sending documents or changing page coverage',async()=>{
  const {resolveInstructionAnswer}=await resolver();
  process.env.OPENAI_API_KEY='synthetic';delete process.env.AI_INTEGRATIONS_OPENAI_API_KEY;
  const e=scope();const id=instructionPrompts(e,{})[0].id;let calls=0;
  const request:typeof fetch=async(_url,options)=>{
    calls++;const body=JSON.parse(String(options?.body));assert.equal(body.input[0].content.some((c:any)=>c.type==='input_file'||c.type==='input_image'),false);
    const output={summary:'',facts:[],conflicts:[],reviewNotes:[],missingInformation:[],clarifications:[],instructions:{...e.instructions,laborOnly:true,questions:[]},pages:[],takeoffs:[]};
    return Response.json({status:'completed',output:[{content:[{type:'output_text',text:JSON.stringify(output)}]}]});
  };
  try{
    const result=await resolveInstructionAnswer(e,{service:'handyman'},{id,answer:'Labor only'},[],request);
    assert.equal(calls,1);assert.equal(result.extraction?.documentCoverage,e.documentCoverage);assert.equal(result.extraction?.takeoffs,e.takeoffs);
    assert.deepEqual(result.extraction?.instructions?.exclusions,['Plumbing']);assert.equal(result.extraction?.instructions?.laborOnly,true);
    assert.deepEqual(instructionPrompts(result.extraction,result.answers).map(q=>q.question),['Should we include or exclude painting?']);
    const repeated=await resolveInstructionAnswer(result.extraction,result.answers,{id,answer:'Labor only'},result.history,request);
    assert.equal(calls,1);assert.equal(repeated.history.length,1);assert.match(result.answers.estimatingInstructions||'',/Answer: Labor only/);
  }finally{delete process.env.OPENAI_API_KEY;}
});
test('invalid or stale clarification cannot replace the server extraction',async()=>{
  const {resolveInstructionAnswer}=await resolver();
  await assert.rejects(resolveInstructionAnswer(scope(),{},{id:'forged',answer:'yes'}),/question has changed/);
  await assert.rejects(resolveInstructionAnswer(scope(),{},{id:'x',answer:''}),/Enter an answer/);
});
