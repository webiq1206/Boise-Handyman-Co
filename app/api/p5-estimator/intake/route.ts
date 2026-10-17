import {getIntake,postIntake} from '@/lib/p5/intakeEndpoint';
import {draftCredentials,readDraft} from '@/lib/p5/store';
import {responseWithEnhancedDecision} from '@/server/services/enhancedConversionSuppression';
export {getIntake as GET};
export async function POST(request:Request){
  const response=await postIntake(request);
  if(response.status!==200)return response;
  let contact:{email?:string;phone?:string}|null=null;
  try{const {id,key}=draftCredentials(request);const draft=await readDraft(id,key);if(draft?.contact)contact={email:draft.contact.email,phone:draft.contact.phone};}
  catch{contact=null;}
  return responseWithEnhancedDecision(response,contact);
}
export const runtime='nodejs';
export const dynamic='force-dynamic';
