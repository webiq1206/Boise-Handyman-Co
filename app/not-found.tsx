import Link from "next/link";
import { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Home, ArrowRight, MessageSquare, Phone, Wrench } from "lucide-react";
import { DisplayNum } from "@/components/marketing/DisplayNum";
import { SERVICE_AREA_CITY_NAMES } from "@/shared/contentData";
import { SITE_CONFIG } from "@/shared/siteConfig";
import { SaveContactLink } from "@/components/SaveContactLink";

export const metadata: Metadata = {
  title: "Page Not Found (404)",
  description: "The page you're looking for could not be found. Browse our handyman services or contact Boise Handyman Co.",
  robots: {
    index: false,
    follow: true,
  },
};

export default function NotFound() {
  return (
    <div className="min-h-[70vh] bg-background flex items-center justify-center p-4 section-y">
      <div className="max-w-2xl mx-auto text-center">
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-accent/10 mb-4">
            <Wrench className="h-12 w-12 text-accent-legible" />
          </div>
          <h1 className="text-6xl mb-2">
            <DisplayNum className="text-foreground">404</DisplayNum>
          </h1>
        </div>

        <h2 className="text-2xl md:text-3xl font-serif tracking-tight mb-4 text-foreground">
          Page not found
        </h2>
        <p className="text-lg text-muted-foreground mb-8">
          This page doesn&apos;t exist or may have moved. Let us help you find what you&apos;re looking for.
        </p>

        <Card className="marketing-card mb-8 text-left">
          <CardContent className="pt-6">
            <h3 className="font-normal mb-4 text-foreground">Popular pages</h3>
            <div className="grid grid-cols-2 gap-2">
              {[
                { href: "/services", label: "Our services" },
                { href: "/#consult", label: "Send your list and photos" },
                { href: "/blog", label: "Blog" },
                { href: "/instant-estimate", label: "Instant estimate" },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex min-h-[44px] items-center gap-2 p-3 rounded-sm hover:bg-muted transition-colors text-sm text-muted-foreground hover:text-foreground"
                >
                  <ArrowRight className="h-4 w-4 text-accent-legible" />
                  {item.label}
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Three equal actions; the contact link sits under the row so no button is pushed out of line. */}
        <div className="grid gap-3 sm:grid-cols-3 [&>*]:w-full">
          <Button variant="brand" size="lg" asChild>
            <Link href="/">
              <Home className="h-5 w-5 mr-2" />
              Go to the homepage
            </Link>
          </Button>
          <Button variant="brandOutline" size="lg" asChild>
            <a href={SITE_CONFIG.phoneHref}>
              <Phone className="h-5 w-5 mr-2" />
              Call {SITE_CONFIG.phone}
            </a>
          </Button>
          <Button variant="brandOutline" size="lg" asChild>
            <a href={SITE_CONFIG.phoneSmsHref} data-testid="link-404-text">
              <MessageSquare className="h-5 w-5 mr-2" />
              Text us
            </a>
          </Button>
        </div>
        <p className="mt-3">
          <SaveContactLink className="inline-flex min-h-[44px] items-center text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground transition-colors">
            Save to contacts
          </SaveContactLink>
        </p>

        <div className="mt-12">
          <p className="text-sm text-muted-foreground mb-3">
            We serve the full Treasure Valley
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {SERVICE_AREA_CITY_NAMES.map((city) => (
              <span key={city} className="text-sm text-muted-foreground">
                {city}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
