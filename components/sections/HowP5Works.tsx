import { Section } from "@/components/marketing/Section";
import { HOW_P5_WORKS, HOW_P5_WORKS_TITLE } from "@/shared/siteContent";

export function HowP5Works() {
  return (
    <Section id="how-p5-works" divider>
      <div className="ed-shell">
        <h2 className="ed-h3 mb-6">{HOW_P5_WORKS_TITLE}</h2>
        <ul className="grid gap-3 sm:grid-cols-2">
          {HOW_P5_WORKS.map((item) => (
            <li key={item} className="text-sm text-muted-foreground">
              {item}
            </li>
          ))}
        </ul>
      </div>
    </Section>
  );
}
