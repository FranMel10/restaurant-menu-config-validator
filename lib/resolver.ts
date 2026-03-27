import type { Product, KitchenProfile, Printer, RouteNode, RoutingResult } from "@/types";

/**
 * Resolves the full routing chain for a product:
 * Product → Tag → KitchenProfile → Printer
 *
 * A product may have multiple tags, each potentially resolving to
 * a different kitchen station. Duplicate stations are deduplicated.
 */
export function resolveRouting(
  product: Product,
  kitchenProfiles: KitchenProfile[],
  printers: Printer[]
): RoutingResult {
  if (!product.tags || product.tags.length === 0) {
    return {
      ok: false,
      reason: "no_tags",
      message: `"${product.name}" has no tags assigned. It cannot be routed to any kitchen station or printer.`,
    };
  }

  const routes: RouteNode[] = [];
  const seenProfileIds = new Set<string>();

  for (const tag of product.tags) {
    const profile = kitchenProfiles.find((kp) => kp.tag_ids.includes(tag)) ?? null;

    if (!profile) {
      routes.push({ tag, profile: null, printer: null, error: "no_profile" });
      continue;
    }

    // Deduplicate by station — multiple tags may map to the same station
    if (seenProfileIds.has(profile.id)) continue;
    seenProfileIds.add(profile.id);

    const printer = profile.printer_id
      ? (printers.find((p) => p.id === profile.printer_id) ?? null)
      : null;

    routes.push({
      tag,
      profile,
      printer,
      error: printer ? null : "no_printer",
    });
  }

  if (routes.length === 0) {
    return {
      ok: false,
      reason: "no_routes_resolved",
      message: `"${product.name}" has tags but none could be matched to a kitchen profile.`,
    };
  }

  return { ok: true, routes };
}

/**
 * Generates a human-readable explanation for a resolved route node.
 */
export function explainRoute(productName: string, route: RouteNode): string {
  if (route.error === "no_profile") {
    return `Tag "${route.tag}" is not mapped to any kitchen station. Add it to a Kitchen Station Profile to enable routing.`;
  }
  if (route.error === "no_printer") {
    return `Tag "${route.tag}" is mapped to ${route.profile!.name}, but that station has no printer configured.`;
  }
  return `This item prints at ${route.printer!.name} because the tag "${route.tag}" is mapped to ${route.profile!.name}, which is connected to the ${route.printer!.name} printer.`;
}