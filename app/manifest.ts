import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Kynisto – Everything Around You, Smarter.",
    short_name: "Kynisto",
    description: "Find trusted local stores, services, addresses, hours, reviews and directions.",
    start_url: "/",
    display: "standalone",
    background_color: "#f4f7fc",
    theme_color: "#2457ff",
    icons: [
      { src: "/kynisto-mark.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/kynisto-mark.svg", sizes: "any", type: "image/svg+xml", purpose: "maskable" },
    ],
    categories: ["business", "lifestyle", "navigation"],
  };
}
