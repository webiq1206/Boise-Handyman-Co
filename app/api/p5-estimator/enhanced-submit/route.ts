import {after} from "next/server";
import {postSubmission} from "@/lib/p5/submitEndpoint";
import {decorateEstimatorLead} from "@/server/services/enhancedConversionLead";
export async function POST(request:Request){
  return decorateEstimatorLead(request, await postSubmission(request, task => after(task)));
}
export const runtime="nodejs";
export const dynamic="force-dynamic";
export const maxDuration=300;
