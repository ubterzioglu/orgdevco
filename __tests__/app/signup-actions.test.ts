import { describe, it, expect } from "vitest";
import { validateSignupForm } from "@/app/signup/actions";

describe("validateSignupForm", () => {
  it("returns parsed data for valid input", () => {
    const form = new FormData();
    form.set("email", "jane@example.com");
    form.set("password", "supersecret1");
    form.set("name", "Jane Doe");
    form.set("role", "CONSULTANT");

    const result = validateSignupForm(form);
    expect(result.success).toBe(true);
  });

  it("returns an error for a missing name", () => {
    const form = new FormData();
    form.set("email", "jane@example.com");
    form.set("password", "supersecret1");
    form.set("role", "CONSULTANT");

    const result = validateSignupForm(form);
    expect(result.success).toBe(false);
  });
});
