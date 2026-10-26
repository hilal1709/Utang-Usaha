import type { NextConfig } from "next";

// Seluruh halaman bergantung pada sesi & data live, jadi model caching lama
// (tanpa cacheComponents) dipakai: rute otomatis dinamis saat membaca cookies.
const nextConfig: NextConfig = {
  serverExternalPackages: ["exceljs", "pptxgenjs"],
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
