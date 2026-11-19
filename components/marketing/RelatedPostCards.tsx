import Link from "next/link";
import Image from "@/components/MarketingImage";
import { getManifestLinks, type ManifestLink } from "@/lib/internal-links";
import { getBlogHeroImage, getBlogImageAlt } from "@/shared/blogImages";
import { getCityServiceImage } from "@/shared/cityServiceImages";
import { altForImage } from "@/shared/imageAlts";
import { cityForSlug, localAlt, subjectForService } from "@/shared/localAlt";

interface RelatedPostCardsProps {
  path: string;
  title?: string;
  limit?: number;
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
}: RelatedPostCardsProps) {
  const links = getManifestLinks(path).slice(0, limit);
  if (links.length === 0) return null;

  // Three or six cards fill their rows; any other count would leave one alone.
  const shown = links.length >= 6 ? links.slice(0, 6) : links.length >= 3 ? links.slice(0, 3) : links;
  return (
    <div>
      <h2 className="ed-h2-sm ed-statement-wide mb-8">{title}</h2>
      <div className="lx-related" data-count={shown.length}>
        {shown.map((link) => {
          const image = linkImage(link);
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
