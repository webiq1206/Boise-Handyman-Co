import { localAlt } from '@/shared/localAlt';
import Image from "@/components/MarketingImage";
import Link from "next/link";
import { MarketingCard } from "./MarketingCard";
import { TextLink } from "./TextLink";
import { Chip } from "./Chip";
import type { CityData } from "@/shared/contentData";
import { getCountyLabel } from "@/shared/contentData";
import { areaPath } from "@/lib/seo-routes";
import { altForImage } from "@/shared/imageAlts";

export interface AreaCardProps {
  city: CityData;
  imageSrc: string;
}

export function AreaCard({ city, imageSrc }: AreaCardProps) {
  const href = areaPath(city.slug);
  const countyLabel = getCountyLabel(city.county);
  const title = `${city.name}, Idaho`;
  const description = `Handyman repairs, installs, and maintenance in ${city.name} and ${countyLabel}.`;

  return (
    <MarketingCard padding="none" className="lx-row-card h-full flex flex-col overflow-hidden hover-elevate group relative">
      <Link href={href} className="absolute inset-0 z-0" aria-label={`View ${city.name} handyman services`} />
      <div className="lx-row-photo relative aspect-[4/3] overflow-hidden">
        <Image
          src={imageSrc || "/images/handyman/hero-door-hinge-branded.webp"}
          alt={imageSrc ? (altForImage(imageSrc) ?? "") : localAlt("An interior door mid-repair, with a tool bag, a drill, a level and a new hinge on a drop cloth")}
          fill
          sizes="(max-width: 700px) 112px, (max-width: 1023px) 34vw, 400px"
          className="object-cover img-brand-grade transition-transform duration-300 ease-out group-hover:scale-[1.02]"
        />
      </div>
      <div className="lx-row-body p-6 flex flex-col flex-1">
        <div className="lx-row-meta mb-3">
          <Chip>{countyLabel}</Chip>
        </div>
        <h2 className="text-lg font-serif tracking-tight text-foreground text-balance mb-2">
          {title}
        </h2>
        <p className="lx-row-hide text-sm text-muted-foreground leading-relaxed">
          {description}
        </p>
        <TextLink href={href} className="lx-row-hide mt-auto pt-4 relative z-10" showArrow>
          View {city.name} services
        </TextLink>
      </div>
    </MarketingCard>
  );
}
