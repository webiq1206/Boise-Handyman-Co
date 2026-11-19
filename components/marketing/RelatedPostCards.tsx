import Link from "next/link";
import Image from "@/components/MarketingImage";
import { getManifestLinks, type ManifestLink } from "@/lib/internal-links";
import { getBlogHeroImage, getBlogImageAlt } from "@/shared/blogImages";
import { getCityServiceImage } from "@/shared/cityServiceImages";
import { altForImage } from "@/shared/imageAlts";
import { cityForSlug, localAlt, subjectForService } from "@/shared/localAlt";
import { pageImage, READING_FALLBACK_IMAGES } from "@/shared/exploreReading";

interface RelatedPostCardsProps {
  path: string;
  title?: string;
  limit?: number;
  /** Photographs already on the page (inline figures); no card repeats them. */
  pageImages?: readonly string[];
}

const KIND_LABEL: Record<string, string> = {
  blog: "Article",
  guide: "Guide",
  service: "Service",
  city: "Service area",
};

/** The photograph that belongs to a related page, with that page's own alt. */
function linkImage(link: ManifestLink): { src: string; alt: string } | undefined {
  const [section, slug, city] = link.url.split("/").filter(Boolean);
  if ((section === "blog" || section === "guides") && slug) {
    return { src: getBlogHeroImage(slug), alt: getBlogImageAlt(slug) };
  }
  const src = getCityServiceImage(link.url);
  if (!src) return undefined;
  const context = section === "services"
    ? { subject: subjectForService(slug), city: cityForSlug(city) }
    : { city: cityForSlug(slug) };
  return { src, alt: altForImage(src, context) ?? localAlt("Handyman repair work", context) };
}

/** Related pages under an article or guide, each with its photograph. */
export function RelatedPostCards({
  path,
  title = "Related resources",
  limit = 6,
  pageImages = [],
}: RelatedPostCardsProps) {
  const all = getManifestLinks(path);
  if (all.length === 0) return null;

  // No card repeats the page's own photograph or another card's (19 November
  // 2026). Links whose photograph is free come first, in manifest order; a
  // link whose photograph is taken is used only to fill a row, with a general
  // picture (tools, paperwork, a front door) described as what it shows.
  const taken = new Set<string>();
  const own = pageImage(path);
  if (own) taken.add(own);
  for (const src of pageImages) taken.add(src.split('?')[0]);
  const withImage = all.map((link) => ({ link, image: linkImage(link) }));
  const distinct: typeof withImage = [];
  const repeats: typeof withImage = [];
  for (const entry of withImage) {
    if (entry.image && !taken.has(entry.image.src)) {
      taken.add(entry.image.src);
      distinct.push(entry);
    } else {
      repeats.push(entry);
    }
  }
  const pool = distinct.slice(0, limit);
  for (const entry of repeats) {
    if (pool.length >= limit) break;
    const src = READING_FALLBACK_IMAGES.find((candidate) => !taken.has(candidate));
    if (src) taken.add(src);
    pool.push({ link: entry.link, image: src ? { src, alt: altForImage(src) ?? localAlt("Handyman tools and paperwork") } : undefined });
  }

  // Three or six cards fill their rows; any other count would leave one alone.
  const shown = pool.length >= 6 ? pool.slice(0, 6) : pool.length >= 3 ? pool.slice(0, 3) : pool;
  return (
    <div>
      <h2 className="ed-h2-sm ed-statement-wide mb-8">{title}</h2>
      <div className="lx-related" data-count={shown.length}>
        {shown.map(({ link, image }) => {
          return (
            <Link key={link.url} href={link.url} className="lx-related-card group" aria-label={link.anchor}>
              {image && (
                <span className="lx-related-photo">
                  <Image src={image.src} alt={image.alt} fill sizes="(max-width: 700px) 112px, 400px" className="object-cover img-brand-grade" />
                </span>
              )}
              <span className="lx-related-copy">
                <span className="lx-related-kind">{KIND_LABEL[link.type] ?? "Related"}</span>
                <span className="ed-h4 group-hover:underline group-hover:underline-offset-4">{link.anchor}</span>
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
