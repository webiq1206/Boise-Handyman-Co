import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { SERVICES } from '../shared/contentData.ts';

for (const file of ['llms.txt', 'llms-full.txt']) {
  test(`${file} preserves the service inventory without unconfirmed planning prices`, () => {
    const text = readFileSync(`public/${file}`, 'utf8');
    assert.doesNotMatch(text, /Planning from|\$145|\$149|\$199|\$60 to \$120/i);
    assert.match(text, /written quote/i);
    assert.match(text, /scope/i);
    for (const service of SERVICES) {
      const line = text.split('\n').find(row => row.includes(`/services/${service.slug}`));
      assert.ok(line, service.slug);
      assert.ok(line.includes(service.name), `${service.slug}: service name`);
      assert.ok(line.includes(service.shortDescription), `${service.slug}: source description`);
    }
    assert.match(text, /\/estimate/);
    assert.doesNotMatch(text, /instant (?:handyman estimate|estimator)/i);
  });
}
