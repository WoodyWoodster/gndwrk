import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://gndwrk.com";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/dashboard/", "/api/", "/_next/"],
      },
      // AI Search Crawlers - explicitly allow for GEO (Generative Engine Optimization)
      {
        userAgent: "Bingbot", // Required for ChatGPT Search (uses Bing index)
        allow: "/",
      },
      {
        userAgent: "OAI-SearchBot", // OpenAI's official search crawler
        allow: "/",
      },
      {
        userAgent: "ChatGPT-User", // ChatGPT live lookup agent
        allow: "/",
      },
      {
        userAgent: "ClaudeBot", // Anthropic's Claude web crawler
        allow: "/",
      },
      {
        userAgent: "PerplexityBot", // Perplexity AI search
        allow: "/",
      },
      {
        userAgent: "Googlebot", // Traditional SEO
        allow: "/",
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
