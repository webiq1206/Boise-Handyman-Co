import type { PdfBlock } from '@/lib/pdf/drawResourcePdf';
import { SITE_CONFIG } from './siteConfig';

const FOOTER = `${SITE_CONFIG.name} | ${SITE_CONFIG.siteUrl} | Planning resource - not a contract or quote`;

/**
 * Cost figures here must match the cost guide (shared/content/pillars/
 * boise-home-repair-cost-guide.ts). A printed PDF outlives the page it came
 * from, so a stale number in here is the one a client will bring to a job a
 * year from now.
 * [NEEDS: real pricing confirmation for the starting-price references below]
 */
export const MAINTENANCE_CHECKLIST_BLOCKS: PdfBlock[] = [
  {
    type: 'title',
    text: 'Treasure Valley Home Maintenance Checklist',
  },
  {
    type: 'subtitle',
    text: 'Use with our Boise Home Maintenance Guide. Work the season you are in - fall and spring carry the most.',
  },
  { type: 'heading', text: 'Fall (finish before the first hard freeze, typically mid-October)' },
  {
    type: 'checkboxes',
    items: [
      'Clean gutters after leaf drop; confirm downspouts discharge away from the house',
      'Disconnect garden hoses; insulate exterior hose bibs',
      'Schedule sprinkler system blowout',
      'Replace furnace filter; book heating service if due',
      'Caulk exterior gaps; renew door weatherstripping and sweeps',
      'Eyeball roof and flashing from the ground for lifted shingles',
      'Test smoke and CO detectors; replace batteries',
    ],
  },
  { type: 'heading', text: 'Winter (watch, and fix small things indoors)' },
  {
    type: 'checkboxes',
    items: [
      'Watch eaves for icicles and ice dams (a sign of attic heat loss)',
      'Check window sills for condensation pooling',
      'Note drafts at doors and outlets on cold nights for the caulk list',
      'Swap furnace filter mid-season',
      'Keep snow shoveled away from the foundation on the sunny side',
      'Good season for interior patching, painting, and tub re-caulking',
    ],
  },
  { type: 'heading', text: 'Spring (audit what winter did)' },
  {
    type: 'checkboxes',
    items: [
      'Walk all four exterior sides: paint, caulk, siding, trim',
      'Check fence posts and gates after the windy months',
      'Screwdriver-test deck boards, rails, and stairs for soft wood',
      'Start sprinklers zone by zone; re-aim heads hitting the house or fence',
      'Reconnect hoses; watch each bib for leaks from winter freezing',
      'Check ceilings and window surrounds indoors for new stains',
    ],
  },
  { type: 'heading', text: 'Summer (projects and sun protection)' },
  {
    type: 'checkboxes',
    items: [
      'Touch up exterior paint on south- and west-facing trim',
      'Re-stain or seal the deck in the dry window',
      'Replace warped fence boards; re-screw popped pickets',
      'Keep AC condenser clear of cottonwood fluff and debris',
      'Confirm sprinklers water plants, not siding',
    ],
  },
  { type: 'heading', text: 'Every month: the five-minute water check' },
  {
    type: 'checkboxes',
    items: [
      'Touch the back corners under every sink',
      'Glance at ceilings below bathrooms',
      'Look at the floor around the water heater and toilets',
      'After hard rain, see where the gutters actually put the water',
    ],
  },
  { type: 'heading', text: 'Next steps' },
  {
    type: 'bullets',
    items: [
      'Anything involving water gets attention within the week',
      `Maintenance guide: ${SITE_CONFIG.siteUrl}/guides/boise-home-maintenance-guide`,
      `Book a seasonal visit: ${SITE_CONFIG.siteUrl}/contact`,
      `Phone: ${SITE_CONFIG.phone}`,
    ],
  },
];

