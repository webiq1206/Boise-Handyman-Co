import type {ScopeAnswers,ScopeExtraction} from './scope.ts';

export interface InstructionAnswer {id:string;question:string;answer:string}
export interface InstructionPrompt {id:string;question:string;detail?:string;values?:string[]}
export const questionKey=(text:string)=>text.toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const choiceText=(extraction:ScopeExtraction)=>[
  extraction.summary,
  ...Object.values(extraction.instructions||{}).flatMap(value=>Array.isArray(value)?value:[]),
  ...(extraction.facts||[]).flatMap(f=>[f.value,f.evidence]),
  ...(extraction.takeoffs||[]).flatMap(t=>[t.description,t.evidence,...t.issues]),
  ...extraction.missingInformation,
].filter(Boolean).join('\n');
export function retainedChoiceValues(extraction:ScopeExtraction|null,question:string){
  if(!extraction)return [];
  const source=choiceText(extraction);
  if(/\bbench\s*top\b|\bbenchtop\b|\bcounter\s*top\b|\bcountertop\b/i.test(question)){
    const choices=[
      {label:'Butcher block',pattern:/\bbutcher\s+block(?:\s+bench\s*top)?\b/i},
      {label:'Matching painted MDF/wood',pattern:/\bmatching\s+painted\s+(?:mdf(?:\s*\/\s*wood)?|wood(?:\s*\/\s*mdf)?)(?:\s+bench\s*top)?\b/i},
      {label:'Laminate',pattern:/\blaminate(?:\s+bench\s*top)?\b/i},
      {label:'Quartz',pattern:/\bquartz(?:\s+bench\s*top)?\b/i},
    ].map(choice=>({...choice,index:source.search(choice.pattern)})).filter(choice=>choice.index>=0).sort((a,b)=>a.index-b.index);
    if(choices.length>=2)return choices.map(choice=>choice.label);
  }
  const numbered=[...source.matchAll(/\b(?:option|alternate)\s*(\d+)\s*[:.)-]\s*([^;\n|]{2,120})/gi)]
    .sort((a,b)=>Number(a[1])-Number(b[1]))
    .map(match=>match[2].trim().replace(/[.,]$/,''));
  return numbered.length>=2?[...new Set(numbered)]:[];
}
const choiceTokens=(value:string)=>questionKey(value).split(' ').filter(token=>token.length>2&&!['bench','top','option','matching'].includes(token));
const mentionsChoice=(text:string,value:string)=>choiceTokens(value).every(token=>questionKey(text).split(' ').includes(token));
export function resolveInstructionChoice(values:string[]|undefined,answer:string){
  if(!values?.length)return {selected:undefined as string|undefined,excluded:[] as string[],ambiguous:false};
  const clauses=answer.split(/[.;\n]+/).map(part=>part.trim()).filter(Boolean);
  const excludedByName=values.filter(value=>clauses.some(clause=>/\b(?:exclude|omit|not included|do not include)\b/i.test(clause)&&mentionsChoice(clause,value)));
  const excludedByNumber=clauses.flatMap(clause=>/\b(?:exclude|omit|not included|do not include)\b/i.test(clause)?[...clause.matchAll(/\boption\s*(\d+)\b/gi)].map(match=>values[Number(match[1])-1]).filter(Boolean):[]);
  const excluded=[...new Set([...excludedByName,...excludedByNumber])];
  const option=[...answer.matchAll(/\boption\s*(\d+)\b/gi)]
    .filter(match=>!/\b(?:exclude|omit|not included|do not include)\b/i.test(answer.slice(Math.max(0,match.index!-24),match.index!)))
    .map(match=>values[Number(match[1])-1]).filter((value):value is string=>Boolean(value)&&!excluded.includes(value));
  const named=values.filter(value=>!excluded.includes(value)&&clauses.some(clause=>mentionsChoice(clause,value)&&!/\b(?:exclude|omit|not included|do not include)\b/i.test(clause)));
  const selected=[...new Set([...option,...named])];
  return {selected:selected.length===1?selected[0]:undefined,excluded,ambiguous:selected.length>1};
}
export const contradictsChoices=(text:string,selected:string|undefined,excluded:string[])=>excluded.some(value=>mentionsChoice(text,value))||
  Boolean(selected&&/\b(?:all|every|four|4)\b.{0,30}\b(?:options?|tops?|alternatives?)\b/i.test(text));
export function withoutInstructionAnswers(value:string|undefined,prior:InstructionAnswer[]=[]){
  if(!value||!prior.length)return value||'';
  const answered=new Set(prior.map(item=>`Question: ${item.question}\nAnswer: ${item.answer}`));
  return value.split(/\n{2,}/).map(part=>part.trim()).filter(part=>part&&!answered.has(part)).join('\n\n');
}
const serviceQuestion=(text:string)=>/which .*services|what .*remodel.*service|company.s scope|typical .*services|offered.*services|services.*offered|residential remodel|boise .*estimate|requested subset/i.test(text);

/** One question per card, including older extractions that stored paragraphs. */
export function instructionPrompts(extraction:ScopeExtraction|null,answers:ScopeAnswers,prior:InstructionAnswer[]=[]):InstructionPrompt[]{
  const result:InstructionPrompt[]=[];
  const answered=new Set(prior.map(item=>item.id));
  for(const raw of extraction?.instructions?.questions||[]){
    for(const part of raw.match(/[^?]+\??/g)||[]){
      const full=part.replace(/\s+/g,' ').trim();if(!full)continue;
      // Filter each question separately so a legacy paragraph cannot lose a real scope decision.
      if(serviceQuestion(full))continue;
      const id=questionKey(full);
      if(answered.has(id)||result.some(q=>q.id===id))continue;
      const question=full.length<=240?full:'What should we include for this part of your project?';
      const retained=retainedChoiceValues(extraction,full);
      const values=retained.length?retained:/labor.only/i.test(full)&&/materials.only/i.test(full)?['Labor only','Materials only','Labor and materials']:
        /include or exclude|include.*or.*exclude/i.test(full)?['Include it','Exclude it']:undefined;
      result.push({id,question,...(question!==full?{detail:full}:{}),values});
    }
  }
  return result;
}

/** Answers remain scope data for the pricing audit, with original pages intact. */
export function clarificationContext(extraction:ScopeExtraction,question:string,answer:string,choices:string[]=[],selected?:string,excluded:string[]=[]){
  return JSON.stringify({
    task:'Resolve only this answered scope question using the answer below. Apply every relevant stated quantity, included task, material, fixture and explicitly complete labor total as facts, as well as the complete updated instructions. An option named in an explicit exclusion is never selected. Preserve every unrelated inclusion, exclusion, responsibility, building and floor. Remove this question when answered. Never ask it again because a page was not reuploaded. This is a clarification of a document review already completed; do not reread documents or produce page records, takeoffs, or unreadable-file notes. Preserve distinct additive trade labor, but do not turn a partial subtotal into a complete project total. A countertop or bench-top length is not cabinet length, and a missing tall-cabinet length is not zero. If the selection is genuinely ambiguous, return one short, specific follow-up explaining the missing decision.',
    previousInstructions:extraction.instructions,question,choices,selectedChoice:selected,explicitlyExcludedChoices:excluded,answer,
  });
}
