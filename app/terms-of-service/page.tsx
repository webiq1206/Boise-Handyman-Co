import { InteriorDocument,InteriorPage } from '@/components/approved/InteriorLayout';
import { BusinessPhoneLink } from "@/components/BusinessPhoneContact";
import { ObfuscatedEmail } from "@/components/ObfuscatedEmail";
import { SaveContactLink } from "@/components/SaveContactLink";
import { withBrandPageMetadata } from '@/lib/brand-page-metadata';
import { buildCanonical,FEED_ALTERNATES } from "@/lib/page-metadata";
import { generateBreadcrumbSchema,generateWebPageSchema } from "@/lib/schema";
import { SITE_CONFIG } from "@/shared/siteConfig";
import { Metadata } from "next";

export const metadata: Metadata = withBrandPageMetadata(({
  title: "Terms of Service",
  description: "Terms of service for Boise Handyman Co. Your rights when using our handyman services across Boise and the Treasure Valley.",
  alternates: {
    canonical: buildCanonical("/terms-of-service"),
    types: FEED_ALTERNATES,
  },
  openGraph: {
    title: "Terms of Service | Boise Handyman Co",
    description: "Your rights when using Boise Handyman Co handyman services in Idaho's Treasure Valley.",
    url: buildCanonical("/terms-of-service"),
    type: "website",
    images: [{ url: "/images/og-default.png", width: 1200, height: 630, alt: "Boise Handyman Co" }],
  },
  twitter: {
    card: "summary",
    title: "Terms of Service | Boise Handyman Co",
    description: "Your rights when using Boise Handyman Co handyman services in Idaho's Treasure Valley.",
  },
}), "/terms-of-service");