export const REPAIR_PRIORITY_BLOCKS: PdfBlock[] = [
  {
    type: 'title',
    text: 'Home Repair Priority Worksheet',
  },
  {
    type: 'subtitle',
    text: 'Walk the house, list what you find, and triage it. Most repairs are Tuesday problems, not emergencies.',
  },
  { type: 'heading', text: 'Step 1: Triage what you found' },
  {
    type: 'table',
    headers: ['Priority', 'Rule', 'Examples'],
    rows: [
      ['Now', 'Safety or active water', 'Water you cannot stop, gas smell, sparking, no heat in freezing weather'],
      ['This week', 'Anything involving water', 'Stains, running toilets, failed caulk, musty cabinets, drips'],
      ['This month', 'Getting worse with use', 'Leaning fence post, dragging gate, loose rail, peeling exterior paint'],
      ['This season', 'Wear and comfort', 'Sticking doors, worn hardware, settling cracks, drafts'],
      ['Someday', 'Cosmetic only', 'Paint refresh, hardware updates, shelving and mounting wishes'],
    ],
  },
  { type: 'heading', text: 'Step 2: List the jobs' },
  {
    type: 'table',
    headers: ['Repair', 'Priority', 'DIY or pro', 'Est. $'],
    rows: [
      ['_______________________________', '_______', '_______', '_______'],
      ['_______________________________', '_______', '_______', '_______'],
      ['_______________________________', '_______', '_______', '_______'],
      ['_______________________________', '_______', '_______', '_______'],
      ['_______________________________', '_______', '_______', '_______'],
      ['_______________________________', '_______', '_______', '_______'],
      ['_______________________________', '_______', '_______', '_______'],
      ['_______________________________', '_______', '_______', '_______'],
    ],
  },
  { type: 'heading', text: 'Typical Treasure Valley ranges (2026)' },
  {
    type: 'table',
    headers: ['Repair', 'Typical range'],
    rows: [
      ['Drywall patch', '$100 - $300'],
      ['Faucet replacement', '$150 - $350'],
      ['Toilet fill valve / flapper', '$100 - $200'],
      ['Outlet or switch replacement', '$75 - $150'],
      ['Ceiling fan install (existing fixture)', '$150 - $350'],
      ['Door adjustment or hardware', '$75 - $200'],
      ['Tub / shower re-caulk', '$100 - $250'],
      ['Fence section repair', '$150 - $450'],
      ['Gutter cleaning (single story)', '$100 - $250'],
    ],
  },
  { type: 'heading', text: 'Step 3: DIY or pro?' },
  {
    type: 'checkboxes',
    items: [
      'DIY-friendly: filters, flappers, caulk, hinges, nail holes, plunger work',
      'Call a pro: wiring beyond a fixture swap, plumbing behind walls, gas, roofs',
      'Call a pro: finish work that must disappear (texture, stain, sheen matching)',
      'Batch it: 3+ small jobs in one visit costs far less per task than separate calls',
    ],
  },
  { type: 'heading', text: 'Next steps' },
  {
    type: 'bullets',
    items: [
      'Photograph each item on your list - photos are enough for a flat quote',
      `Cost guide: ${SITE_CONFIG.siteUrl}/guides/boise-home-repair-cost-guide`,
      `Send your list: ${SITE_CONFIG.siteUrl}/contact`,
      `Phone: ${SITE_CONFIG.phone}`,
    ],
  },
];

export const REPAIR_PERMIT_BLOCKS: PdfBlock[] = [
  {
    type: 'title',
    text: 'When Does a Home Repair Need a Permit? Ada & Canyon County',
  },
  {
    type: 'subtitle',
    text: 'Quick reference for Treasure Valley homeowners. When in doubt, one phone call to the building department settles it.',
  },
  { type: 'heading', text: 'Usually NO permit (typical handyman scope)' },
  {
    type: 'bullets',
    items: [
      'Painting, caulking, and cosmetic finishes',
      'Drywall patching and texture repair',
      'Like-for-like fixture swaps: faucets, toilets, light fixtures, outlets',
      'Cabinet, trim, door, and hardware repair or replacement',
      'Fence repair and like-for-like section replacement (height rules apply to new fences)',
      'Deck board and rail repair (not structural framing)',
      'Gutter cleaning and repair; TV mounting, shelving, assembly',
    ],
  },
  { type: 'heading', text: 'Usually YES, permit required (licensed-trade territory)' },
  {
    type: 'bullets',
    items: [
      'New electrical circuits, panel work, or service changes',
      'Moving or adding plumbing (not like-for-like swaps)',
      'Water heater replacement (permit required in most jurisdictions)',
      'Structural changes: removing walls, headers, deck framing and ledgers',
      'Additions, ADUs, and garage conversions',
      'Re-roofs and most HVAC equipment replacement',
      'Gas line work of any kind',
    ],
  },
  { type: 'heading', text: 'Who to call' },
  {
    type: 'table',
    headers: ['If your home is in', 'County', 'Ask'],
    rows: [
      ['Boise, Meridian, Eagle', 'Ada', 'Your city building dept, or Ada County if unincorporated'],
      ['Kuna, Star', 'Ada', 'Your city building dept, or Ada County if unincorporated'],
      ['Nampa, Caldwell, Middleton', 'Canyon', 'Your city building dept, or Canyon County if unincorporated'],
    ],
  },
  { type: 'heading', text: 'Homeowner checklist' },
  {
    type: 'checkboxes',
    items: [
      'Confirm the jurisdiction (city vs unincorporated county) before asking',
      'Describe the actual work: "like-for-like swap" vs "moving/adding" changes the answer',
      'HOA approval, where it applies, is separate from any permit',
      'Permits protect resale: unpermitted work surfaces at inspection time',
      'A pro who shrugs at permits for permit-level work is a red flag',
    ],
  },
  { type: 'heading', text: 'Learn more' },
  {
    type: 'bullets',
    items: [
      `Visual guide: ${SITE_CONFIG.siteUrl}/resources/ada-canyon-permit-flow`,
      `Article: ${SITE_CONFIG.siteUrl}/blog/ada-vs-canyon-county-permit-timelines`,
      `Hiring guide: ${SITE_CONFIG.siteUrl}/guides/hire-a-handyman-treasure-valley`,
    ],
  },
];

export const PDF_FOOTERS = {
  maintenance: FOOTER,
  priority: FOOTER,
  permits: FOOTER,
} as const;
