import {analyzeBatch} from './extraction';
import {clarificationContext,contradictsChoices,instructionPrompts,questionKey,resolveInstructionChoice,type InstructionAnswer} from './clarifications';
import {DraftError} from './store';
import {mergeScopeFacts,protectPricingFacts,SCOPE_TEXT_LIMIT,type ExtractedFact,type ScopeAnswers,type ScopeExtraction} from './scope';

const explicitLaborTotal=(answer:string)=>{
  const matches=[...answer.matchAll(/(?:=|\btotal(?:ing|s|ed)?(?:\s+(?:of|is))?)\s*(\d+(?:\.\d+)?)\s*labor\s*hours?\b/gi)];
  return matches.length?matches.at(-1)![1]:undefined;
};
function applyClarification(extraction:ScopeExtraction,update:ScopeExtraction,answer:string,selected?:string,excluded:string[]=[]){
  const safe=protectPricingFacts(update);
  const deterministic:ExtractedFact[]=[];
  const labor=explicitLaborTotal(answer);
  if(labor)deterministic.push({field:'laborHours',value:labor,confidence:1,source:'clarification answer',evidence:`Explicit complete labor total: ${labor} labor hours`,basis:'stated'});
  if(selected)deterministic.push({field:'materials',value:selected,confidence:1,source:'clarification answer',evidence:`Selected option: ${selected}`,basis:'stated'});
  const deterministicFields=new Set(deterministic.map(f=>f.field));
  const facts=[...safe.facts.filter(f=>f.confidence>=.85&&f.field!=='laborHours'&&!deterministicFields.has(f.field)&&!contradictsChoices(`${f.value}\n${f.evidence}`,selected,excluded)),...deterministic];
  const fields=new Set(facts.map(f=>f.field));
  const contradictoryRetained=extraction.facts.filter(f=>contradictsChoices(`${f.value}\n${f.evidence}`,selected,excluded));
  for(const fact of contradictoryRetained)fields.add(fact.field);
  const sourceInstructions=safe.instructions||extraction.instructions;
  const instructions=sourceInstructions?{...sourceInstructions,inclusions:[...sourceInstructions.inclusions],exclusions:[...sourceInstructions.exclusions],questions:[...sourceInstructions.questions],responsibilities:[...sourceInstructions.responsibilities],buildings:[...sourceInstructions.buildings],floors:[...sourceInstructions.floors]}:undefined;
  if(instructions&&selected){
    instructions.inclusions=[...new Set([...instructions.inclusions.filter(value=>!contradictsChoices(value,selected,excluded)),selected])];
    instructions.exclusions=[...new Set([...instructions.exclusions.filter(value=>value!==selected),...excluded])];
  }
  return {
    extraction:{
      ...extraction,
      summary:safe.summary||extraction.summary,
      facts:[...extraction.facts.filter(f=>!fields.has(f.field)&&!contradictsChoices(`${f.value}\n${f.evidence}`,selected,excluded)),...facts],
      conflicts:[...extraction.conflicts.filter(c=>!fields.has(c.field)),...safe.conflicts.filter(c=>!fields.has(c.field))],
      missingInformation:[...new Set([...extraction.missingInformation,...safe.missingInformation])],
      reviewNotes:[...new Set([...extraction.reviewNotes,...safe.reviewNotes])],
      clarifications:safe.clarifications,
      instructions,
    },
    fields,
  };
}

export async function resolveInstructionAnswer(extraction:ScopeExtraction|null,answers:ScopeAnswers,raw:unknown,prior:InstructionAnswer[]=[],request=fetch){
  const value=raw as {id?:unknown;answer?:unknown};
  if(typeof value?.id!=='string'||typeof value.answer!=='string'||!value.answer.trim()||value.answer.length>SCOPE_TEXT_LIMIT)throw new DraftError('Enter an answer to continue.');
  const prompt=instructionPrompts(extraction,answers,prior).find(q=>q.id===value.id);
  if(!prompt||!extraction){
    if(prior.some(p=>p.id===value.id&&p.answer===String(value.answer).trim()))return {extraction,answers,history:prior};
    throw new DraftError('This question has changed. Refresh your saved project to continue.',409);
  }
  const answer=value.answer.trim(),question=prompt.detail||prompt.question;
  const choice=resolveInstructionChoice(prompt.values,answer);
  if(choice.ambiguous)throw new DraftError(`Choose one option: ${prompt.values!.join(', ')}.`);
  const result=await analyzeBatch(clarificationContext(extraction,question,answer,prompt.values,choice.selected,choice.excluded),[],answers,request,60000);
  if(!result.extraction.instructions)throw new DraftError('Your answer is still here. We could not save its scope update. Please retry.',503);
  const instructions=result.extraction.instructions;
  const repeated=instructions.questions.find(q=>questionKey(q)===prompt.id);
  if(repeated)throw new DraftError('Please make the scope decision explicit, such as what to include or exclude. Your answer is saved in this tab.');
  // Preserve other unanswered questions even if a provider omitted them.
  instructions.questions=[...new Set([...instructionPrompts(extraction,answers,prior).filter(q=>q.id!==prompt.id).map(q=>q.detail||q.question),...instructions.questions])];
  const record={id:prompt.id,question,answer};
  const combined=[answers.estimatingInstructions,`Question: ${question}\nAnswer: ${answer}`].filter(Boolean).join('\n\n');
  if(combined.length>SCOPE_TEXT_LIMIT)throw new DraftError('Upload the additional scope notes as a document to preserve them in full.');
  const applied=applyClarification(extraction,{...result.extraction,instructions},answer,choice.selected,choice.excluded);
  const current={...answers,estimatingInstructions:combined};
  for(const field of applied.fields)delete current[field];
  const merged=mergeScopeFacts(current,applied.extraction);
  return {extraction:applied.extraction,answers:merged.answers,history:[...prior,record]};
}
