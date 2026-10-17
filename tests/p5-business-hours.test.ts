import assert from "node:assert/strict";
import test from "node:test";
import { generateLocalBusinessSchema } from "../lib/schema.ts";

test("LocalBusiness opening hours are weekday 09:00-18:00 and Saturday 09:00-16:00 America/Boise", () => {
  const specs = generateLocalBusinessSchema().openingHoursSpecification as Array<{
    "@type": string;
    dayOfWeek: string;
    opens?: string;
    closes?: string;
  }>;
  assert.deepEqual(specs, [
    { "@type": "OpeningHoursSpecification", dayOfWeek: "Monday", opens: "09:00", closes: "18:00" },
    { "@type": "OpeningHoursSpecification", dayOfWeek: "Tuesday", opens: "09:00", closes: "18:00" },
    { "@type": "OpeningHoursSpecification", dayOfWeek: "Wednesday", opens: "09:00", closes: "18:00" },
    { "@type": "OpeningHoursSpecification", dayOfWeek: "Thursday", opens: "09:00", closes: "18:00" },
    { "@type": "OpeningHoursSpecification", dayOfWeek: "Friday", opens: "09:00", closes: "18:00" },
    { "@type": "OpeningHoursSpecification", dayOfWeek: "Saturday", opens: "09:00", closes: "16:00" },
  ]);
});
