import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const P5_FACEBOOK='https://www.facebook.com/1228704823655951';
const P5_GOOGLE='https://www.google.com/search?kgmid=/g/11ntl1t7dc';

// Boise Handyman Co has no social profiles of its own. The boiseremodeling
// handles never belonged to it and must not reach the footer or sameAs even if
// an old deployment still sets them.
test('boiseremodeling social URLs never render as this company\'s profiles',async()=>{
 process.env.NEXT_PUBLIC_FACEBOOK_URL='https://www.facebook.com/boiseremodeling';
 process.env.NEXT_PUBLIC_INSTAGRAM_URL='https://www.instagram.com/boiseremodeling/';
 const {GBP_SOCIAL}=await import('../shared/gbpProfile.ts');
 assert.equal(GBP_SOCIAL.facebook,'');
 assert.equal(GBP_SOCIAL.instagram,'');
 const {BUSINESS_INFO}=await import('../lib/seo.ts');
 assert.deepEqual(BUSINESS_INFO.sameAs.filter((url)=>/boiseremodeling/.test(url)),[]);
});

test('the business schema names P5 Home Co as parent organization',async()=>{
 const {P5_PARENT_ORGANIZATION}=await import('../lib/schema.ts');
 assert.equal(P5_PARENT_ORGANIZATION.name,'P5 Home Co');
 assert.equal(P5_PARENT_ORGANIZATION.url,'https://p5homeco.com');
});

// The owner's only social profile is P5 Home Co's Facebook page. It describes
// the parent, so it rides the parentOrganization node and the footer link
// labelled for P5, and never this brand's own sameAs.
test('the P5 Home Co Facebook page sits on the parent node, not this brand',async()=>{
 const {P5_SOCIAL}=await import('../shared/gbpProfile.ts');
 assert.equal(P5_SOCIAL.facebook,P5_FACEBOOK);
 const {P5_PARENT_ORGANIZATION}=await import('../lib/schema.ts');
 assert.deepEqual([...P5_PARENT_ORGANIZATION.sameAs],[P5_FACEBOOK,P5_GOOGLE]);
 const {BUSINESS_INFO}=await import('../lib/seo.ts');
 assert.equal(BUSINESS_INFO.sameAs.includes(P5_FACEBOOK),false);
 const footer=readFileSync('components/Footer.tsx','utf8');
 assert.match(footer,/GBP_SOCIAL\.facebook \|\| P5_SOCIAL\.facebook/);
 assert.match(footer,/"P5 Home Co on Facebook"/);
});

// Owner decision A (1 November 2026): the one Google Business Profile belongs
// to P5 Home Co, so it rides the parent node and a footer link labelled for
// P5, and never this brand's own sameAs, even if an env slot names it.
test('the P5 Home Co Google profile sits on the parent node, not this brand',async()=>{
 process.env.NEXT_PUBLIC_GBP_URL=P5_GOOGLE;
 const {P5_SOCIAL,getExternalProfileUrls}=await import('../shared/gbpProfile.ts');
 assert.equal(P5_SOCIAL.google,P5_GOOGLE);
 assert.deepEqual(getExternalProfileUrls(),[]);
 delete process.env.NEXT_PUBLIC_GBP_URL;
 const {BUSINESS_INFO}=await import('../lib/seo.ts');
 assert.equal(BUSINESS_INFO.sameAs.some((url)=>/11ntl1t7dc/.test(url)),false);
 const footer=readFileSync('components/Footer.tsx','utf8');
 assert.match(footer,/href=\{P5_SOCIAL\.google\}/);
 assert.match(footer,/"P5 Home Co on Google"/);
});
