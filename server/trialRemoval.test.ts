import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const SOURCE_ROOTS = ["client/src", "server"];
const SOURCE_EXTENSIONS = new Set([".ts", ".tsx"]);
const TEST_FILE_PATTERN = /\.(?:test|spec)\.(?:ts|tsx)$/;

const RETIRED_TRIAL_PATTERNS = [
  { label: "$9 offer", pattern: /A?\$9(?![\d.])/i },
  { label: "Pro Trial wording or identifier", pattern: /\bpro[_ -]?trial\b/i },
  { label: "21-day trial/access offer", pattern: /\b21[- ]day(?:s)?\b/i },
  { label: "seven-day upgrade trial", pattern: /\b7[- ]day free trial\b/i },
  { label: "trial checkout mutation", pattern: /createProTrialCheckout/i },
];

function collectSourceFiles(relativeRoot: string): string[] {
  const absoluteRoot = path.join(process.cwd(), relativeRoot);
  const files: string[] = [];

  for (const entry of readdirSync(absoluteRoot, { withFileTypes: true })) {
    const absolutePath = path.join(absoluteRoot, entry.name);
    const relativePath = path.relative(process.cwd(), absolutePath);

    if (entry.isDirectory()) {
      files.push(...collectSourceFiles(relativePath));
      continue;
    }

    if (
      SOURCE_EXTENSIONS.has(path.extname(entry.name)) &&
      !TEST_FILE_PATTERN.test(entry.name)
    ) {
      files.push(relativePath);
    }
  }

  return files;
}

describe("retired A$9 trial", () => {
  it("does not appear in active client or server source", () => {
    const failures: string[] = [];

    for (const file of SOURCE_ROOTS.flatMap(collectSourceFiles)) {
      const source = readFileSync(path.join(process.cwd(), file), "utf8");
      for (const retired of RETIRED_TRIAL_PATTERNS) {
        if (retired.pattern.test(source)) {
          failures.push(`${file}: ${retired.label}`);
        }
      }
    }

    expect(failures, failures.join("\n")).toEqual([]);
  });
});
