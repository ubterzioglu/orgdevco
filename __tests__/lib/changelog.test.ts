import { describe, it, expect, vi } from "vitest";

vi.mock("node:fs", () => ({
  readFileSync: vi.fn(
    () => "# Changelog\n\n## 2026-07-05\n\n- First item\n- Second item\n\n## 2026-07-04\n\n- Older item\n"
  ),
}));

import { getChangelogEntries } from "@/lib/changelog";

describe("getChangelogEntries", () => {
  it("parses dated sections into entries, newest first", () => {
    const entries = getChangelogEntries();
    expect(entries).toEqual([
      { date: "2026-07-05", items: ["First item", "Second item"] },
      { date: "2026-07-04", items: ["Older item"] },
    ]);
  });
});
