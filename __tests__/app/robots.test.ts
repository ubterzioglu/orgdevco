import { describe, it, expect, beforeEach, afterEach } from "vitest";

describe("robots", () => {
  const original = process.env.NEXT_PUBLIC_SITE_URL;

  beforeEach(() => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://orgdev.co";
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_SITE_URL = original;
  });

  it("allows public routes and disallows dashboard and api routes", async () => {
    const { default: robots } = await import("@/app/robots");
    const result = robots();

    expect(result.rules).toEqual({
      userAgent: "*",
      allow: "/",
      disallow: ["/dashboard/", "/api/"],
    });
    expect(result.sitemap).toBe("https://orgdev.co/sitemap.xml");
  });
});
