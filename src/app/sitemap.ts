import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://synqsquad.vercel.app";
  const now = new Date();

  const routes = [
    "",
    "/how-it-works",
    "/about",
    "/faq",
    "/support",
    "/post",
    "/report",
    "/privacy",
    "/terms",
    "/guidelines",
    "/disclaimers",
    "/settings",
  ];

  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: now,
    changeFrequency: route === "" ? "hourly" : "weekly",
    priority: route === "" ? 1.0 : 0.8,
  }));
}
