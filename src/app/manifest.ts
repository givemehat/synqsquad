import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "SynqSquad — Match & Connect on Gmail",
    short_name: "SynqSquad",
    description:
      "Find complementary hackathon teammates and research paper collaborators. Verified Google accounts only, direct peer-to-peer contact on Gmail.",
    start_url: "/?utm_source=twa",
    scope: "/",
    id: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0c0e12",
    theme_color: "#0c0e12",
    lang: "en",
    categories: ["social", "productivity", "education"],
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/icon-monochrome.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "monochrome",
      },
      {
        src: "/favicon.ico",
        sizes: "48x48",
        type: "image/x-icon",
      },
    ],
  };
}
