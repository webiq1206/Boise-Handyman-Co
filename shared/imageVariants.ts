/**
 * Intrinsic sizes for photos that are served as a single WebP.
 * Next/Image builds a width srcset from next.config.js deviceSizes.
 * Raw <img> tags use imageProps() so the same file is still offered with srcset.
 */
export const IMAGE_VARIANTS: Record<string, { width: number; height: number }> = {
  "/images/handyman/baseboard-trim-fit.webp": { width: 1448, height: 1086 },
  "/images/handyman/drywall-patch-coat.webp": { width: 1216, height: 896 },
  "/images/handyman/spigot-winterize.webp": { width: 1216, height: 896 },
  "/images/handyman/toilet-tank-service.webp": { width: 1216, height: 896 },
};

export function imageProps(src: string): { width: number; height: number; srcSet: string } | undefined {
  const variant = IMAGE_VARIANTS[src];
  if (!variant) return undefined;
  return { width: variant.width, height: variant.height, srcSet: `${src} ${variant.width}w` };
}
