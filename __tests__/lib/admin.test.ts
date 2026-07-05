import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { isAdminEmail } from "@/lib/admin";

describe("isAdminEmail", () => {
  const original = process.env.ADMIN_EMAILS;

  beforeEach(() => {
    process.env.ADMIN_EMAILS = "admin@orgdev.co, owner@orgdev.co";
  });

  afterEach(() => {
    process.env.ADMIN_EMAILS = original;
  });

  it("returns true for an allowlisted email", () => {
    expect(isAdminEmail("admin@orgdev.co")).toBe(true);
  });

  it("is case-insensitive and trims whitespace in the allowlist", () => {
    expect(isAdminEmail("Owner@orgdev.co")).toBe(true);
  });

  it("returns false for an email not on the allowlist", () => {
    expect(isAdminEmail("nobody@example.com")).toBe(false);
  });

  it("returns false when ADMIN_EMAILS is unset", () => {
    delete process.env.ADMIN_EMAILS;
    expect(isAdminEmail("admin@orgdev.co")).toBe(false);
  });
});
