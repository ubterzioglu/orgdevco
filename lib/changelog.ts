import * as fs from "node:fs";
import path from "node:path";

export type ChangelogEntry = {
  date: string;
  items: string[];
};

export function getChangelogEntries(): ChangelogEntry[] {
  const filePath = path.join(process.cwd(), "CHANGELOG.md");
  const raw = fs.readFileSync(filePath, "utf-8");

  const sections = raw.split(/^## /m).slice(1);

  return sections.map((section) => {
    const [dateLine, ...rest] = section.split("\n");
    const items = rest
      .filter((line) => line.trim().startsWith("- "))
      .map((line) => line.trim().slice(2).trim());

    return { date: dateLine.trim(), items };
  });
}
