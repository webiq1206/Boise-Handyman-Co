import {applyCabinetIntent} from "./projectIntent";
import {advanceAnalysis} from "./analysisWork";
import {queuedJob} from './backgroundJobs';
import {activeReplacementDigests,reconcileScope,scopeQuestions,manualScopeAnswers,isExplicitProjectReplacement,replacementUploadIds} from "./adaptive";
import {costQuestionFields} from "./questionPolicy";
import {createHash} from "node:crypto";
import { analyzeScope } from "./extraction.ts";
import { prepareAnalysisFiles,verifyUpload } from "./documents";
import { SCOPE_BATCH_LIMIT,SCOPE_TEXT_LIMIT,SCOPE_FILE_COUNT,SCOPE_UPLOAD_HELP } from "./scope.ts";
import { draftCredentials,readDraft,readUploads,saveUpload,saveDraft,DraftError } from "./store";
import { failed,json,limitedBody,protectRequest } from "./http";
import { ESTIMATOR_BRAND } from "./brand";
import {withoutInstructionAnswers} from './clarifications';
export async function postScope(request:Request){
  try{
    protectRequest(request,1000);const {id,key}=draftCredentials(request);let draft=await readDraft(id,key);
    if(!draft)throw new DraftError("Save your draft before analyzing.",404);
    const bytes=await limitedBody(request,24*1024*1024);
    const form=await new Response(bytes as BodyInit,{headers:{"Content-Type":request.headers.get("content-type")||""}}).formData();
    const text=String(form.get("text")??draft.text);if(text.length>SCOPE_TEXT_LIMIT)throw new DraftError("Upload this scope as a document so every section can be processed.");
    const files=form.getAll("files");if(files.length>SCOPE_FILE_COUNT)throw new DraftError(SCOPE_UPLOAD_HELP);
    const requested:string[]=[];const incoming=[];const known=new Set(draft.uploads.map(f=>f.sha256));
    for(const file of files){
      if(!(file instanceof File))throw new DraftError("Invalid file.");
      let verified;try{verified=verifyUpload(file.name,Buffer.from(await file.arrayBuffer()));}catch(error){throw new DraftError(error instanceof Error?error.message:"Invalid upload.");}
      const digest=createHash("sha256").update(verified.data).digest("hex");
      requested.push(digest);
      if(!known.has(digest)){known.add(digest);incoming.push(verified);}
    }
    if(incoming.length+draft.uploads.length>SCOPE_FILE_COUNT)throw new DraftError(SCOPE_UPLOAD_HELP);
    if(incoming.reduce((n,f)=>n+f.data.length,0)+draft.uploads.reduce((n,f)=>n+f.size,0)>SCOPE_BATCH_LIMIT)throw new DraftError(SCOPE_UPLOAD_HELP,413);
    for(const file of incoming)await saveUpload(id,key,file);
    if(incoming.length){draft=await readDraft(id,key);if(!draft)throw new DraftError("Saved project could not be restored. Please retry.",503);}
    if(form.get("analyze")==="false")return json({draft:await readDraft(id,key),analysis:null});
    const replacementRequested=form.get('replace')==='confirmed'||form.get('replace')==='true'&&isExplicitProjectReplacement(text);
    const requestedActive=form.getAll('activeUploadSha256').filter((value):value is string=>typeof value==='string'&&/^[a-f0-9]{64}$/.test(value));
    const replacementActive=replacementRequested||draft.wizard?.replacementActive===true;
    const activeDigests=replacementActive?activeReplacementDigests(draft.wizard?.activeUploadSha256||[],requestedActive,replacementRequested):new Set(draft.uploads.map(file=>file.sha256));
    const activeIds=replacementActive?replacementUploadIds(draft.uploads,activeDigests):new Set(draft.uploads.map(file=>file.id));
    const activeDraft=replacementActive?{...draft,uploads:draft.uploads.filter(file=>activeIds.has(file.id))}:draft;
    const checkpointed=form.get("resumable")==="true"&&process.env.P5_OBJECT_STORAGE_ENABLED==="true";
    const stored=checkpointed?[]:(await readUploads(id,key)).filter(file=>activeIds.has(file.id));if(stored.reduce((n,f)=>n+f.data.length,0)>SCOPE_BATCH_LIMIT)throw new DraftError(SCOPE_UPLOAD_HELP,413);
    const version=createHash("sha256").update(JSON.stringify([text,activeDraft.uploads.map(f=>f.sha256)])).digest("hex");
    const sameSource=draft.wizard?.sourceVersion===version;
    const replacing=!sameSource&&replacementRequested;
    const resolutions=sameSource?draft.wizard?.resolutions||{}:{};
    const sourceAnswers=replacing?{}:sameSource?draft.answers:{...draft.answers,estimatingInstructions:withoutInstructionAnswers(draft.answers.estimatingInstructions,draft.wizard?.instructionAnswers)};
    const visitorAnswers=applyCabinetIntent(text,ESTIMATOR_BRAND.services,manualScopeAnswers(sourceAnswers,replacing?null:draft.extraction,resolutions)).answers;
    let analysis=null;let warning="";
    try{
      if(checkpointed){
        const background=form.get('background')==='true';
        const job=background?await queuedJob({kind:'analysis',draft:activeDraft,text,answers:visitorAnswers},form.get('retry')==='true'):null;
        if(job&&job.state!=='complete')return json({pending:job.state!=='failed',progress:job.progress,processing:job.processing,...(job.state==='failed'?{error:job.progress}:{})},job.state==='failed'?503:200);
        const step=job?job.result:await advanceAnalysis(activeDraft,text,visitorAnswers,fetch,form.get("retry")==="true");
        if(step.pending)return json(step);
        analysis=step.analysis;
      }else{
      const {readable,manualReview}=await prepareAnalysisFiles(stored);
      if(!text.trim()&&!readable.length&&!Object.values(draft.answers).some(v=>v?.trim()))throw new Error(manualReview.join(" ")||"Add a project description or a document.");
      analysis=await analyzeScope(text,readable,visitorAnswers);
      analysis.extraction.reviewNotes.push(...manualReview);
      }
      const unread=analysis.extraction.reviewNotes.filter((note:string)=>/saved for manual review|could not read|automatic read failed|automatic reading could not finish|unread section requires review|unreadable|partial/.test(note));
      if(unread.length)warning="Some files need review before pricing. "+unread.join(" ");
    }catch(error){
      console.error("[p5-scope-analysis]",error instanceof Error?error.message:"analysis failed");
      warning="Your files are saved, but automatic reading could not finish. You can retry without uploading again, or add the key details below. Unread documents will need review before pricing.";
    }
    if(analysis)analysis.extraction=applyCabinetIntent(text,ESTIMATOR_BRAND.services,visitorAnswers,analysis.extraction).extraction!;
    const extraction=analysis?.extraction||(replacing?null:draft.extraction);
    const merged=analysis?reconcileScope(visitorAnswers,analysis.extraction,resolutions):{answers:sourceAnswers,conflicts:[]};
    const wizard={instructionAnswers:sameSource?draft.wizard?.instructionAnswers||[]:[],skipped:sameSource?draft.wizard?.skipped||[]:[],resolutions,sourceVersion:analysis?version:draft.wizard?.sourceVersion,activeUploadSha256:replacementActive?[...activeDigests]:undefined,replacementActive};
    // Partial analysis is visible and prevents unread documents from being priced.
    const safeExtraction=warning?{...extraction,summary:extraction?.summary||text,facts:extraction?.facts||[],conflicts:extraction?.conflicts||[],missingInformation:extraction?.missingInformation||[],reviewNotes:[...new Set([...(extraction?.reviewNotes||[]),warning])]}:extraction;
    const saved=await saveDraft(id,key,ESTIMATOR_BRAND.id,{text,answers:merged.answers,extraction:safeExtraction,reviewed:null,contact:draft.contact,wizard},draft.revision);
    if(requested.some(digest=>!saved.uploads.some(file=>file.sha256===digest)))throw new DraftError("Some files could not be confirmed. Please retry; duplicate files will not be added twice.",503);
    const pricedFields=await costQuestionFields(saved.answers);
    return json({draft:saved,analysis,warning,conflicts:merged.conflicts,pricedFields,questions:scopeQuestions(saved.answers,safeExtraction,merged.conflicts,wizard.skipped,pricedFields,wizard.instructionAnswers)});
  }catch(error){return failed(error);}
}
