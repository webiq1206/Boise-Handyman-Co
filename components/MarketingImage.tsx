import NextImage, { type ImageProps } from "next/image";

// These reviewed WebPs are already sized and compressed for their placements.
// Serve them directly: cold desktop optimizer requests stalled in production
// browser checks. All other images keep Next's responsive optimization.
const DIRECT_IMAGES = new Set([
  "/images/handyman/service-painting-p5-reviewed-20260910.webp",
  "/images/handyman/front-door-repaint-p5-reviewed-20260910.webp",
]);

export default function MarketingImage(props: ImageProps) {
  const direct = typeof props.src === "string" && DIRECT_IMAGES.has(props.src);
  return <NextImage {...props} unoptimized={props.unoptimized || direct} />;
}
