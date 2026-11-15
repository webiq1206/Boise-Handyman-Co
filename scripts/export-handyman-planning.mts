/** Offline fixture export: only the explicit public projection is serialized. */
import {writeFileSync} from 'node:fs';
import path from 'node:path';
import {getHandymanPlanningData} from '../shared/handymanPlanning.server.ts';
const destination = process.argv[2];
if (!destination || !path.isAbsolute(destination)) throw new Error('Provide an absolute fixture destination.');
writeFileSync(destination, JSON.stringify(getHandymanPlanningData(), null, 2) + '\n');
