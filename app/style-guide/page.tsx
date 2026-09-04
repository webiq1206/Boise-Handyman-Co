import { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { Section } from "@/components/marketing/Section";
import { PageHeader } from "@/components/marketing/PageHeader";
import { MarketingCard } from "@/components/marketing/MarketingCard";
import { Chip } from "@/components/marketing/Chip";
import { Hairline } from "@/components/marketing/Hairline";
import { TextLink } from "@/components/marketing/TextLink";
import { BlogEndCta } from "@/components/marketing/BlogEndCta";

export const metadata: Metadata = {
  title: "Style Guide (Internal)",
  robots: { index: false, follow: false },
};

export default function StyleGuidePage() {
  return (
    <div className="flex flex-col pb-20">
      <Section spacing="sm">
        <div className="container px-4 max-w-4xl">
          <PageHeader
            eyebrow="Internal reference"
            title="Boise Handyman Co - Design System"
            description="Tokens, typography, buttons, cards, and article styles for all marketing pages."
            align="left"
          />
        </div>
      </Section>

      <Section variant="greige" divider>
        <div className="container px-4 max-w-4xl space-y-8">
          <h2 className="text-section-title font-serif">Brand kit (placeholder)</h2>
          <p className="text-sm text-muted-foreground max-w-prose">
            PLACEHOLDER kit generated programmatically pending real brand assets. Charcoal
            #2C302F, bone #F7F5F3, and the brand accent steel blue #8FAEC4 (5.74:1 on
            charcoal, passes AA; 2.14:1 on bone, decorative only). Full kit and usage rules:{" "}
            <a href="/brand/brand-kit.html" className="underline underline-offset-4">
              /brand/brand-kit.html
            </a>
            .
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 items-center">
            <div className="rounded-sm border bg-[#F7F5F3] p-4 flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/brand/svg/seal/light/boise-handyman-co-seal-charcoal-accent.svg"
                alt="Boise Handyman Co seal, charcoal with steel accent"
                className="w-28 h-28"
              />
            </div>
            <div className="rounded-sm border bg-[#2C302F] p-4 flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/brand/svg/seal/dark/boise-handyman-co-seal-bone-accent.svg"
                alt="Boise Handyman Co seal, bone with steel accent"
                className="w-28 h-28"
              />
            </div>
            <div className="rounded-sm border bg-[#F7F5F3] p-4 flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/brand/svg/icon/boise-handyman-co-icon-accent.svg"
                alt="Boise Handyman Co icon, steel field"
                className="w-20 h-20"
              />
            </div>
            <div className="rounded-sm border h-full min-h-24 bg-[#8FAEC4] flex items-end p-2">
              <span className="text-xs text-[#2C302F]">Accent #8FAEC4</span>
            </div>
          </div>
          <div className="rounded-sm border bg-[#2C302F] p-6">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/brand/svg/wordmark/dark/boise-handyman-co-wordmark-bone-accent.svg"
              alt="Boise Handyman Co wordmark, bone with steel Co."
              className="w-full max-w-xl mx-auto"
            />
          </div>
        </div>
      </Section>

      <Section variant="greige" divider>
        <div className="container px-4 max-w-4xl space-y-8">
          <h2 className="text-section-title font-serif">Colors</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { name: "Canvas", class: "bg-background border" },
              { name: "Greige", class: "bg-surface-greige border" },
              { name: "Card", class: "bg-card border" },
              { name: "Inverse", class: "bg-inverse text-inverse-foreground" },
            ].map((swatch) => (
              <div key={swatch.name} className={`h-20 rounded-sm ${swatch.class}`}>
                <span className="p-2 text-xs block">{swatch.name}</span>
              </div>
            ))}
          </div>
        </div>
      </Section>

      <Section divider>
        <div className="container px-4 max-w-4xl space-y-6">
          <h2 className="text-section-title font-serif">Typography</h2>
          <p className="brc-label">Eyebrow label</p>
          <h1 className="text-display font-serif">
            Display with <em className="brc-accent">accent</em>
          </h1>
          <h2 className="text-3xl md:text-4xl font-serif">Section title</h2>
          <p className="text-base leading-relaxed text-foreground max-w-prose">
            Body copy uses foreground color at comfortable line height. Meta lines use muted
            foreground only.
          </p>
          <p className="text-sm text-muted-foreground">Meta / caption text</p>
        </div>
      </Section>

      <Section divider>
        <div className="container px-4 max-w-4xl space-y-6">
          <h2 className="text-section-title font-serif">Buttons & links</h2>
          <div className="flex flex-wrap gap-3">
            <Button variant="brand">Primary (brand)</Button>
            <Button variant="brandOutline">Secondary (outline)</Button>
          </div>
          <TextLink href="/blog">Text link tertiary</TextLink>
        </div>
      </Section>

      <Section divider>
        <div className="container px-4 max-w-4xl space-y-6">
          <h2 className="text-section-title font-serif">Cards & chips</h2>
          <MarketingCard>
            <p className="text-sm text-muted-foreground">Marketing card - rounded-sm, border, shadow-sm.</p>
          </MarketingCard>
          <div className="flex gap-2">
            <Chip>Category</Chip>
            <Chip active>
              Active
            </Chip>
          </div>
        </div>
      </Section>

      <Section divider>
        <div className="container px-4 max-w-4xl">
          <Hairline spaced />
          <p className="text-sm text-muted-foreground text-center">Hairline with generous spacing</p>
        </div>
      </Section>

      <Section divider>
        <div className="container px-4 max-w-4xl">
          <article className="blog-content prose-measure">
            <h2>Article H2</h2>
            <p>Long-form paragraph styling for blog and legal content.</p>
            <blockquote>
              <p>Blockquote with left border and subtle fill.</p>
            </blockquote>
          </article>
        </div>
      </Section>

      <BlogEndCta />
    </div>
  );
}
