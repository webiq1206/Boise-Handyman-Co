/**
 * Generate planning PDFs for /public/downloads/
 * Run: npx tsx scripts/generate-resource-pdfs.ts
 */
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';
import { buildResourcePdf } from '../lib/pdf/drawResourcePdf';
import {
  MAINTENANCE_CHECKLIST_BLOCKS,
  REPAIR_PERMIT_BLOCKS,
  REPAIR_PRIORITY_BLOCKS,
  PDF_FOOTERS,
} from '../shared/resourcePdfContent';

const OUT_DIR = path.join(process.cwd(), 'public', 'downloads');

/** Filenames must match the `href` values in shared/guideResources.ts. */
const FILES = [
  {
    name: 'home-maintenance-checklist.pdf',
    blocks: MAINTENANCE_CHECKLIST_BLOCKS,
    footer: PDF_FOOTERS.maintenance,
  },
  {
    name: 'home-repair-priority-worksheet.pdf',
    blocks: REPAIR_PRIORITY_BLOCKS,
    footer: PDF_FOOTERS.priority,
  },
  {
    name: 'home-repair-permit-guide.pdf',
    blocks: REPAIR_PERMIT_BLOCKS,
    footer: PDF_FOOTERS.permits,
  },
] as const;

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  for (const file of FILES) {
    const bytes = await buildResourcePdf(file.blocks, file.footer);
    const outPath = path.join(OUT_DIR, file.name);
    await writeFile(outPath, bytes);
    console.log(`Wrote ${outPath} (${bytes.length} bytes)`);
  }

  console.log('\nDone - 3 resource PDFs generated.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
