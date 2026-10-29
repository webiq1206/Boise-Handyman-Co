import Image from "next/image";
import Link from "next/link";

/**
 * Founder trust block.
 * Owner hard rule: full Perkins family; never crop people on any breakpoint.
 * Intrinsic width/height (no fill / no object-cover) so every head and body stays visible.
 */
export function WhoYouAreHiring() {
  return (
    <section
      id="who-you-are-hiring"
      className="hm-who-hiring scroll-mt-24 border-y border-border"
      aria-labelledby="who-hiring-heading"
    >
      <div className="ed-shell px-0 py-[clamp(64px,8vw,112px)]">
        <div className="grid gap-[clamp(32px,5vw,64px)] lg:grid-cols-[minmax(0,0.9fr)_1.1fr] lg:items-center">
          <figure className="m-0 w-full">
            <Image
              src="/images/about/perkins-family-meridian-idaho-1x1.webp"
              alt="Nick Perkins with his wife and five children at a pumpkin patch in Meridian, Idaho"
              width={2048}
              height={2048}
              sizes="(max-width: 1024px) 100vw, 520px"
              className="h-auto w-full"
              style={{ objectFit: "contain" }}
              priority={false}
            />
          </figure>
          <div>
            <p className="ed-eyebrow mb-4">Who you are hiring</p>
            <h2
              id="who-hiring-heading"
              className="font-serif text-[clamp(2.25rem,4.5vw,3.75rem)] font-light leading-[1.02] tracking-[-0.02em] text-foreground"
            >
              Nick Perkins,
              <br />
              <em className="not-italic" style={{ color: "var(--ed-accent, #C56B4A)" }}>
                founder
              </em>
            </h2>
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-[1.0625rem]">
              Construction project manager with a bachelor&apos;s degree in Construction with an
              emphasis in Project Management, and more than a decade of custom homes, remodels and
              developments. Husband, father of five. The family moved to the Treasure Valley in
              2025.
            </p>
            <p className="mt-5 max-w-2xl font-serif text-[clamp(1.25rem,2.2vw,1.625rem)] italic leading-snug text-foreground">
              &ldquo;Work hard. Keep your word. Treat people right.&rdquo;
            </p>
            <p className="mt-8">
              <Link
                href="/about"
                className="inline-flex min-h-12 items-center text-sm font-semibold underline underline-offset-4 hover:text-accent-legible"
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
