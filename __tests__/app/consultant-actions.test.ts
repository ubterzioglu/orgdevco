import { describe, it, expect } from "vitest";
import { validateConsultantProfileForm } from "@/app/dashboard/consultant/actions";

describe("validateConsultantProfileForm", () => {
  it("parses expertise and languages as comma-separated lists", () => {
    const form = new FormData();
    form.set("title", "Lean Coach");
    form.set("bio", "15 years of experience.");
    form.set("expertise", "Lean, Six Sigma");
    form.set("languages", "English, Turkish");
    form.set("location", "Istanbul");

    const result = validateConsultantProfileForm(form);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.expertise).toEqual(["Lean", "Six Sigma"]);
      expect(result.data.languages).toEqual(["English", "Turkish"]);
    }
  });

  it("rejects an empty title", () => {
    const form = new FormData();
    form.set("title", "");
    form.set("bio", "Bio");
    form.set("expertise", "Lean");
    form.set("languages", "English");

    const result = validateConsultantProfileForm(form);
    expect(result.success).toBe(false);
  });
});
