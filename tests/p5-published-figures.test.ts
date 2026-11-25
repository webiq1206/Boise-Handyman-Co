/**
 * Published handyman prices come from the instant estimator (owner
 * instruction, 20 November 2026).
 *
 * Every price this site publishes for a handyman job must be one the P5
 * instant estimator (the tool behind "Get an instant estimate") would show for
 * the job the copy names, so nobody reading a page is misled by what the
 * estimator then says. scripts/pricing/p5-published-figures.mts runs the
 * estimator and writes shared/content/p5PublishedFigures.json; these tests pin
 * the copy to that file.
 *
 * A dollar range in published copy must be a range in the JSON. Any other
 * dollar figure must be listed below with the reason it is not a price for our
 * work (a city permit fee, a retail part price, a budgeting rule). The only
 * hourly figure allowed is the labor rate the estimator uses.
 *
 * When the cost book changes: re-run the script, then change the copy until
 * these tests pass. Never widen the allowlist to admit a job price.
 * Set P5_HOME_CO_DIR to a p5-home-co checkout to also check the JSON against
 * the estimator itself.
 */
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';

type Range = { low: number; high: number; label: string; inputs: { tasks: Record<string, number> } };
type Figures = {
  about: string;
  asOf: string;
  inputs: { brand: string; project: string; tier: string; laborRatePerHour: number; costBook: string };
  tasks: Record<string, Range & { quantity: number }>;
  lists: Record<string, Range>;
  singleTaskSpan: { low: number; high: number };
};

const FIGURES_FILE = 'shared/content/p5PublishedFigures.json';
const figures = JSON.parse(readFileSync(FIGURES_FILE, 'utf8')) as Figures;
const money = (n: number) => `$${n.toLocaleString('en-US')}`;
const range = (r: { low: number; high: number }) => `${money(r.low)} to ${money(r.high)}`;
const task = (id: string) => {
  const t = figures.tasks[id];
  assert.ok(t, `the JSON prices ${id}`);
  return range(t);
};

/** Every file whose text is published: blog posts, guides, FAQs, PDFs, llms.txt, pages. */
function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (/\.(ts|tsx)$/.test(name)) out.push(full);
  }
  return out;
}
const COPY_FILES = [
  ...walk('shared/content'),
  'shared/resourcePdfContent.ts',
  'shared/homepageFaqs.ts',
  'shared/seoContent.ts',
  'shared/siteContent.ts',
  'shared/gbpProfile.ts',
  'shared/contentData.ts',
  'public/llms.txt',
  'public/llms-full.txt',
  ...walk('app').filter((f) => !/[\\/](admin|api|subcontractor)[\\/]/.test(f)),
  // P5*.tsx is the shared document estimator's code, not page copy.
  ...walk('components').filter((f) => !/[\\/](admin|subcontractor)[\\/]/.test(f) && !/[\\/]P5[^\\/]*$/.test(f) && !/[\\/]ProjectService[^\\/]*$/.test(f)),
].map((f) => f.split(path.sep).join('/'));

/**
 * Dollar figures that are not a price for our work, by file, as the exact text
 * they sit in. A job price never belongs here.
 */
