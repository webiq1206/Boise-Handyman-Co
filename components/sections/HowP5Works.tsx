import { Section } from "@/components/marketing/Section";
import { HOW_P5_WORKS, HOW_P5_WORKS_TITLE } from "@/shared/siteContent";

export function HowP5Works() {
  return (
    <Section id="how-p5-works" divider className="section-y">
      <div className="ed-shell">
        <p className="ed-eyebrow mb-4">How visits work</p>
        <h2 className="ed-h2 ed-statement mb-8 max-w-[18ch]">{HOW_P5_WORKS_TITLE}</h2>
        <ul className="grid gap-x-12 gap-y-1 sm:grid-cols-2">
          {HOW_P5_WORKS.map((item, i) => (
            <li
              key={item}
              className="flex items-start gap-4 border-t border-border/70 py-5 text-[0.9375rem] leading-relaxed text-foreground/90"
            >
              <span
                aria-hidden="true"
                className="mt-0.5 shrink-0 font-serif text-lg font-light tabular-nums"
                style={{ color: "var(--ed-accent)" }}
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </Section>
  );
}
