import { describe, it, expect, beforeEach, afterEach } from "vitest";

describe("sitemap", () => {
  const original = process.env.NEXT_PUBLIC_SITE_URL;

  beforeEach(() => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://orgdev.co";
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_SITE_URL = original;
  });

  it("lists all public routes with the configured site URL as base", async () => {
    const { default: sitemap } = await import("@/app/sitemap");
    const entries = sitemap();
    const urls = entries.map((entry) => entry.url);

    expect(urls).toEqual([
      "https://orgdev.co",
      "https://orgdev.co/consultants",
      "https://orgdev.co/organizations",
      "https://orgdev.co/login",
      "https://orgdev.co/signup",
    ]);
  });
});