const NOT_OUR_PRICE: Record<string, Array<{ text: string; why: string }>> = {
  'shared/content/cityServiceCopy.ts': [
    { text: 'total value is $500 or under', why: 'Garden City permit exemption threshold' },
    { text: 'work valued at $500 or less', why: 'Garden City permit exemption threshold' },
    { text: 'starting with a $34 base and adding $22.25', why: 'Caldwell FY2026 electrical permit fees' },
    { text: 'residential fence application at $25', why: 'Kuna fence permit fee' },
    { text: 'permit costs $65', why: 'Kuna permit reinstatement fee' },
    { text: 'lists it at $10', why: 'Meridian R-FEN permit fee' },
    { text: 'which costs $10 and is nonrefundable', why: 'Nampa fence permit fee' },
    { text: 'at a $34 base plus $15.75 per fixture', why: 'Caldwell FY2026 plumbing permit fees' },
  ],
  'shared/content/areaCopy.ts': [
    { text: 'listed at $10 on the city fee schedule', why: 'Meridian R-FEN permit fee' },
    { text: 'a $10 nonrefundable fee', why: 'Nampa fence permit fee' },
    { text: 'lists a $25 residential fence application fee, and a $65 reinstatement fee', why: 'Kuna permit fees' },
    { text: 'total value of $500 or less', why: 'Garden City permit exemption threshold' },
  ],
  'shared/content/wave2/tv-mounting-and-anchoring-guide.ts': [{ text: 'a $20 strap', why: 'retail part' }],
  'shared/content/wave2/diy-vs-hiring-a-handyman.ts': [
    { text: 'a $40 caulk gun kit', why: 'retail tool' },
    { text: 'are $15 and a video', why: 'retail part' },
  ],
  'shared/content/wave2/who-supplies-materials-handyman-jobs.ts': [{ text: 'a $4 part', why: 'retail part' }],
  'shared/content/wave2/caulking-guide-boise-homes.ts': [
    { text: 'The most important $8 in', why: 'retail caulk' },
    { text: 'an $8 bead', why: 'retail caulk' },
    { text: 'the tools cost $15', why: 'retail tools' },
  ],
  'shared/content/wave2/how-to-budget-home-repairs-boise.ts': [{ text: 'cost $80 or $400', why: 'retail faucet' }, { text: 'costs $80 or $400', why: 'retail faucet' }],
  'shared/content/wave2/common-toilet-problems-and-fixes.ts': [
    { text: 'a $10 flapper or a $15 fill valve', why: 'retail parts' },
    { text: 'cost under $20', why: 'retail parts' },
    { text: 'less than $25 in parts', why: 'retail parts' },
    { text: 'through a $10 part', why: 'retail part' },
  ],
  'shared/content/wave2/home-maintenance-budget-idaho.ts': [
    { text: 'roughly $400 to $800 per month', why: '1 to 2 percent of home value budgeting rule' },
    { text: 'On a $500,000 home that is $5,000 to $10,000 a year, roughly $400 to $800 a month', why: 'budgeting rule arithmetic' },
    { text: 'call it $500,000 for round numbers, that is $5,000 to $10,000 a year, or roughly $400 to $800 a month', why: 'budgeting rule arithmetic' },
  ],
  'shared/content/wave2/drywall-repair-cost-boise.ts': [{ text: 'the materials cost you $30 to $60', why: 'retail DIY materials' }],
  'shared/content/wave2/replacing-faucets-and-fixtures.ts': [
    { text: 'a $10 to $40 part', why: 'retail cartridge' },
    { text: 'that $10 to $40 part', why: 'retail cartridge' },
    { text: 'solid units run $60 to $200 at local suppliers', why: 'retail faucets' },
    { text: 'the $39 special', why: 'retail faucet' },
    { text: 'to save $12', why: 'retail supply lines' },
  ],
  'shared/content/wave2/what-small-home-repairs-cost-boise.ts': [{ text: 'a $60 faucet and a $400 faucet', why: 'retail faucets' }],
  'shared/content/wave2/small-home-upgrade-ideas-boise.ts': [{ text: 'can cost $40 or $400', why: 'retail fixtures' }],
  'shared/content/pillars/small-home-upgrades-that-pay-off.ts': [{ text: 'a $30 track kit', why: 'retail part' }],
  'shared/content/pillars/first-time-homeowner-repair-handbook.ts': [
    { text: 'a $15 part', why: 'retail part' },
    { text: 'a $15 outlet tester', why: 'retail tool' },
    { text: 'a $15 tester', why: 'retail tool' },
  ],
  'shared/content/pillars/boise-home-repair-cost-guide.ts': [
    { text: 'a $400 faucet installs for the same labor as a $90 one', why: 'retail faucets' },
    { text: 'a $90 builder-grade unit or assume you are providing the $400 one', why: 'retail faucets' },
  ],
};

/** Comments are not published; JSX `{...}` and template `${...}` are not figures. */
const stripComments = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
const AMOUNT = String.raw`\d{1,3}(?:,\d{3})+|\d+`;
const FIGURE = new RegExp(String.raw`\$(${AMOUNT})(?:\.\d+)?(?:\s+to\s+\$(${AMOUNT}))?`, 'g');
const HOURLY = /^\s*(?:an hour|per hour|\/hr|-per-hour|an hr)/;

