import {getIntake, postIntake} from '@/lib/p5/intakeEndpoint';
import {decorateEstimatorLead} from '@/server/services/enhancedConversionLead';
export const GET = getIntake;
export async function POST(request: Request) {
  return decorateEstimatorLead(request, await postIntake(request));
}
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
