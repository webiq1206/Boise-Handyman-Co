import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const policy = readFileSync(new URL('../app/privacy-policy/page.tsx', import.meta.url), 'utf8');

test('the privacy policy discloses cookies, analytics and advertising', () => {
  assert.match(policy, /Last updated: October 17, 2026/);
  assert.match(policy, /Cookies, analytics and advertising\. We use Google Analytics 4 \(GA4\) to understand how visitors use this site, such as pages viewed, referring site, approximate location, browser and device type\./);
  assert.match(policy, /Google's tag also adds visitors to remarketing lists, and Google may use this data to show you relevant ads on other websites \(remarketing\)\./);
  assert.match(policy, /When you successfully submit a form or finish the estimator with your contact details, our site passes whichever of these you provide \(your email address, phone number, first name, last name and ZIP code\) to Google's advertising tag, which converts them into a scrambled code \(a SHA-256 hash\) before sending them to Google\. Google matches that code against its own records to tell us which of our ads lead to inquiries\. We do not send your street address or your project description to Google\. From our forms, Google Analytics receives only the type of project you choose \(for example, drywall repair or plumbing repairs\) when you use the estimator or send an inquiry\. Google Ads receives a random reference number for your inquiry so each lead is counted only once\./);
  assert.equal(policy.includes("We do not currently send your name, email, phone number, address or project description to Google"), false);
  assert.equal(policy.includes("[TODO, pending Priya's exact wording.]"), false);
  assert.equal(policy.includes("the words you type into our blog search"), false);
  assert.match(policy, /We also use Microsoft Clarity to see how visitors use our pages through heatmaps and session recordings; form fields are masked so what you type is not recorded\. Microsoft processes this under its own privacy statement \(<a href="https:\/\/privacy\.microsoft\.com\/privacystatement">https:\/\/privacy\.microsoft\.com\/privacystatement<\/a>\)\./);
  assert.equal(policy.includes("[Placeholder, pending Larry's OK.]"), false);
  assert.equal(policy.includes('a drywall repair or a small plumbing repair'), false);
  assert.match(policy, /Calls from our site or ads may be routed through a Google forwarding number so we can measure which ads lead to calls; when that happens, Google connects the call and can see the calling number and call length, but not what's said\./);
  assert.equal(policy.includes("If your call goes through a Google forwarding number, Google connects the call and can see the calling number and call length, but not what's said."), false);
  assert.match(policy, /href="https:\/\/policies\.google\.com\/privacy"/);
  assert.match(policy, /href="https:\/\/adssettings\.google\.com"/);
  assert.match(policy, /href="https:\/\/tools\.google\.com\/dlpage\/gaoptout"/);
  assert.match(policy, /This site and Boise Remodeling Co use the same Meta Pixel\./);
  assert.match(policy, /The pixel records a page view\. Meta's pixel may also record which buttons you click and basic information about the page, such as its title\. Depending on Meta's settings, the pixel may also collect contact details you type into a form, in hashed form\./);
  assert.equal(policy.includes('automatic events such as button clicks and page metadata'), false);
  assert.equal(policy.includes('We do not send your name, email or phone number to Meta.'), false);
  assert.equal(policy.includes("we don't send"), false);
  assert.match(policy, /When you submit an inquiry, our server may send Meta the Lead event with/);
  assert.equal(policy.includes('we may send Meta the Lead event'), false);
  assert.match(policy, /the type of project you chose and the consultation category, the page address, the event time, a matching event id, your IP address, your browser user agent, and the Meta cookies _fbp and _fbc/);
  assert.match(policy, /href="https:\/\/www\.facebook\.com\/privacy\/policy"/);
  assert.equal(policy.includes('personalise ads'), false);
  assert.equal(policy.includes('an addition or an ADU'), false);
  assert.equal(policy.includes('hashed email'), false);
  assert.equal(policy.includes('We do not send your name, email, phone number or project details to Google'), false);
});

test('Meta automatic advanced matching is turned off before the pixel initializes', () => {
  const pixel = readFileSync(new URL('../components/MetaPixel.tsx', import.meta.url), 'utf8');
  const off = pixel.indexOf("fbq('set','autoConfig',false,");
  const init = pixel.indexOf("fbq('init',");
  assert.ok(off >= 0 && init > off);
});

function sourceFiles(dir: string): string[] {
  const files: string[] = [];
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name === '.next') continue;
    const path = join(dir, name);
    if (statSync(path).isDirectory()) files.push(...sourceFiles(path));
    else if (name.endsWith('.tsx')) files.push(path);
  }
  return files;
}

test('every form, estimator, intake, address, modal and chat container is masked for Clarity', () => {
  const root = new URL('..', import.meta.url);
  const unmasked: string[] = [];
  for (const file of sourceFiles(root.pathname)) {
    const source = readFileSync(file, 'utf8');
    const forms = source.match(/<form\b[^>]*>/g) ?? [];
    forms.forEach((tag, index) => {
      if (!tag.includes('data-clarity-mask="true"')) unmasked.push(`${file} form ${index + 1}`);
    });
  }
  assert.deepEqual(unmasked, []);
  const consultation = readFileSync(new URL('../components/ConsultationForm.tsx', import.meta.url), 'utf8');
  assert.match(consultation, /data-testid="consultation-success"[^>]*data-clarity-mask="true"|data-clarity-mask="true"[^>]*data-testid="consultation-success"/);
  for (const file of [
    'components/AddressAutocomplete.tsx',
    'components/P5AddressInput.tsx',
    'components/P5Estimator.tsx',
    'components/P5ExitOffer.tsx',
    'components/P5IntakeReview.tsx',
    'components/P5ReviewRequest.tsx',
    'components/assistant/AssistantWidget.tsx',
    'components/estimate/recovery/AbandonmentPrompt.tsx',
  ]) {
    assert.equal(readFileSync(new URL('../' + file, import.meta.url), 'utf8').includes('data-clarity-mask="true"'), true, file);
  }
});
