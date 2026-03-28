"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { MenuBundle, Product, RouteNode } from "@/types";
import { resolveRouting, explainRoute } from "@/lib/resolver";
import { validateAll, ValidationWarning } from "@/lib/validators";

export default function AnalyzerPage() {
  const router = useRouter();
  const [bundle, setBundle] = useState<MenuBundle | null>(null);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Product | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem("menuBundle");
    if (!raw) {
      router.push("/upload");
      return;
    }
    const parsed: MenuBundle = JSON.parse(raw);
    setBundle(parsed);
    if (parsed.products.length > 0) setSelected(parsed.products[0]);
  }, [router]);

  const warnings = useMemo<ValidationWarning[]>(() => {
    if (!bundle) return [];
    return validateAll(bundle.products, bundle.kitchenProfiles, bundle.printers);
  }, [bundle]);

  const filtered = useMemo(() => {
    if (!bundle) return [];
    const q = search.toLowerCase();
    return bundle.products.filter((p) => p.name.toLowerCase().includes(q));
  }, [bundle, search]);

  const routes = useMemo(() => {
    if (!selected || !bundle) return null;
    return resolveRouting(selected, bundle.kitchenProfiles, bundle.printers);
  }, [selected, bundle]);

  if (!bundle) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">

      {/* ── Sidebar ─────────────────────────────────────────────── */}
      <aside className="w-72 min-w-72 bg-white border-r border-gray-100 flex flex-col">

        {/* Logo */}
        <div className="px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-400"></span>
            <span className="text-xs text-gray-500 font-medium">Flipdish Analyzer</span>
          </div>
        </div>

        {/* Search */}
        <div className="px-4 py-3 border-b border-gray-100">
          <div className="relative">
            <svg className="absolute left-3 top-2.5 w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-blue-400 focus:bg-white transition-all"
            />
          </div>
        </div>

        {/* Product list */}
        <div className="flex-1 overflow-y-auto px-2 py-2">
          {filtered.length === 0 ? (
            <p className="text-xs text-gray-400 text-center mt-6">No products found</p>
          ) : (
            filtered.map((p) => {
              const r = resolveRouting(p, bundle.kitchenProfiles, bundle.printers);
              const hasError = !r.ok || (r.ok && r.routes.some((rt) => rt.error));
              const isSelected = selected?.id === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => setSelected(p)}
                  className={`w-full text-left px-3 py-2.5 rounded-xl mb-1 transition-all ${
                    isSelected
                      ? "bg-blue-50 border border-blue-200"
                      : "hover:bg-gray-50 border border-transparent"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className={`text-sm font-medium ${isSelected ? "text-blue-700" : "text-gray-800"}`}>
                      {p.name}
                    </span>
                    {hasError && (
                      <span className="text-yellow-500 text-xs mt-0.5">⚠</span>
                    )}
                  </div>
                  {p.category && (
                    <span className="text-xs text-gray-400">{p.category}</span>
                  )}
                  {p.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {p.tags.map((t) => (
                        <span key={t} className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </button>
              );
            })
          )}
        </div>

        {/* Back button */}
        <div className="px-4 py-3 border-t border-gray-100">
          <button
            onClick={() => router.push("/upload")}
            className="w-full text-xs text-gray-400 hover:text-gray-600 transition-colors flex items-center gap-1.5"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Upload new file
          </button>
        </div>
      </aside>

      {/* ── Main ────────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col overflow-hidden">

        {/* Header */}
        <div className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-base font-semibold text-gray-900">Menu routing overview</h1>
            <p className="text-xs text-gray-400 mt-0.5">{bundle.products.length} products · {bundle.kitchenProfiles.length} stations · {bundle.printers.length} printers</p>
          </div>
          <div className="flex gap-2">
            <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-center">
              <p className="text-xs text-gray-400">Products</p>
              <p className="text-lg font-semibold text-gray-800">{bundle.products.length}</p>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-center">
              <p className="text-xs text-gray-400">Tags</p>
              <p className="text-lg font-semibold text-gray-800">{bundle.tags.length}</p>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-center">
              <p className="text-xs text-gray-400">Stations</p>
              <p className="text-lg font-semibold text-gray-800">{bundle.kitchenProfiles.length}</p>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-center">
              <p className="text-xs text-gray-400">Printers</p>
              <p className="text-lg font-semibold text-gray-800">{bundle.printers.length}</p>
            </div>
          </div>
        </div>

        {/* Warnings */}
        {warnings.length > 0 && (
          <div className="px-6 pt-4 flex flex-col gap-2">
            {warnings.map((w, i) => (
              <div key={i} className="bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3 flex items-start gap-3">
                <span className="text-yellow-500 text-sm mt-0.5">⚠</span>
                <p className="text-sm text-yellow-800">{w.message}</p>
              </div>
            ))}
          </div>
        )}

        {/* Products table */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left text-xs text-gray-400 font-medium pb-3 pr-4">Product</th>
                <th className="text-left text-xs text-gray-400 font-medium pb-3 pr-4">Category</th>
                <th className="text-left text-xs text-gray-400 font-medium pb-3 pr-4">Tags</th>
                <th className="text-left text-xs text-gray-400 font-medium pb-3 pr-4">Kitchen station</th>
                <th className="text-left text-xs text-gray-400 font-medium pb-3 pr-4">Printer</th>
                <th className="text-left text-xs text-gray-400 font-medium pb-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {bundle.products.map((p) => {
                const r = resolveRouting(p, bundle.kitchenProfiles, bundle.printers);
                const firstRoute = r.ok ? r.routes[0] : null;
                const station = firstRoute?.profile?.name ?? "—";
                const printer = firstRoute?.printer?.name ?? "—";
                const isSelected = selected?.id === p.id;

                let statusEl = (
                  <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">Routed</span>
                );
                if (!r.ok) {
                  statusEl = <span className="text-xs text-red-600 bg-red-50 px-2 py-0.5 rounded-full">No tags</span>;
                } else if (r.routes.some((rt) => rt.error)) {
                  statusEl = <span className="text-xs text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded-full">Partial</span>;
                }

                return (
                  <tr
                    key={p.id}
                    onClick={() => setSelected(p)}
                    className={`border-b border-gray-50 cursor-pointer transition-colors ${
                      isSelected ? "bg-blue-50" : "hover:bg-gray-50"
                    }`}
                  >
                    <td className="py-3 pr-4 font-medium text-gray-800">{p.name}</td>
                    <td className="py-3 pr-4 text-gray-500">{p.category ?? "—"}</td>
                    <td className="py-3 pr-4">
                      <div className="flex flex-wrap gap-1">
                        {p.tags.length > 0
                          ? p.tags.map((t) => (
                              <span key={t} className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">{t}</span>
                            ))
                          : <span className="text-gray-300">—</span>
                        }
                      </div>
                    </td>
                    <td className="py-3 pr-4 text-gray-600">{station}</td>
                    <td className="py-3 pr-4 text-gray-600">{printer}</td>
                    <td className="py-3">{statusEl}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </main>

      {/* ── Right panel ─────────────────────────────────────────── */}
      <aside className="w-80 min-w-80 bg-white border-l border-gray-100 flex flex-col overflow-y-auto">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-xs font-medium text-gray-500 uppercase tracking-wide">Routing detail</h2>
        </div>

        {!selected ? (
          <div className="flex-1 flex items-center justify-center p-6 text-center">
            <p className="text-sm text-gray-400">Select a product to see its routing chain.</p>
          </div>
        ) : (
          <div className="p-5 flex flex-col gap-4">
            {/* Product name */}
            <div>
              <p className="text-lg font-semibold text-gray-900">{selected.name}</p>
              {selected.category && (
                <p className="text-xs text-gray-400 mt-0.5">{selected.category}</p>
              )}
            </div>

            {/* Routing chain */}
            {routes && !routes.ok ? (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <p className="text-xs text-red-500 font-medium uppercase tracking-wide mb-1">Error</p>
                <p className="text-sm text-red-700">{routes.message}</p>
              </div>
            ) : routes && routes.ok && (
              <div className="flex flex-col gap-3">
                {routes.routes.map((route: RouteNode, i: number) => (
                  <div key={i} className="flex flex-col gap-0">
                    <p className="text-xs text-gray-400 mb-2">Via tag <span className="font-medium text-gray-600">"{route.tag}"</span></p>

                    {/* Product node */}
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
                      <p className="text-xs text-blue-500 uppercase tracking-wide mb-0.5">Product</p>
                      <p className="text-sm font-medium text-blue-800">{selected.name}</p>
                    </div>

                    <div className="flex justify-center py-1 text-gray-300 text-lg">↓</div>

                    {/* Tag node */}
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-3">
                      <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Tag</p>
                      <p className="text-sm font-medium text-gray-700">{route.tag}</p>
                    </div>

                    <div className="flex justify-center py-1 text-gray-300 text-lg">↓</div>

                    {/* Station node */}
                    {!route.profile ? (
                      <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                        <p className="text-xs text-red-400 uppercase tracking-wide mb-0.5">Kitchen station</p>
                        <p className="text-sm font-medium text-red-600">No station mapped</p>
                      </div>
                    ) : (
                      <>
                        <div className="bg-gray-50 border border-gray-200 rounded-xl p-3">
                          <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Kitchen station</p>
                          <p className="text-sm font-medium text-gray-700">{route.profile.name}</p>
                        </div>

                        <div className="flex justify-center py-1 text-gray-300 text-lg">↓</div>

                        {/* Printer node */}
                        {!route.printer ? (
                          <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                            <p className="text-xs text-red-400 uppercase tracking-wide mb-0.5">Printer</p>
                            <p className="text-sm font-medium text-red-600">No printer linked</p>
                          </div>
                        ) : (
                          <div className="bg-green-50 border border-green-200 rounded-xl p-3">
                            <p className="text-xs text-green-500 uppercase tracking-wide mb-0.5">Printer</p>
                            <p className="text-sm font-medium text-green-800">{route.printer.name}</p>
                            {route.printer.device_type && (
                              <p className="text-xs text-green-600 mt-0.5">{route.printer.device_type}</p>
                            )}
                          </div>
                        )}
                      </>
                    )}

                    {/* Explanation */}
                    {route.profile && route.printer && (
                      <div className="mt-3 bg-gray-50 rounded-xl p-3">
                        <p className="text-xs text-gray-400 uppercase tracking-wide mb-1.5">Explanation</p>
                        <p className="text-xs text-gray-600 leading-relaxed">
                          {explainRoute(selected.name, route)}
                        </p>
                      </div>
                    )}

                    {i < routes.routes.length - 1 && (
                      <div className="border-t border-gray-100 my-2" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </aside>
    </div>
  );
}