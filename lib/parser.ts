import Papa from "papaparse";
import type { MenuBundle, Product, Tag, KitchenProfile, Printer } from "@/types";

// ─── JSON Parser ──────────────────────────────────────────────────────────────

export function parseJSON(raw: string): MenuBundle {
  const data = JSON.parse(raw);

  // ── Formato estándar { products, tags, kitchenProfiles, printers } ──
  if (Array.isArray(data.products) && data.products.length > 0) {
    return {
      products: data.products.map(normalizeProduct),
      tags: data.tags ?? [],
      kitchenProfiles: (data.kitchenProfiles ?? data.kitchen_profiles ?? []).map(normalizeProfile),
      printers: data.printers ?? [],
    };
  }

  // ── Formato real de Flipdish: { categories: [{ caption, items: [...] }] } ──
  if (Array.isArray(data.categories)) {
    const products: Product[] = [];

    for (const category of data.categories) {
      const categoryName: string = category.caption ?? category.name ?? "";
      const items = Array.isArray(category.items) ? category.items : [];

      for (const item of items) {
        // Extraer stationTags desde paramsJson
        let tags: string[] = [];
        if (item.paramsJson) {
          try {
            const params = JSON.parse(item.paramsJson);
            const stationTags = params?.kdsConfiguration?.stationTags;
            if (stationTags) {
              tags = stationTags.split(",").map((t: string) => t.trim()).filter(Boolean);
            }
          } catch {
            // paramsJson inválido, ignorar
          }
        }

        products.push({
          id: String(item.id ?? ""),
          name: String(item.caption ?? item.name ?? ""),
          category: categoryName || undefined,
          tags,
          kitchen_profile_id: null,
          modifier_groups: [],
        });
      }
    }

    // Derivar tags únicos de los productos
    const tagNames = [...new Set(products.flatMap((p) => p.tags))];
    const tags: Tag[] = tagNames.map((name, i) => ({ id: `t${i}`, name }));

    return { products, tags, kitchenProfiles: [], printers: [] };
  }

  throw new Error("Unrecognized JSON format. Expected Flipdish menu export.");
}

// ─── CSV Parser ───────────────────────────────────────────────────────────────

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