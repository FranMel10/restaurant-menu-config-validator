import type { Product, KitchenProfile, Printer, ValidationWarning } from "@/types";
export type { ValidationWarning };

/**
 * Products that have no tags assigned.
 * These products cannot be routed to any station or printer.
 */
export function productWithoutTags(products: Product[]): ValidationWarning | null {
  const affected = products.filter((p) => !p.tags || p.tags.length === 0).map((p) => p.name);
  if (affected.length === 0) return null;
  return {
    type: "productWithoutTags",
    message: `${affected.length} product(s) have no tags and won't route to any printer.`,
    affected,
  };
}

/**
 * Tags used in products that have no matching Kitchen Station Profile.
 * These tags are orphaned — they exist on products but lead nowhere.
 */
export function tagWithoutProfile(
  products: Product[],
  kitchenProfiles: KitchenProfile[]
): ValidationWarning | null {
  const allUsedTags = [...new Set(products.flatMap((p) => p.tags ?? []))];
  const affected = allUsedTags.filter(
    (tag) => !kitchenProfiles.some((kp) => kp.tag_ids.includes(tag))
  );
  if (affected.length === 0) return null;
  return {
    type: "tagWithoutProfile",
    message: `Tag(s) used in products but not mapped to any kitchen station: ${affected.join(", ")}.`,
    affected,
  };
}

/**
 * Kitchen Station Profiles that have no linked printer.
 * Products routing to these stations will print nowhere.
 */
export function profileWithoutPrinter(
  kitchenProfiles: KitchenProfile[],
  printers: Printer[]
): ValidationWarning | null {
  const affected = kitchenProfiles
    .filter((kp) => !kp.printer_id || !printers.find((pr) => pr.id === kp.printer_id))
    .map((kp) => kp.name);
  if (affected.length === 0) return null;
  return {
    type: "profileWithoutPrinter",
    message: `${affected.length} kitchen station(s) have no linked printer: ${affected.join(", ")}.`,
    affected,
  };
}

/**
 * Tags that are mapped to more than one Kitchen Station Profile.
 * This creates ambiguity — the system may behave unexpectedly.
 */
export function multipleProfilesForTag(
  kitchenProfiles: KitchenProfile[]
): ValidationWarning | null {
  const tagMap: Record<string, string[]> = {};
  for (const kp of kitchenProfiles) {
    for (const tagId of kp.tag_ids) {
      if (!tagMap[tagId]) tagMap[tagId] = [];
      tagMap[tagId].push(kp.name);
    }
  }
  const affected = Object.entries(tagMap)
    .filter(([, profiles]) => profiles.length > 1)
    .map(([tag, profiles]) => `"${tag}" → [${profiles.join(", ")}]`);
  if (affected.length === 0) return null;
  return {
    type: "multipleProfilesForTag",
    message: `Some tags are mapped to multiple kitchen stations, creating routing ambiguity: ${affected.join(" | ")}.`,
    affected,
  };
}

/**
 * Runs all validators and returns a list of warnings (non-null only).
 */
export function validateAll(
  products: Product[],
  kitchenProfiles: KitchenProfile[],
  printers: Printer[]
): ValidationWarning[] {
  return [
    productWithoutTags(products),
    tagWithoutProfile(products, kitchenProfiles),
    profileWithoutPrinter(kitchenProfiles, printers),
    multipleProfilesForTag(kitchenProfiles),
  ].filter((w): w is ValidationWarning => w !== null);
}