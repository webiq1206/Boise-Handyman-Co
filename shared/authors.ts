/**
 * Content author for articles and guides (owner, 20 November 2026; SEO audit
 * REM-T7 and its equivalent here): Nick Perkins, founder of P5 Home Co, as on
 * the P5 /about page. The Article schema emits him as a Person (the same @id
 * the P5 graph uses) and keeps the Organization as publisher. The visible
 * byline reads "By Nick Perkins, founder of P5 Home Co" and links his page.
 */
export const CONTENT_AUTHOR = {
  name: 'Nick Perkins',
  role: 'founder of P5 Home Co',
  url: 'https://p5homeco.com/about',
} as const;

/** The visible byline. */
export const CONTENT_BYLINE = `By ${CONTENT_AUTHOR.name}, ${CONTENT_AUTHOR.role}`;
