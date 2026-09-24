import assert from 'node:assert/strict';
import {POST} from '../app/api/estimate-lead/route';
async function main(){const response=await POST();const body=await response.json();assert.equal(response.status,410);assert.equal(body.priceable,false);assert.equal(body.nextStep,'/estimate');assert.equal(body.saved,undefined);assert.equal(body.accepted,undefined);console.log('Retired estimate API cannot confirm delivery or conversion.');}
main().catch(error=>{console.error(error);process.exitCode=1;});
