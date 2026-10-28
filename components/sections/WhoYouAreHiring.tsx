import Image from "next/image";
import Link from "next/link";

/**
 * Phase 12 / H-6: founder trust block. Portrait crop until a job-site portrait
 * replaces it. Sits above the homepage final form on this site.
 */
export function WhoYouAreHiring() {
  return (
    <section
      id="who-you-are-hiring"
      className="border-y border-border bg-background"
      aria-labelledby="who-hiring-heading"
    >
      <div className="container px-4 py-14 md:py-16 max-w-5xl">
        <div className="grid gap-8 md:grid-cols-[180px_1fr] md:items-center">
          <div className="relative mx-auto h-[160px] w-[160px] overflow-hidden rounded-full md:mx-0 md:h-[180px] md:w-[180px]">
            <Image
              src="/images/about/nick-perkins-portrait-crop.webp"
              alt="Nick Perkins, founder of Boise Handyman Co"
              fill
              sizes="180px"
              className="object-cover"
            />
          </div>
          <div>
            <p className="ed-eyebrow mb-3">Who you are hiring</p>
            <h2 id="who-hiring-heading" className="ed-h3 mb-3">
              Nick Perkins, founder
            </h2>
            <p className="text-base text-muted-foreground leading-relaxed max-w-2xl">
              Construction project manager, bachelor&apos;s in Construction, more than a decade of
              custom homes, remodels and developments. Husband, father of five, Meridian.
            </p>
            <p className="mt-3 text-base text-foreground leading-relaxed italic max-w-2xl">
              &ldquo;Work hard. Keep your word. Treat people right.&rdquo;
            </p>
            <p className="mt-4">
              <Link
                href="/about"
                className="text-sm font-medium underline underline-offset-4 hover:text-accent-legible"
              >
                Read Nick&apos;s story
              </Link>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
