import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "AP Insight — Utang Usaha Group",
    short_name: "AP Insight",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#EDF3F5",
    theme_color: "#2D728F",
    icons: [
      { src: "/brand/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/brand/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/brand/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
