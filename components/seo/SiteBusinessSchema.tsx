import { JsonLd } from './JsonLd';
import { generateLocalBusinessSchema } from '@/lib/schema';

/** HomeAndConstructionBusiness on every page. Address stays the Meridian locality. */
export function SiteBusinessSchema() {
  return <JsonLd data={generateLocalBusinessSchema()} />;
}
