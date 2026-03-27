"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { parseFile } from "@/lib/parser";
import { MenuBundle } from "@/types";

export default function UploadPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  const handleFile = useCallback(
    (file: File) => {
      setError(null);
      setLoading(true);
      setFileName(file.name);

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const bundle: MenuBundle = parseFile(content, file.name);

          if (bundle.products.length === 0) {
            setError("No products found in the file. Check the format and try again.");
            setLoading(false);
            return;
          }

          // Save to sessionStorage to pass to analyzer page
          sessionStorage.setItem("menuBundle", JSON.stringify(bundle));
          router.push("/analyzer");
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : "Unknown error";
          setError(`Could not parse file: ${message}`);
          setLoading(false);
        }
      };
      reader.readAsText(file);
    },
    [router]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => setIsDragging(false);

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
      {/* Header */}
      <div className="mb-10 text-center">
        <div className="inline-flex items-center gap-2 bg-white border border-gray-200 rounded-full px-4 py-1.5 text-xs text-gray-500 mb-6">
          <span className="w-2 h-2 rounded-full bg-green-400 inline-block"></span>
          Flipdish Menu Logic Analyzer
        </div>
        <h1 className="text-3xl font-semibold text-gray-900 mb-3">
          Analyze your menu routing
        </h1>
        <p className="text-gray-500 text-sm max-w-md mx-auto leading-relaxed">
          Upload a CSV or JSON export from Flipdish to visualize how products
          route through tags, kitchen stations, and printers.
        </p>
      </div>

      {/* Drop Zone */}
      <div
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onClick={() => fileInputRef.current?.click()}
        className={`
          w-full max-w-lg border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer
          transition-all duration-200
          ${isDragging
            ? "border-blue-400 bg-blue-50"
            : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
          }
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.json"
          className="hidden"
          onChange={onInputChange}
        />

        {loading ? (
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-500">
              Parsing <span className="font-medium text-gray-700">{fileName}</span>...
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700 mb-1">
                Drop your file here, or{" "}
                <span className="text-blue-600">browse</span>
              </p>
              <p className="text-xs text-gray-400">Supports .csv and .json</p>
            </div>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="mt-4 w-full max-w-lg bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-start gap-3">
          <svg className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M12 3a9 9 0 100 18A9 9 0 0012 3z" />
          </svg>
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Format guide */}
      <div className="mt-8 w-full max-w-lg">
        <p className="text-xs text-gray-400 mb-3 text-center">Expected file format</p>
        <div className="grid grid-cols-2 gap-3">
          {/* CSV format */}
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-medium bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">CSV</span>
              <span className="text-xs text-gray-400">Products only</span>
            </div>
            <pre className="text-xs text-gray-500 leading-relaxed overflow-x-auto">
{`id,name,category,tags
p1,Burger,Mains,Grill|Hot
p2,Salad,Starters,Cold`}
            </pre>
          </div>

          {/* JSON format */}
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-medium bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">JSON</span>
              <span className="text-xs text-gray-400">Full bundle</span>
            </div>
            <pre className="text-xs text-gray-500 leading-relaxed overflow-x-auto">
{`{
  "products": [...],
  "tags": [...],
  "kitchenProfiles": [...],
  "printers": [...]
}`}
            </pre>
          </div>
        </div>
      </div>

      {/* Demo link */}
      <button
        onClick={() => {
          const demo = {
            products: [
              { id: "p1", name: "Chicken Burger", category: "Burgers", tags: ["Grill", "Hot"] },
              { id: "p2", name: "Caesar Salad", category: "Salads", tags: ["Cold", "Prep"] },
              { id: "p3", name: "Margherita Pizza", category: "Pizza", tags: ["Oven"] },
              { id: "p4", name: "Fish & Chips", category: "Mains", tags: ["Fry", "Hot"] },
              { id: "p5", name: "Chocolate Brownie", category: "Desserts", tags: [] },
              { id: "p6", name: "Lemonade", category: "Drinks", tags: ["Bar"] },
            ],
            tags: [
              { id: "t1", name: "Grill" }, { id: "t2", name: "Hot" }, { id: "t3", name: "Cold" },
              { id: "t4", name: "Prep" }, { id: "t5", name: "Oven" }, { id: "t6", name: "Fry" },
              { id: "t7", name: "Bar" },
            ],
            kitchenProfiles: [
              { id: "kp1", name: "Grill Station", tag_ids: ["Grill", "Hot"], printer_id: "pr1" },
              { id: "kp2", name: "Cold Prep", tag_ids: ["Cold", "Prep"], printer_id: "pr2" },
              { id: "kp3", name: "Pizza Oven", tag_ids: ["Oven"], printer_id: "pr3" },
              { id: "kp4", name: "Fryer Station", tag_ids: ["Fry"], printer_id: "pr1" },
              { id: "kp5", name: "Bar", tag_ids: ["Bar"], printer_id: "pr4" },
            ],
            printers: [
              { id: "pr1", name: "Epson Kitchen", device_type: "thermal" },
              { id: "pr2", name: "Star Cold Prep", device_type: "thermal" },
              { id: "pr3", name: "Oven Printer", device_type: "thermal" },
              { id: "pr4", name: "Bar Printer", device_type: "bluetooth" },
            ],
          };
          sessionStorage.setItem("menuBundle", JSON.stringify(demo));
          router.push("/analyzer");
        }}
        className="mt-6 text-xs text-gray-400 hover:text-blue-600 underline underline-offset-2 transition-colors"
      >
        Or load demo data →
      </button>
    </main>
  );
}