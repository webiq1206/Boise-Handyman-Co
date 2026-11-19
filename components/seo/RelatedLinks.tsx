import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import Image from '@/components/MarketingImage';
import { CITIES, SERVICE_AREA_CITIES, SERVICES, serviceHeading } from '@/shared/contentData';
import { isCityServiceNoindex } from '@/lib/page-metadata';
import { areaPath, cityServicePath, servicePath } from '@/lib/seo-routes';
import { getManifestLinks } from '@/lib/internal-links';
import { getBlogHeroImage, getBlogImageAlt } from '@/shared/blogImages';
import { getCityServiceImage, pickCardImages } from '@/shared/cityServiceImages';
import { altForImage } from '@/shared/imageAlts';
import { cityForSlug, localAlt, subjectForService } from '@/shared/localAlt';
import { SITE_IMAGES } from '@/shared/siteImages';

interface RelatedLinksProps {
  serviceSlug?: string;
  citySlug?: string;
  variant: 'service' | 'area' | 'city-service';
  /** Page path whose related pages (data/internal-links.json) join the reading list. */
  manifestPath?: string;
  /** Links the page already shows in its body. They are not repeated here. */
  exclude?: readonly string[];
  /** Photographs the page already shows. No card repeats one. */
  pageImages?: readonly (string | undefined)[];
}

/**
 * One closing block of onward links for every landing page (owner, 19 November
 * 2026: the stacked link lists read as clutter). Places and services are photo
 * cards (a swipe row on phones, balanced rows from tablet up), each with the
 * photograph of the page it opens; guides and related pages are one list with
 * thumbnails. Every photograph carries the alt of the page it opens: the work
 * and the place, then what the picture shows. A link appears once: nothing
 * already in a card or in the page body is repeated in the list. Cards keep the
 * full anchor text for search and screen readers and show only the part that
 * differs.
 *
 * Indexed city pages get the link; a noindexed combination points at the
 * service page instead, so no link is spent on a page that cannot rank.
 */
interface Cell { href: string; label: string; context?: string; image?: string; alt?: string; noImage?: boolean }

/** The photograph that belongs to the page a link opens. */
function pageImage(href: string): string | undefined {
  const [section, slug] = href.split('/').filter(Boolean);
  if ((section === 'blog' || section === 'guides') && slug) return getBlogHeroImage(slug);
  if (section === 'services' && slug) return getCityServiceImage(href);
  if (section === 'services') return SITE_IMAGES.hero;
  if (section === 'areas' && slug) return getCityServiceImage(href);
  if (section === 'resources') return '/images/handyman/estimate-clipboard.webp';
  if (section === 'estimate') return '/images/handyman/repair-materials.webp';
  return undefined;
}

function pageImageAlt(href: string, src: string): string {
  const [section, slug, city] = href.split('/').filter(Boolean);
  if ((section === 'blog' || section === 'guides') && slug) return getBlogImageAlt(slug);
  const context = section === 'services'
    ? { subject: subjectForService(slug), city: cityForSlug(city) }
    : section === 'areas' ? { city: cityForSlug(slug) } : {};
  return altForImage(src, context) ?? localAlt('Handyman repair work', context);
}

