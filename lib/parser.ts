import Papa from "papaparse";
import type { MenuBundle, Product, Tag, KitchenProfile, Printer } from "@/types";

// ─── JSON Parser ──────────────────────────────────────────────────────────────

/**
 * Parses a full Flipdish menu export in JSON format.
 * Expected shape: { products, tags, kitchenProfiles, printers }
 */
export function parseJSON(raw: string): MenuBundle {
  const data = JSON.parse(raw);
  return {
    products: (data.products ?? []).map(normalizeProduct),
    tags: data.tags ?? [],
    kitchenProfiles: (data.kitchenProfiles ?? data.kitchen_profiles ?? []).map(normalizeProfile),
    printers: data.printers ?? [],
  };
}

// ─── CSV Parser ───────────────────────────────────────────────────────────────

/**
 * Parses a product-level CSV export.
 * Expected columns: id, name, category, tags (pipe-separated), kitchen_profile_id
 *
 * Tags and profiles must be provided separately (JSON) for full routing.
 * This parser produces a partial MenuBundle — kitchenProfiles/printers may be empty.
 */
export function parseCSV(raw: string): MenuBundle {
  const result = Papa.parse<Record<string, string>>(raw, {
    header: true,
    skipEmptyLines: true,
  });

  if (result.errors.length > 0) {
    const firstError = result.errors[0];
    throw new Error(`CSV parse error on row ${firstError.row}: ${firstError.message}`);
  }

  const products: Product[] = result.data.map((row, i) => ({
    id: row.id || `p${i}`,
    name: row.name || row.Name || row.product_name || "",
    category: row.category || row.Category || undefined,
    tags: row.tags
      ? row.tags.split("|").map((t: string) => t.trim()).filter(Boolean)
      : [],
    kitchen_profile_id: row.kitchen_profile_id || null,
    modifier_groups: row.modifier_groups
      ? row.modifier_groups.split("|").map((m: string) => m.trim())
      : [],
  }));

  // Derive tags from product data when a separate tag list isn't available
  const tagNames = [...new Set(products.flatMap((p) => p.tags))];
  const tags: Tag[] = tagNames.map((name, i) => ({ id: `t${i}`, name }));

  return { products, tags, kitchenProfiles: [], printers: [] };
}

// ─── Auto-detect Parser ───────────────────────────────────────────────────────

export function parseFile(content: string, filename: string): MenuBundle {
  if (filename.endsWith(".json")) return parseJSON(content);
  if (filename.endsWith(".csv")) return parseCSV(content);
  throw new Error(`Unsupported file type: ${filename}. Upload a .csv or .json file.`);
}

// ─── Normalizers ──────────────────────────────────────────────────────────────

function normalizeProduct(p: Record<string, unknown>): Product {
  return {
    id: String(p.id ?? ""),
    name: String(p.name ?? ""),
    category: p.category ? String(p.category) : undefined,
    tags: Array.isArray(p.tags) ? p.tags.map(String) : [],
    kitchen_profile_id: p.kitchen_profile_id ? String(p.kitchen_profile_id) : null,
    modifier_groups: Array.isArray(p.modifier_groups)
      ? p.modifier_groups.map(String)
      : [],
  };
}

function normalizeProfile(kp: Record<string, unknown>): KitchenProfile {
  return {
    id: String(kp.id ?? ""),
    name: String(kp.name ?? ""),
    tag_ids: Array.isArray(kp.tag_ids) ? kp.tag_ids.map(String) : [],
    printer_id: kp.printer_id ? String(kp.printer_id) : null,
  };
}