import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

const getUserMock = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: {
      getUser: getUserMock,
    },
  })),
}));

const adminUpdateMock = vi.fn();
const adminEqMock = vi.fn();
const adminFromMock = vi.fn(() => ({
  update: adminUpdateMock,
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(() => ({
    from: adminFromMock,
  })),
}));

import { toggleProfileActive } from "@/app/dashboard/admin/actions";

describe("toggleProfileActive", () => {
  beforeEach(() => {
    getUserMock.mockReset();
    adminFromMock.mockClear();
    adminUpdateMock.mockReset();
    adminEqMock.mockReset();
    adminUpdateMock.mockReturnValue({ eq: adminEqMock });
  });

  it("rejects a non-admin caller", async () => {
    getUserMock.mockResolvedValue({
      data: { user: { id: "u1", email: "not-admin@example.com" } },
    });

    const result = await toggleProfileActive("target-user-id", false);

    expect(result.error).toBe("Not authorized");
    expect(adminFromMock).not.toHaveBeenCalled();
  });

  it("uses the service-role client to update another user's profile when called by an admin", async () => {
    getUserMock.mockResolvedValue({
      data: { user: { id: "admin-id", email: "admin@orgdev.co" } },
    });
    adminEqMock.mockResolvedValue({ error: null });
    process.env.ADMIN_EMAILS = "admin@orgdev.co";

    const result = await toggleProfileActive("target-user-id", false);

    expect(result.error).toBeUndefined();
    expect(adminFromMock).toHaveBeenCalledWith("profiles");
    expect(adminUpdateMock).toHaveBeenCalledWith({ is_active: false });
    expect(adminEqMock).toHaveBeenCalledWith("id", "target-user-id");
  });
});
