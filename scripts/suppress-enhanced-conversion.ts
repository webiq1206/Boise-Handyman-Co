/**
 * Add one hashed email or phone to the enhanced-conversion suppression list.
 * The raw value is hashed on insert and is not written to the database.
 *
 *   node --import tsx scripts/suppress-enhanced-conversion.ts --email ada@example.com
 *   node --import tsx scripts/suppress-enhanced-conversion.ts --phone 2084771169
 */
import { addEnhancedConversionSuppression } from "../server/services/enhancedConversionSuppression.ts";

function argument(name: string): string | undefined {
  const index = process.argv.indexOf(name);
  if (index < 0) return undefined;
  const value = process.argv[index + 1];
  if (!value || value.startsWith("--")) throw new Error(`${name} needs a value.`);
  return value;
}

const email = argument("--email");
const phone = argument("--phone");
if (!email && !phone) {
  console.error("Pass --email or --phone. The raw value is hashed before it is stored.");
  process.exit(1);
}

const stored = await addEnhancedConversionSuppression({ email, phone });
for (const item of stored) console.log(`${item.kind} ${item.hash}`);
