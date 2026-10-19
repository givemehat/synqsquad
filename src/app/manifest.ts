import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "SynqSquad — Match & Connect on Gmail",
    short_name: "SynqSquad",
    description:
      "Find hackathon partners & research co-authors. Talk directly on verified Gmail.",
    start_url: "/",
    display: "standalone",
    background_color: "#0e1115",
    theme_color: "#2563eb",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
    ],
  };
}
