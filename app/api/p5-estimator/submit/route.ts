import {after} from "next/server";
import {postSubmission} from "@/lib/p5/submitEndpoint";
import {draftCredentials,readDraft} from "@/lib/p5/store";
import {responseWithEnhancedDecision} from "@/server/services/enhancedConversionSuppression";
export async function POST(request:Request){
  const response=await postSubmission(request,task=>after(task));
  if(response.status!==200)return response;
  const body=await response.clone().json().catch(()=>null) as {document?:{customer?:{email?:string;phone?:string}}}|null;
  const customer=body?.document?.customer;
  let contact=customer?.email||customer?.phone?{email:customer?.email,phone:customer?.phone}:null;
  if(!contact){
    try{const {id,key}=draftCredentials(request);const draft=await readDraft(id,key);if(draft?.contact)contact={email:draft.contact.email,phone:draft.contact.phone};}
    catch{contact=null;}
  }
  return responseWithEnhancedDecision(response,contact);
}
export const runtime="nodejs";
export const dynamic="force-dynamic";
export const maxDuration=300;