const allowedRanges = new Set<string>([
  ...Object.values(figures.tasks).map(range),
  ...Object.values(figures.lists).map(range),
  range(figures.singleTaskSpan),
]);

function figuresIn(file: string) {
  const text = stripComments(readFileSync(file, 'utf8'));
  const found: Array<{ at: number; text: string; isRange: boolean; after: string; value: number }> = [];
  for (const m of text.matchAll(FIGURE)) {
    found.push({
      at: m.index!,
      text: m[0],
      isRange: m[2] !== undefined,
      after: text.slice(m.index! + m[0].length, m.index! + m[0].length + 12),
      value: Number(m[1].replace(/,/g, '')),
    });
  }
  return { text, found };
}

function inAllowlist(file: string, text: string, at: number): boolean {
  for (const { text: snippet } of NOT_OUR_PRICE[file] ?? []) {
    for (let j = text.indexOf(snippet); j >= 0; j = text.indexOf(snippet, j + 1)) {
      if (at >= j && at < j + snippet.length) return true;
    }
  }
  return false;
}

test('the figures file states its inputs: handyman brand, labor at $95 an hour, November 2026', () => {
  assert.equal(figures.asOf, 'November 2026');
  assert.equal(figures.inputs.brand, 'handyman');
  assert.equal(figures.inputs.project, 'handyman');
  assert.equal(figures.inputs.laborRatePerHour, 95, 'owner, 24 November 2026: the live estimator bills labor at $95 an hour');
  assert.match(figures.about, /scripts\/pricing\/p5-published-figures\.mts/);
  assert.ok(Object.keys(figures.tasks).length >= 20, 'every task the estimator offers is priced');
  for (const [id, r] of [...Object.entries(figures.tasks), ...Object.entries(figures.lists)]) {
    assert.ok(Number.isInteger(r.low) && Number.isInteger(r.high) && r.low > 0 && r.low < r.high, `${id} is a range`);
    assert.ok(Object.keys(r.inputs.tasks).length > 0, `${id} states its inputs`);
  }
  for (const [id, t] of Object.entries(figures.tasks)) assert.deepEqual(t.inputs.tasks, { [id]: 1 }, `${id} is one of the task on its own`);
});

test('every dollar range in published copy is an instant estimate range from the JSON', () => {
  const problems: string[] = [];
  for (const file of COPY_FILES) {
    if (!existsSync(file)) continue;
    const { text, found } = figuresIn(file);
    for (const f of found) {
      if (f.isRange && allowedRanges.has(f.text)) continue;
      if (!f.isRange && f.value === figures.inputs.laborRatePerHour && HOURLY.test(f.after)) continue;
      if (inAllowlist(file, text, f.at)) continue;
      problems.push(`${file}: ${f.text}${f.after.slice(0, 8)}`);
    }
  }
  assert.deepEqual(problems, [], 'a figure that is not in p5PublishedFigures.json (re-run the script, or name the job the estimator prices)');
});

test('no market hourly band, and the only hourly figure is the rate the estimator uses', () => {
  for (const file of COPY_FILES) {
    if (!existsSync(file)) continue;
    const text = stripComments(readFileSync(file, 'utf8'));
    const band = text.match(/\$60 to \$120|\$65-per-hour|\$105-per-hour|market (?:hourly )?rates?|market labor|sixty dollars an hour/i);
    assert.equal(band?.[0] ?? null, null, `${file} states a market hourly band`);
    for (const m of text.matchAll(/\$(\d+)(?:\s*(?:to|-)\s*\$?\d+)?\s*(?:an hour|per hour|\/hr)/g)) {
      assert.equal(Number(m[1]), figures.inputs.laborRatePerHour, `${file}: ${m[0]}`);
    }
  }
});

