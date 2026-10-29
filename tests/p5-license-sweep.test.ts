import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ts from 'typescript';
import { generateFAQSchema, generateLocalBusinessSchema, generateReviewSchema, generateServiceSchema } from '../lib/schema.ts';
import { GBP_DESCRIPTION, GBP_QA_SEED } from '../shared/gbpProfile.ts';
import { HOMEPAGE_FAQS, INITIAL_FAQ_COUNT } from '../shared/homepageFaqs.ts';

const require = createRequire(import.meta.url);
const credentialSource = readFileSync(new URL('../components/ContractorCredential.tsx', import.meta.url), 'utf8');
const credentialCompiled = ts.transpileModule(credentialSource, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
}).outputText;
const credentialExports: { ContractorCredential?: React.ComponentType<{ showVerifyLink?: boolean }> } = {};
new Function('require', 'exports', credentialCompiled)(require, credentialExports);
const ContractorCredential = credentialExports.ContractorCredential!;

const FAQ_ANSWER =
  'Plumbing, electrical and HVAC work on your list is done by the licensed trade partners we schedule and stand behind, inside the same written quote and the same visit plan. Drywall, doors, mounting, fences, decks, caulk, assembly and hardware are our crew\'s own work. We are an Idaho Registered Contractor #8381215, bonded, and insured.';

/** A claim that this brand is licensed. Referrals to other trades stay allowed. */
const SELF_LICENSE =
  /\b(?:we are|we're|we’re|boise handyman co is|this company is)\b[^.]{0,180}\blicensed\b|\blicensed and insured\b|\blicensed, bonded\b|\bfully licensed\b|\bour license\b/i;

function selfLicenseHits(label: string, text: string): string[] {
  const hits: string[] = [];
  text.split(/\n/).forEach((line, index) => {
    if (SELF_LICENSE.test(line)) hits.push(`${label}:${index + 1}:${line.trim()}`);
  });
  return hits;
}

function sourceFiles(dir: string): string[] {
  const files: string[] = [];
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name === '.next' || name === 'admin' || name === 'subcontractor') continue;
    const path = join(dir, name);
    if (statSync(path).isDirectory()) files.push(...sourceFiles(path));
    else if (/\.(tsx|ts|txt)$/.test(name)) files.push(path);
  }
  return files;
}

test('rendered registration, FAQ schema, and GBP copy do not claim this brand is licensed', () => {
  const withLink = renderToStaticMarkup(React.createElement(ContractorCredential));
  const numberOnly = renderToStaticMarkup(React.createElement(ContractorCredential, { showVerifyLink: false }));
  assert.match(withLink, /Idaho Registered Contractor #8381215/);
  assert.match(withLink, /href="https:\/\/edopl\.idaho\.gov\/OnlineServices\/\?link=PubSearch"/);
  assert.match(withLink, /target="_blank"/);
  assert.match(withLink, /rel="noopener noreferrer"/);
  assert.match(withLink, /title="Look up registration 8381215 on Idaho DOPL"/);
  assert.match(withLink, /aria-label="Verify with Idaho DOPL: look up registration 8381215, opens in a new tab"/);
  assert.equal(numberOnly.includes('edopl.idaho.gov'), false);
  assert.match(numberOnly, /Idaho Registered Contractor #8381215/);

  const credentialFaq = HOMEPAGE_FAQS.find((faq) => faq.q === 'Are you a registered contractor and insured?');
  assert.ok(credentialFaq);
  assert.equal(credentialFaq.a, FAQ_ANSWER);
  assert.ok(HOMEPAGE_FAQS.slice(0, INITIAL_FAQ_COUNT).includes(credentialFaq));
  const gbpFaq = GBP_QA_SEED.find((faq) => faq.question === 'Are you a registered contractor and insured?');
  assert.ok(gbpFaq);
  assert.match(gbpFaq.answer, /an Idaho Registered Contractor #8381215, bonded, and insured/);

  const faqSchema = JSON.stringify(
    generateFAQSchema(HOMEPAGE_FAQS.slice(0, INITIAL_FAQ_COUNT).map((faq) => ({ question: faq.q, answer: faq.a }))),
  );
  assert.match(faqSchema, /Are you a registered contractor and insured\?/);
  assert.match(faqSchema, /an Idaho Registered Contractor #8381215, bonded, and insured/);

  const business = generateLocalBusinessSchema();
  const credential = {
    '@type': 'EducationalOccupationalCredential',
    credentialCategory: 'registration',
    name: 'Idaho Registered Contractor',
    identifier: '8381215',
    recognizedBy: {
      '@type': 'GovernmentOrganization',
      name: 'Idaho Division of Occupational and Professional Licenses',
      url: 'https://dopl.idaho.gov/con/',
    },
  };
  assert.deepEqual(business.hasCredential, credential);
  const provider = generateServiceSchema('Drywall repair', 'Patch a wall', 'Boise').provider as { hasCredential?: unknown };
  assert.deepEqual(provider.hasCredential, credential);
  assert.deepEqual(generateReviewSchema([]).hasCredential, credential);

  const rendered = [
    ['credential-link', withLink],
    ['credential-number', numberOnly],
    ['faq-schema', faqSchema],
    ['local-business', JSON.stringify(business)],
    ['gbp-description', GBP_DESCRIPTION],
    ...GBP_QA_SEED.map((entry) => [`gbp-qa:${entry.question}`, `${entry.question} ${entry.answer}`] as [string, string]),
    ...HOMEPAGE_FAQS.map((entry) => [`homepage-faq:${entry.q}`, `${entry.q} ${entry.a}`] as [string, string]),
    ['llms', readFileSync('public/llms.txt', 'utf8')],
    ['llms-full', readFileSync('public/llms-full.txt', 'utf8')],
  ];
  const hits = rendered.flatMap(([label, text]) => selfLicenseHits(label, text));
  assert.deepEqual(hits, []);
});

test('public copy has no self-claim that this brand is licensed', () => {
  const hits: string[] = [];
  for (const root of ['app', 'components', 'shared', 'public']) {
    for (const file of sourceFiles(root)) {
      const text = readFileSync(file, 'utf8');
      text.split(/\n/).forEach((line, index) => {
        if (SELF_LICENSE.test(line)) hits.push(`${file}:${index + 1}`);
      });
    }
  }
  for (const file of ['lib/schema.ts', 'lib/seo.ts', 'server/services/assistant/tools.ts']) {
    readFileSync(file, 'utf8').split(/\n/).forEach((line, index) => {
      if (SELF_LICENSE.test(line)) hits.push(`${file}:${index + 1}`);
    });
  }
  assert.deepEqual(hits, []);
});
