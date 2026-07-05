import { describe, it, expect } from "vitest";
import { validateOrganizationProfileForm } from "@/app/dashboard/organization/actions";

describe("validateOrganizationProfileForm", () => {
  it("accepts a valid organization profile submission", () => {
    const form = new FormData();
    form.set("industry", "Manufacturing");
    form.set("description", "A mid-size auto parts manufacturer.");
    form.set("location", "Bursa");

    const result = validateOrganizationProfileForm(form);
    expect(result.success).toBe(true);
  });

  it("rejects an empty description", () => {
    const form = new FormData();
    form.set("industry", "Manufacturing");
    form.set("description", "");

    const result = validateOrganizationProfileForm(form);
    expect(result.success).toBe(false);
  });
});