test('copy that carries an estimator figure says it is a preliminary instant estimate range', () => {
  // Group 2 keeps "preliminary $200 to $240" in this post and drops the
  // instant-estimate label from that answer.
  const preliminaryOnly = new Set(['shared/content/wave2/hourly-rate-vs-flat-rate-handyman.ts']);
  for (const file of COPY_FILES) {
    if (!existsSync(file)) continue;
    const { text, found } = figuresIn(file);
    if (!found.some((f) => f.isRange && allowedRanges.has(f.text))) continue;
    if (preliminaryOnly.has(file)) {
      assert.ok(/preliminary/i.test(text), `${file} calls the figure preliminary`);
      continue;
    }
    assert.ok(/instant estimate/i.test(text), `${file} names the instant estimate`);
    assert.ok(/preliminary/i.test(text), `${file} calls the figure preliminary`);
    assert.ok(/November 2026/.test(text), `${file} dates the figure`);
    assert.equal(text.match(/instant (?:quote|bid)|guaranteed price|final price/i)?.[0] ?? null, null, file);
  }
});

test('the cost guide table and the downloadable worksheet show the JSON figures', () => {
  const guide = readFileSync('shared/content/pillars/boise-home-repair-cost-guide.ts', 'utf8');
  const rows: Array<[string, string]> = [
    ['Small drywall patch, under 6 inches', 'patch-small'],
    ['Medium drywall patch, 1 to 2 square feet', 'patch-medium'],
    ['Adjust a sticking door', 'door-adjust'],
    ['Replace a faucet you supply', 'faucet'],
    ['Fix a running toilet', 'toilet-repair'],
    ['Replace a garbage disposal you supply', 'disposal'],
    ['Replace an outlet or switch', 'outlet'],
    ['Swap a light fixture you supply', 'light'],
    ['Install a ceiling fan on an existing fan-rated box', 'fan'],
    ['Re-caulk a tub or shower', 'caulk-tub'],
    ['Repair fence boards, one section', 'fence-boards'],
    ['Replace a fence post', 'fence-post'],
    ['Clean gutters, one-story home', 'gutters-1'],
    ['Paint a room, walls, about 12 x 12 ft', 'paint-room'],
  ];
  for (const [label, id] of rows) assert.ok(guide.includes(`<tr><td>${label}</td><td>${task(id)}</td></tr>`), `cost guide row: ${label}`);
  assert.doesNotMatch(guide, /TV mounting<\/td>/, 'the estimator does not price TV mounting, so the table does not either');

  const pdf = readFileSync('shared/resourcePdfContent.ts', 'utf8');
  const pdfRows: Array<[string, string]> = [
    ['Small drywall patch, under 6 inches', 'patch-small'],
    ['Replace a faucet you supply', 'faucet'],
    ['Fix a running toilet', 'toilet-repair'],
    ['Replace an outlet or switch', 'outlet'],
    ['Ceiling fan, existing fan-rated box', 'fan'],
    ['Adjust a sticking door', 'door-adjust'],
    ['Re-caulk a tub or shower', 'caulk-tub'],
    ['Repair fence boards, one section', 'fence-boards'],
    ['Clean gutters, one-story home', 'gutters-1'],
  ];
  for (const [label, id] of pdfRows) assert.ok(pdf.includes(`['${label}', '${task(id)}']`), `worksheet row: ${label}`);
  assert.match(pdf, /Preliminary ranges from our instant estimate \(November 2026\)/);
});

test('the pages people search for prices on carry the estimator figures', async () => {
  const { handymanPricesBoise } = await import('../shared/content/wave2/handyman-prices-boise.ts');
  const { whatSmallHomeRepairsCostBoise } = await import('../shared/content/wave2/what-small-home-repairs-cost-boise.ts');
  const { boiseHomeRepairCostGuide } = await import('../shared/content/pillars/boise-home-repair-cost-guide.ts');
  for (const page of [handymanPricesBoise, whatSmallHomeRepairsCostBoise, boiseHomeRepairCostGuide]) {
    const faqText = page.faqs.map((f: { answer: string }) => f.answer).join(' ');
    // The FAQ answers are the FAQPage structured data, so the schema carries the same figures.
    assert.ok(faqText.includes(task('outlet')), `${page.slug}: FAQ names the outlet range`);
    assert.ok(`${page.quickAnswer} ${page.content}`.includes(task('faucet')), `${page.slug}: names the faucet range`);
  }
});

test('the JSON matches the estimator when a p5-home-co checkout is given', { skip: !process.env.P5_HOME_CO_DIR }, () => {
  execFileSync(process.execPath, ['--experimental-strip-types', 'scripts/pricing/p5-published-figures.mts', '--check'], {
    stdio: 'pipe',
    env: process.env,
  });
});
