// ─── Core Data Model ─────────────────────────────────────────────────────────

export type Product = {
  id: string;
  name: string;
  category?: string;
  tags: string[];
  kitchen_profile_id?: string | null;
  modifier_groups?: string[];
};

export type Tag = {
  id: string;
  name: string;
};

export type KitchenProfile = {
  id: string;
  name: string;
  tag_ids: string[];
  printer_id?: string | null;
};

export type Printer = {
  id: string;
  name: string;
  device_type?: string;
};

// ─── Routing Resolution ───────────────────────────────────────────────────────

export type RouteNode = {
  tag: string;
  profile: KitchenProfile | null;
  printer: Printer | null;
  error: "no_profile" | "no_printer" | null;
};

export type RoutingResult =
  | { ok: true; routes: RouteNode[] }
  | { ok: false; reason: "no_tags" | "no_routes_resolved"; message: string };

// ─── Validation ───────────────────────────────────────────────────────────────

export type ValidationWarning = {
  type:
    | "productWithoutTags"
    | "tagWithoutProfile"
    | "profileWithoutPrinter"
    | "multipleProfilesForTag";
  message: string;
  affected: string[];
};

// ─── Parsed Menu Bundle ───────────────────────────────────────────────────────

export type MenuBundle = {
  products: Product[];
  tags: Tag[];
  kitchenProfiles: KitchenProfile[];
  printers: Printer[];
};