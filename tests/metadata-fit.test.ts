import {test} from 'node:test';
import assert from 'node:assert/strict';
import {metadataFitIssues,withBrandPageMetadata} from '../lib/brand-page-metadata.ts';

const LONG_TITLE='How to Hire a Handyman in the Treasure Valley';
const LONG_DESCRIPTION='How to find and vet a handyman in Boise, Meridian, Eagle, and Nampa: what to check, what to ask, how quotes should work, and the red flags to walk away from.';

test('a title or description over budget is reported instead of silently cut',()=>{
 const issues=metadataFitIssues({title:LONG_TITLE,description:LONG_DESCRIPTION},'/guides/hire-a-handyman-treasure-valley');
 assert.equal(issues.length,2);
 assert.match(issues[0],/title is 65 characters/);
 assert.match(issues[1],/description is 157 characters/);
});

test('fitting metadata raises no issue',()=>{
 assert.deepEqual(metadataFitIssues({title:'How to Hire a Handyman in Boise, Idaho',description:'A short, complete description.'},'/guides/x'),[]);
});

test('strict mode (production build and the prebuild verifier) refuses to cut',()=>{
 const previous=process.env.BRAND_METADATA_STRICT;
 process.env.BRAND_METADATA_STRICT='1';
 try{
  assert.throws(()=>withBrandPageMetadata({title:LONG_TITLE,description:'Fine.'},'/guides/hire-a-handyman-treasure-valley'),/\[metadata-fit\] \/guides\/hire-a-handyman-treasure-valley: title is 65 characters/);
 }finally{
  if(previous===undefined)delete process.env.BRAND_METADATA_STRICT;else process.env.BRAND_METADATA_STRICT=previous;
 }
});

test('the RE-10 page ships its own metadata, not a core-page override',()=>{
 const result=withBrandPageMetadata({title:{absolute:'RE-10 and Inspection Repairs Boise | Boise Handyman Co'},description:'Own description.',alternates:{canonical:'https://boisehandyman.co/re-10-repairs-boise'}},'/re-10-repairs-boise');
 assert.equal(result.description,'Own description.');
 assert.equal((result.openGraph as {title?:string}).title,'RE-10 and Inspection Repairs Boise | Boise Handyman Co');
});
