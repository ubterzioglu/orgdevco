import { describe, it, expect } from "vitest";
import {
  consultantProfileSchema,
  organizationProfileSchema,
} from "@/lib/validation/profile";

describe("consultantProfileSchema", () => {
  it("accepts a valid consultant profile", () => {
    const result = consultantProfileSchema.safeParse({
      title: "Lean Transformation Coach",
      bio: "15 years helping manufacturers cut waste.",
      expertise: ["Lean", "Six Sigma"],
      languages: ["English", "Turkish"],
      location: "Istanbul, Turkey",
    });
    expect(result.success).toBe(true);
  });

  it("rejects an empty bio", () => {
    const result = consultantProfileSchema.safeParse({
      title: "Coach",
      bio: "",
      expertise: ["Lean"],
      languages: ["English"],
    });
    expect(result.success).toBe(false);
  });

  it("rejects a non-array expertise field", () => {
    const result = consultantProfileSchema.safeParse({
      title: "Coach",
      bio: "Bio text",
      expertise: "Lean",
      languages: ["English"],
    });
    expect(result.success).toBe(false);
  });

  it("allows omitting optional photoUrl and location", () => {
    const result = consultantProfileSchema.safeParse({
      title: "Coach",
      bio: "Bio text",
      expertise: ["Lean"],
      languages: ["English"],
    });
    expect(result.success).toBe(true);
  });
});

describe("organizationProfileSchema", () => {
  it("accepts a valid organization profile", () => {
    const result = organizationProfileSchema.safeParse({
      industry: "Manufacturing",
      description: "A mid-size auto parts manufacturer.",
      location: "Bursa, Turkey",
    });
    expect(result.success).toBe(true);
  });

  it("rejects an empty industry", () => {
    const result = organizationProfileSchema.safeParse({
      industry: "",
      description: "Description text",
    });
    expect(result.success).toBe(false);
  });
});
