import Image from "next/image";
import Link from "next/link";

/**
 * Phase 12 / H-6: founder trust block.
 * Owner hard rule: full Perkins family; never crop people on any breakpoint.
 * Intrinsic width/height (no fill / no object-cover) so every head and body stays visible.
 */
export function WhoYouAreHiring() {
  return (
    <section
      id="who-you-are-hiring"
      className="scroll-mt-24 border-y border-border bg-background"
      aria-labelledby="who-hiring-heading"
    >
      <div className="container px-4 py-14 md:py-16 max-w-5xl">
        <div className="grid gap-8 md:grid-cols-[minmax(0,380px)_1fr] md:items-start">
          <figure className="m-0 w-full">
            <Image
              src="/images/about/perkins-family-meridian-idaho-1x1.webp"
              alt="Nick Perkins with his wife and five children at a pumpkin patch in Meridian, Idaho"
              width={2048}
              height={2048}
              sizes="(max-width: 768px) 100vw, 380px"
              className="h-auto w-full"
              style={{ objectFit: "contain" }}
              priority={false}
            />
          </figure>
          <div>
            <p className="ed-eyebrow mb-3">Who you are hiring</p>
            <h2 id="who-hiring-heading" className="ed-h3 mb-3">
              Nick Perkins, founder
            </h2>
            <p className="text-base text-muted-foreground leading-relaxed max-w-2xl">
              Construction project manager with a bachelor&apos;s degree in Construction with an
              emphasis in Project Management, and more than a decade of custom homes, remodels and
              developments. Husband, father of five. The family moved to the Treasure Valley in
              2025.
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
