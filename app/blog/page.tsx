import { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { BlogIndexClient } from "@/components/marketing/BlogIndexClient";
import { PageHeroBand } from "@/components/sections/PageHeroBand";
import { EstimatePromptBand } from "@/components/marketing/EstimatePromptBand";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { buildPageMetadata } from "@/lib/page-metadata";
import { JsonLd } from "@/components/seo/JsonLd";
import { BLOG_POSTS } from "@/shared/blogContent";
import { getBlogHeroImage, getBlogImageAlt } from "@/shared/blogImages";
import {
  generateBreadcrumbSchema,
  generateCollectionPageSchema,
} from "@/lib/schema";

export const metadata: Metadata = buildPageMetadata({
  kind: "blog",
  path: "/blog",
});

export default function BlogPage() {
  const schemas = [
    generateBreadcrumbSchema([
      { name: "Home", url: "/" },
      { name: "Blog", url: "/blog" },
    ]),
    generateCollectionPageSchema({
      title: "Home Repair & Maintenance Insights",
      description:
        "Straight answers for Treasure Valley homeowners: what small repairs cost, what to fix before it gets expensive, how to hire well, and what each season demands.",
      url: "/blog",
      items: BLOG_POSTS.map((post) => ({
        name: post.title,
        url: `/blog/${post.slug}`,
      })),
    }),
  ];

  return (
    <>
      <JsonLd data={schemas} />

      <PageHeroBand
        imageSrc={getBlogHeroImage("what-small-home-repairs-cost-boise")}
        imageAlt={getBlogImageAlt("what-small-home-repairs-cost-boise")}
      >
        <Breadcrumbs items={[{ name: "Home", href: "/" }, { name: "Blog" }]} />
        <p className="ed-eyebrow mt-8" style={{ color: "rgb(255 255 255 / 0.72)" }}>Blog</p>
        <h1 className="ed-display ed-statement-display text-inverse-foreground">
          Home Repair &amp; Maintenance Insights
        </h1>
        <p className="ed-lede mt-8 max-w-[44ch] text-inverse-foreground/85">
          Straight answers for Treasure Valley homeowners. What small repairs actually cost,
          which fixes cannot wait, how to hire someone you can trust, and what to do each
          season before the weather does it for you.
        </p>
        <Link
          href="/guides"
          className="text-sm text-inverse-foreground/90 hover:text-inverse-foreground inline-flex items-center transition-colors"
        >
          Browse the full home repair guides
          <ArrowRight className="ml-1 h-4 w-4" />
        </Link>
      </PageHeroBand>

      <BlogIndexClient />

      <EstimatePromptBand
        eyebrow="Ready to fix it"
        title={
          <>
            From articles to an actual{' '}
            <em className="brc-accent">quote</em>
          </>
        }
        description="Read enough to know what needs doing? Send us your list with a few photos and get a flat, upfront quote - no site-visit fee, no obligation, and most jobs done in one trip."
        variant="greige"
      />
    </>
  );
}
