import { Reveal } from "@/components/Reveal";
import { Section } from "@/components/marketing/Section";
import { SectionHeader } from "@/components/marketing/SectionHeader";
import { MarketingCard } from "@/components/marketing/MarketingCard";
import { BeforeAfterSlider } from "@/components/BeforeAfterSlider";
import type { GalleryProject } from "@/shared/galleryData";
import { SERVICES, serviceHeading } from "@/shared/contentData";
import { altForImage } from "@/shared/imageAlts";
import { cityForSlug, localAlt, subjectForService } from "@/shared/localAlt";

interface FeaturedBeforeAfterSectionProps {
  project: GalleryProject;
  title?: React.ReactNode;
}

/**
 * Featured comparison slider for service hub pages. The heading is the plain
 * service name (owner, 19 November 2026: no qualifier label beside a
 * photograph), and it makes no claim about a customer job.
 */
export function FeaturedBeforeAfterSection({
  project,
  title,
}: FeaturedBeforeAfterSectionProps) {
  const service = SERVICES.find((item) => item.slug === project.serviceType);
  const subject = { subject: subjectForService(project.serviceType), city: cityForSlug(project.city) };
  const heading = title ?? (service ? serviceHeading(service.name) : project.title);
  return (
    <Section divider>
      <div className="container px-4 max-w-5xl">
        <SectionHeader
          eyebrow="Repair details"
          title={heading}
          className="mb-8 max-w-3xl"
        />
        <Reveal>
          <MarketingCard padding="none" className="overflow-hidden">
            <BeforeAfterSlider
              beforeSrc={project.beforeImageUrl}
              afterSrc={project.afterImageUrl}
              beforeAlt={altForImage(project.beforeImageUrl, subject) ?? localAlt(project.title, subject)}
              afterAlt={altForImage(project.afterImageUrl, subject) ?? localAlt(project.title, subject)}
              aspectClass="aspect-[16/10] md:aspect-[21/9]"
            />
            <div className="p-6 md:p-8">
              <h3 className="font-serif font-normal text-lg text-foreground mb-2">
                {project.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {project.description}
              </p>
            </div>
          </MarketingCard>
        </Reveal>
      </div>
    </Section>
  );
}
