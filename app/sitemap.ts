import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date("2026-11-08T00:00:00+01:00");
  return ["", "/privacy", "/terms", "/data-deletion"].map((path) => ({
    url: `https://zeexco.com${path}`,
    lastModified,
    changeFrequency: path ? "yearly" : "monthly",
    priority: path ? 0.5 : 1,
  }));
}
