import { describe, it, expect } from "vitest";
import { signupSchema, loginSchema } from "@/lib/validation/auth";

describe("signupSchema", () => {
  it("accepts a valid consultant signup", () => {
    const result = signupSchema.safeParse({
      email: "jane@example.com",
      password: "supersecret1",
      name: "Jane Doe",
      role: "CONSULTANT",
    });
    expect(result.success).toBe(true);
  });

  it("rejects an invalid role", () => {
    const result = signupSchema.safeParse({
      email: "jane@example.com",
      password: "supersecret1",
      name: "Jane Doe",
      role: "ADMIN",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a password under 8 characters", () => {
    const result = signupSchema.safeParse({
      email: "jane@example.com",
      password: "short",
      name: "Jane Doe",
      role: "CONSULTANT",
    });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid email", () => {
    const result = signupSchema.safeParse({
      email: "not-an-email",
      password: "supersecret1",
      name: "Jane Doe",
      role: "CONSULTANT",
    });
    expect(result.success).toBe(false);
  });
});

describe("loginSchema", () => {
  it("accepts a valid login", () => {
    const result = loginSchema.safeParse({
      email: "jane@example.com",
      password: "supersecret1",
    });
    expect(result.success).toBe(true);
  });

  it("rejects a missing password", () => {
    const result = loginSchema.safeParse({ email: "jane@example.com" });
    expect(result.success).toBe(false);
  });
});