export default function TermsOfServicePage() {
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: "Home", url: "/" },
    { name: "Terms of Service", url: "/terms-of-service" },
  ]);
  const webPageSchema = generateWebPageSchema({
    title: "Terms of Service",
    description: "Terms of service for Boise Handyman Co. Your rights and responsibilities when using our services.",
    url: "/terms-of-service",
  });

  return (
    <InteriorPage kind="legal"><div className="flex flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageSchema) }}
      />
      <section className="py-16 md:py-24">
        <div className="container px-4">
          <InteriorDocument heading={<h1>Terms of service for Boise Handyman Co</h1>} contents={[{"id":"document-section-1","label":"Agreement to terms"},{"id":"document-section-2","label":"Services"},{"id":"document-section-3","label":"Quotes, pricing and changes"},{"id":"document-section-4","label":"Payment terms"},{"id":"document-section-5","label":"Scheduling and cancellation"},{"id":"document-section-6","label":"Property access"},{"id":"document-section-7","label":"Subcontractors"},{"id":"document-section-8","label":"Limitation of liability"},{"id":"document-section-9","label":"Workmanship warranty"},{"id":"document-section-10","label":"Changes to terms"},{"id":"document-section-11","label":"Contact information"}]}>

            <p className="lead text-muted-foreground">
              Last updated November 8, 2026
            </p>

            <h2 id="document-section-1">Agreement to terms</h2>
            <p>
              Boise Handyman Co is a DBA of P5 Home Co LLC ("Company," "we," "us," or "our"). By accessing or using our services, you agree to these Terms of Service. If you do not agree to these terms, please do not use our services.
            </p>
            <p>
              Your signed agreement, quote or work order for a job controls that job. These terms are a general summary of how we work and do not change any agreement you have already signed. If these terms and your signed agreement differ, your signed agreement governs.
            </p>

            <h2 id="document-section-2">Services</h2>
            <p>
              Boise Handyman Co provides residential handyman services, including small repairs, installations, and home maintenance such as drywall repair, painting touch-ups, minor plumbing and electrical repairs, carpentry and trim repair, mounting and assembly, fence, deck, and gutter repair, and caulking and weatherproofing, to customers in the Treasure Valley area of Idaho. Work requiring a licensed specialty contractor or major permits is outside the scope of our services and may be referred to third-party contractors.
            </p>

            <h2 id="document-section-3">Quotes, pricing and changes</h2>
            <ul>
              <li>The first conversation and the review of your project are free</li>
              <li>Each job is priced case by case after we review the scope. The scope and price are set in writing before work starts</li>
              <li>A one-hour minimum applies per visit. Materials are listed separately on the quote</li>
              <li>Any paid planning or other separately priced work happens only after you approve its scope and price in writing</li>
              <li>Changes to scope, price or schedule are agreed with you in writing before the affected work is done or materials are ordered</li>
              <li>Special-order or custom items may not be cancellable once ordered; we tell you this before you approve them</li>
            </ul>

            <h2 id="document-section-4">Payment terms</h2>
            <ul>
              <li>Payment follows the schedule in your agreement</li>
              <li>We do not ask for payment in advance. We invoice after the work is complete, and payment is due as stated on your invoice or agreement</li>
              <li>We accept major credit cards, checks, and electronic payments</li>
            </ul>

            <h2 id="document-section-5">Scheduling and cancellation</h2>
            <ul>
              <li>Service schedules are weather-dependent and may be adjusted as needed</li>
              <li>We will make reasonable efforts to notify you of schedule changes</li>
              <li>Cancellation of scheduled services requires 24-hour advance notice</li>
              <li>Repeated cancellations may result in service termination</li>
            </ul>

            <h2 id="document-section-6">Property access</h2>
            <p>
              By engaging our services, you grant us permission to access your property as necessary to perform the agreed-upon work. Please ensure gates are unlocked and pets are secured on service days.
            </p>

            <h2 id="document-section-7">Subcontractors</h2>
            <p>
              Some work, for example licensed plumbing, electrical or HVAC work, may be performed by subcontractors. Work performed by a subcontractor is covered by that subcontractor&apos;s own warranty. At the end of every project we provide a complete list of the subcontractors who worked on it, with their contact information.
            </p>

            <h2 id="document-section-8">Limitation of liability</h2>
            <p>
              While we take great care in providing our services, Boise Handyman Co's liability for any claims arising from our services is limited to the amount paid for the specific service in question. We are not liable for pre-existing conditions, normal wear, or conditions outside our control.
            </p>

            <h2 id="document-section-9">Workmanship warranty</h2>
            <p>
              Work performed by our own team carries one year of workmanship coverage from documented Final Completion: the agreed work is complete and recorded as finished. Work performed by subcontractors is covered by that subcontractor&apos;s own warranty, and manufacturer and product warranties are separate and follow their own terms. Full details are on our <a href="/warranty" className="text-primary hover:underline">warranty page</a>. Your signed agreement sets the notice method for a formal warranty claim.
            </p>

            <h2 id="document-section-10">Changes to terms</h2>
            <p>
              We may update these terms from time to time. Changes take effect when posted to our website and do not change any agreement you have already signed.
            </p>

            <h2 id="document-section-11">Contact information</h2>
            <p>
              For questions about these Terms of Service, please contact us:
            </p>
            <ul>
              <li>Email: <ObfuscatedEmail user="hello" domain="boisehandyman.co" className="text-primary hover:underline inline-flex items-center gap-1" showIcon={false} /></li>
              <li>
                Phone: <BusinessPhoneLink className="text-primary hover:underline" />{" "}
                <span className="text-muted-foreground">·</span>{" "}
                <SaveContactLink className="text-primary hover:underline">Save to contacts</SaveContactLink>
              </li>
              <li>
                Text: <a href={SITE_CONFIG.phoneSmsHref} className="text-primary hover:underline">{SITE_CONFIG.phone}</a>{" "}
                <span className="text-muted-foreground">·</span>{" "}
                <SaveContactLink className="text-primary hover:underline">Save to contacts</SaveContactLink>
              </li>
              <li>Service area: {SITE_CONFIG.address.cityState} · {SITE_CONFIG.address.serviceArea}</li>
            </ul>
          </InteriorDocument>
        </div>
      </section>
    </div></InteriorPage>
  );
}
