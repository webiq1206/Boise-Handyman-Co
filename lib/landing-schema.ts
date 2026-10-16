import {
  generateBreadcrumbSchema,
  generateFAQSchema,
  generateLocalBusinessSchema,
  generateServiceSchema,
  generateSpeakableSchema,
  publicPostalAddress,
} from './schema';

export function landingBreadcrumbs(
  items: Array<{ name: string; url: string }>,
) {
  return generateBreadcrumbSchema(items);
}

export function landingFAQSchema(faqs: Array<{ question: string; answer: string }>) {
  return generateFAQSchema(
    faqs.map((f) => ({ question: f.question, answer: f.answer })),
  );
}

export function landingServiceSchema(
  name: string,
  description: string,
  city?: string,
) {
  return generateServiceSchema(name, description, city);
}

export function landingAreaBusinessSchema(cityName: string) {
  const business = generateLocalBusinessSchema(cityName);
  const served = Array.isArray(business.areaServed) ? business.areaServed : [];
  const listed = served.some(
    (area) =>
      !!area &&
      typeof area === 'object' &&
      'name' in area &&
      (area as { name?: string }).name === cityName,
  );
  // Area pages name the city with areaServed. They do not add a PostalAddress
  // for that city, and the business address stays the Meridian locality.
  return {
    ...business,
    address: publicPostalAddress(),
    areaServed: listed
      ? served
      : [
          ...served,
          {
            '@type': 'City',
            name: cityName,
            addressRegion: 'ID',
            addressCountry: 'US',
          },
        ],
  };
}

export function landingSpeakable(path: string, name: string) {
  return generateSpeakableSchema({ url: path, name });
}
