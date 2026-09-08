import { cn } from '@/lib/utils';

const STEPS = [
  { n: 1, title: 'Describe the work', body: 'Like-for-like swap, or moving / adding wiring, plumbing, structure?' },
  { n: 2, title: 'Check the lists below', body: 'Most repair and maintenance work needs no permit' },
  { n: 3, title: 'Confirm jurisdiction', body: 'City limits vs unincorporated Ada or Canyon County' },
  { n: 4, title: 'Call and ask', body: 'Five minutes with the building department settles borderline cases' },
  { n: 5, title: 'Permit needed?', body: 'The licensed contractor doing the work normally pulls it' },
  { n: 6, title: 'Inspections', body: 'Rough inspections before cover-up, final before close-out' },
];

function FlowStep({
  n,
  title,
  body,
  className,
}: {
  n: number;
  title: string;
  body: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'rounded-lg border border-border bg-card p-4 relative',
        className,
      )}
    >
      <span className="absolute -top-2.5 -left-2.5 flex h-7 w-7 items-center justify-center rounded-full bg-accent text-xs font-normal text-accent-foreground">
        {n}
      </span>
      <p className="font-normal text-sm text-foreground mt-1">{title}</p>
      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{body}</p>
    </div>
  );
}

function CountyColumn({
  title,
  subtitle,
  cities,
  accentClass,
}: {
  title: string;
  subtitle: string;
  cities: string[];
  accentClass: string;
}) {
  return (
    <div className={cn('rounded-xl border-2 p-5 md:p-6', accentClass)}>
      <h3 className="text-lg font-normal text-foreground">{title}</h3>
      <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
      <ul className="mt-4 space-y-1.5 text-sm text-foreground">
        {cities.map((c) => (
          <li key={c} className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-current opacity-60" />
            {c}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function PermitFlowGraphic() {
  return (
    <div className="space-y-10" data-testid="permit-flow-graphic">
      <div>
        <h2 className="text-sm font-normal uppercase tracking-wider text-muted-foreground mb-4">
          How to check, in order
        </h2>
        <div className="ed-cards-3 gap-3">
          {STEPS.map((step, i) => (
            <div key={step.n} className="relative">
              <FlowStep {...step} />
              {i < STEPS.length - 1 && (
                <div
                  className="hidden lg:block absolute top-1/2 -right-2 w-4 h-px bg-border"
                  aria-hidden
                />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-dashed border-border p-5 bg-muted/20">
        <h2 className="text-sm font-normal text-foreground mb-3">
          Usually no permit (typical handyman scope)
        </h2>
        <div className="grid sm:grid-cols-2 gap-x-8 gap-y-2 text-sm text-muted-foreground">
          <span>Paint, caulk &amp; cosmetic finishes</span>
          <span>Drywall patching &amp; texture</span>
          <span>Like-for-like fixture swaps</span>
          <span>Cabinet, trim &amp; door repair</span>
          <span>Fence &amp; gate repair</span>
          <span>Deck board &amp; rail repair</span>
          <span>Gutter cleaning &amp; repair</span>
          <span>Mounting, shelving &amp; assembly</span>
        </div>
        <h2 className="text-sm font-normal text-foreground mt-5 mb-3">
          Usually needs a permit (and often a licensed trade)
        </h2>
        <div className="grid sm:grid-cols-2 gap-x-8 gap-y-2 text-sm text-muted-foreground">
          <span>New circuits or panel work</span>
          <span>Moved or added plumbing</span>
          <span>Water heater replacement</span>
          <span>Wall removal / structural work</span>
          <span>Additions, ADUs &amp; conversions</span>
          <span>Re-roofs &amp; HVAC replacement</span>
          <span>Any gas line work</span>
          <span>Deck framing &amp; ledgers</span>
        </div>
      </div>

      <div>
        <h2 className="text-sm font-normal uppercase tracking-wider text-muted-foreground mb-4">
          Which county answers the question?
        </h2>
        <div className="grid md:grid-cols-2 gap-4">
          <CountyColumn
            title="Ada County"
            subtitle="Eastern Treasure Valley"
            cities={['Boise', 'Meridian', 'Eagle', 'Kuna', 'Star']}
            accentClass="border-accent/40 bg-accent/5"
          />
          <CountyColumn
            title="Canyon County"
            subtitle="Western Treasure Valley"
            cities={['Nampa', 'Middleton', 'Caldwell']}
            accentClass="border-border bg-muted/30"
          />
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          Inside city limits, the city building department reviews the work; outside them, the
          county does. When in doubt, start with the city and they will redirect you.
        </p>
      </div>

      <div className="overflow-x-auto">
        <h2 className="text-sm font-normal uppercase tracking-wider text-muted-foreground mb-4">
          If a permit is needed: typical timeline
        </h2>
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-2 pr-4 font-normal text-foreground">Phase</th>
              <th className="text-left py-2 pr-4 font-normal text-foreground">Small permitted project</th>
              <th className="text-left py-2 font-normal text-foreground">Notes</th>
            </tr>
          </thead>
          <tbody className="text-muted-foreground">
            <tr className="border-b border-border/60">
              <td className="py-2 pr-4">Application</td>
              <td className="py-2 pr-4">Same day to 1 week</td>
              <td className="py-2">Simple trade permits are often over the counter or online</td>
            </tr>
            <tr className="border-b border-border/60">
              <td className="py-2 pr-4">Review</td>
              <td className="py-2 pr-4">Days to a few weeks</td>
              <td className="py-2">Longer when plans or structural changes are involved</td>
            </tr>
            <tr>
              <td className="py-2 pr-4">Inspections</td>
              <td className="py-2 pr-4">During the work</td>
              <td className="py-2">Rough inspection before cover-up, final at completion</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