function Cells({ cells }: { cells: Cell[] }) {
  return (
    <ul
      className="lx-cells"
      style={{
        // One full row on desktop for up to six cards; otherwise rows of four. Tablets take rows of three or four.
        ['--lx-cols' as string]: cells.length <= 6 ? cells.length : 4,
        ['--lx-cols-tablet' as string]: cells.length % 4 === 0 ? 4 : 3,
      }}
    >
      {cells.map((cell) => {
        const image = cell.noImage ? undefined : cell.image ?? pageImage(cell.href);
        return (
          <li key={cell.href + cell.label}>
            <Link href={cell.href} className="lx-cell">
              {image ? (
                <span className="lx-cell-photo">
                  <Image src={image} alt={cell.alt ?? pageImageAlt(cell.href, image)} fill sizes="(max-width: 700px) 46vw, 300px" className="object-cover img-brand-grade" />
                </span>
              ) : null}
              <span className="lx-cell-label">
                <span>
                  {cell.context ? <span className="sr-only">{cell.context} </span> : null}
                  {cell.label}
                </span>
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function Group({ label, action, children }: { label: string; action?: { href: string; label: string; context?: string }; children: React.ReactNode }) {
  return (
    <div className="lx-explore-group">
      <div className="lx-explore-head">
        <h3 className="lx-explore-label">{label}</h3>
        {action ? (
          <Link href={action.href} className="lx-explore-all">
            {action.context ? <span className="sr-only">{action.context} </span> : null}
            {action.label}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        ) : null}
      </div>
      {children}
    </div>
  );
}

const MAX_READING = 6;

/**
 * The hiring guide, the services index, the worksheets, the estimator and the
 * page's related pages, each once. The guide points at its canonical slug, not
 * the legacy one, so no internal link is spent on a redirect hop.
 */
function readingLinks(manifestPath: string | undefined, taken: Set<string>, readingOnly: boolean) {
  const fixed = [
    { href: '/guides/hire-a-handyman-treasure-valley', label: 'Hiring a handyman in the Treasure Valley' },
    { href: '/services', label: 'Explore repair and installation services' },
    { href: '/resources', label: 'Free home maintenance planning worksheets' },
    { href: '/estimate', label: 'Estimate your repair cost' },
  ];
  // Beside cards of places and services, the list holds guides and articles only.
  const related = (manifestPath ? getManifestLinks(manifestPath) : [])
    .filter((link) => !readingOnly || !/^\/(services|areas)\//.test(link.url))
    .map((link) => ({ href: link.url, label: link.anchor }));
  const out: { href: string; label: string }[] = [];
  for (const link of [...fixed, ...related]) {
    if (taken.has(link.href)) continue;
    taken.add(link.href);
    out.push(link);
    if (out.length === MAX_READING) break;
  }
  return out;
}

function Reading({ links }: { links: { href: string; label: string }[] }) {
  if (links.length === 0) return null;
  return (
    <Group label="Guides and planning">
      <ul className="lx-reading">
        {links.map((link) => {
          const image = pageImage(link.href);
          return (
            <li key={link.href}>
              <Link href={link.href} className="lx-reading-link">
                {image ? (
                  <span className="lx-reading-photo">
                    <Image src={image} alt={pageImageAlt(link.href, image)} fill sizes="72px" className="object-cover img-brand-grade" />
                  </span>
                ) : null}
                <span className="lx-reading-title">{link.label}</span>
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </li>
          );
        })}
      </ul>
    </Group>
  );
}

/**
 * Give each card a photograph nothing else on the page shows. A card whose
 * trade has no free photograph left shows its city's area photograph, described
 * as the place.
 */
function withPhotos(cells: Cell[], cards: { serviceSlug: string; citySlug: string }[], shown: Set<string>): Cell[] {
  const picks = pickCardImages(cards, shown);
  return cells.map((cell, i) => {
    const pick = picks[i];
    if (!pick.src) return { ...cell, noImage: true };
    if (!pick.area) return { ...cell, image: pick.src };
    const city = cityForSlug(cards[i].citySlug);
    return { ...cell, image: pick.src, alt: altForImage(pick.src, { city }) ?? localAlt('Homes on a residential street', { city }) };
  });
}

export function RelatedLinks({ serviceSlug, citySlug, variant, manifestPath, exclude = [], pageImages = [] }: RelatedLinksProps) {
  const taken = new Set<string>(exclude);
  const shown = new Set<string>(pageImages.filter((src): src is string => Boolean(src)));
  const service = SERVICES.find((s) => s.slug === serviceSlug);
  const city = CITIES.find((c) => c.slug === citySlug);
  const groups: React.ReactNode[] = [];
  const serviceInCity = (slug: string, cityslug: string) =>
    isCityServiceNoindex(slug, cityslug) ? servicePath(slug) : cityServicePath(slug, cityslug);

  if (variant === 'area' && citySlug && city) {
    const cells = withPhotos(SERVICES.map((s) => ({
      href: serviceInCity(s.slug, citySlug),
      label: serviceHeading(s.name),
      context: `${city.name}:`,
    })), SERVICES.map((s) => ({ serviceSlug: s.slug, citySlug })), shown);
    cells.forEach((cell) => taken.add(cell.href));
    groups.push(<Group key="services" label={`More handyman help in ${city.name}`}><Cells cells={cells} /></Group>);
  }

  if (variant === 'city-service' && serviceSlug && citySlug && service && city) {
    const name = serviceHeading(service.name);
    const nearby = SERVICE_AREA_CITIES.filter((c) => c.slug !== citySlug && !isCityServiceNoindex(serviceSlug, c.slug));
    const cityCells = withPhotos(
      nearby.map((c) => ({ href: cityServicePath(serviceSlug, c.slug), label: c.name, context: `${name} in` })),
      nearby.map((c) => ({ serviceSlug, citySlug: c.slug })),
      shown,
    );
    const others = SERVICES.filter((s) => s.slug !== serviceSlug).slice(0, 4);
    const serviceCells = withPhotos(
      others.map((s) => ({ href: serviceInCity(s.slug, citySlug), label: serviceHeading(s.name), context: `${city.name}:` })),
      others.map((s) => ({ serviceSlug: s.slug, citySlug })),
      shown,
    );
    [...cityCells, ...serviceCells].forEach((cell) => taken.add(cell.href));
    taken.add(servicePath(serviceSlug));
    taken.add(areaPath(citySlug));
    if (cityCells.length > 0) {
      groups.push(
        <Group key="cities" label={`${name} in nearby cities`} action={{ href: servicePath(serviceSlug), label: 'All areas', context: `${name}:` }}>
          <Cells cells={cityCells} />
        </Group>,
      );
    }
    groups.push(
      <Group key="services" label={`More services in ${city.name}`} action={{ href: areaPath(citySlug), label: `Handyman services in ${city.name}` }}>
        <Cells cells={serviceCells} />
      </Group>,
    );
  }

  const reading = readingLinks(manifestPath, taken, groups.length > 0);
  if (groups.length === 0 && reading.length === 0) return null;

  return (
    <div className="lx-explore">
      <h2 className="ed-h2-sm ed-statement-wide">Keep exploring</h2>
      <div className="lx-explore-grid">
        {groups}
        <Reading links={reading} />
      </div>
    </div>
  );
}
