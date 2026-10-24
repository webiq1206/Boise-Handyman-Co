import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { SERVICES } from '../shared/contentData.ts';

test('llms.txt lists the published planning prices', () => {
  const llms = readFileSync('public/llms.txt', 'utf8');
  assert.equal(llms.includes('being ' + 'finalized'), false);

  const listed = [...llms.matchAll(/\$\d+/g)].map((match) => match[0]);
  const constants = SERVICES.map((service) => service.planningFrom);
  assert.deepEqual([...new Set(listed)].sort(), [...new Set(constants)].sort());

  for (const service of SERVICES) {
    const line = llms.split('\n').find((row) => row.includes(`/services/${service.slug}`));
    assert.ok(line, service.slug);
    assert.ok(
      line.includes(`Planning from ${service.planningFrom}`),
      `${service.name} should list Planning from ${service.planningFrom}`,
    );
  }
});
