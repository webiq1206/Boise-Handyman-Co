import { Section } from "@/components/marketing/Section";
import { HOW_P5_WORKS, HOW_P5_WORKS_TITLE } from "@/shared/siteContent";

export function HowP5Works() {
  return (
    <Section id="how-p5-works" divider>
      <div className="ed-shell">
        <h2 className="ed-h3 mb-6">{HOW_P5_WORKS_TITLE}</h2>
        <ul className="grid gap-x-10 sm:grid-cols-2">
          {HOW_P5_WORKS.map((item) => (
            <li key={item} className="flex items-start gap-3 border-t border-border/70 py-3 text-sm leading-relaxed text-foreground/85">
              <span aria-hidden="true" className="mt-[2px] shrink-0 font-semibold" style={{ color: "var(--ed-accent)" }}>
                &#10003;
              </span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </Section>
  );
}
