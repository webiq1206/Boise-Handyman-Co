/**
 * Primary request control. Home and pages that render the short form scroll
 * to it. Every other page opens the short form. The longer review stays at
 * /estimate?review=1 and is not this destination.
 */
export function requestHref(pathname: string | null | undefined): string {
  if (!pathname || pathname === "/") return "/#quick-request";
  if (
    pathname === "/contact" ||
    pathname === "/services" ||
    pathname.startsWith("/services/") ||
    pathname.startsWith("/areas/")
  ) {
    return "#quick-request";
  }
  return "/estimate";
}
