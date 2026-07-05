import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: {
      getUser: vi.fn(async () => ({
        data: { user: { id: "u1", email: "not-admin@example.com" } },
      })),
    },
    from: vi.fn(),
  })),
}));

import { toggleProfileActive } from "@/app/dashboard/admin/actions";

describe("toggleProfileActive", () => {
  it("rejects a non-admin caller", async () => {
    const result = await toggleProfileActive("target-user-id", false);
    expect(result.error).toBe("Not authorized");
  });
});
