import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

function read(relativePath: string): string {
  return readFileSync(new URL(relativePath, import.meta.url), "utf8");
}

describe("public pricing and feature copy", () => {
  const pricing = read("./Pricing.tsx");
  const help = read("./Help.tsx");
  const cabinetJoinery = read("./CabinetJoinery.tsx");
  const structuredData = read("../components/StructuredData.tsx");
  const home = read("./Home.tsx");
  const demo = read("./DemoMode.tsx");
  const evaluation = read("./Evaluation.tsx");
  const products = read("../../../server/stripe/products.ts");
  const publicPricing = read("../../public/pricing.md");

  it("publishes only the validated sample and Sole Tradie continuation", () => {
    expect(pricing).toContain('name: "Sole Tradie"');
    expect(pricing).not.toContain('name: "Pro"');
    expect(pricing).not.toContain('name: "Mid-Tier Builder"');
    expect(pricing).not.toContain('name: "Enterprise & Custom"');

    expect(structuredData).toContain('"name": "Sole Tradie"');
    expect(structuredData).toContain('"price": "149"');
    expect(structuredData).not.toContain('"name": "Pro"');
    expect(structuredData).not.toContain('"name": "Mid-Tier Builder"');

    expect(products).toContain('priceMonthly: 14900');
    expect(products).toContain('priceMonthly: 45000');
    expect(products).toContain('priceMonthly: 149900');
  });

  it("states the one-user founding scope without team-seat claims", () => {
    expect(pricing).toContain('{ label: "Included users", value: "1" }');
    expect(pricing).not.toContain('{ label: "Included users", value: "5" }');
    expect(pricing).not.toContain('{ label: "Included users", value: "20" }');
    expect(pricing).not.toContain("No seat limits");
    expect(pricing).not.toContain("unlimited users");

    expect(cabinetJoinery).toContain('label: "Included access"');
    expect(cabinetJoinery).toContain('value: "1 user"');
    expect(cabinetJoinery).not.toContain('value: "5 users"');
  });

  it("uses the enforced 32MB file limit everywhere", () => {
    expect(pricing).toContain("32MB per upload");
    expect(pricing).not.toContain("50MB");
    expect(help).toContain("32MB per file");
    expect(help).not.toContain("50MB per file");
  });

  it("removes budget-positioning language from core pricing copy", () => {
    for (const source of [pricing, home, demo, products]) {
      expect(source).not.toContain("A$9");
      expect(source).not.toContain("21-Day Trial");
      expect(source).not.toContain("No questions asked");
    }
    expect(pricing).not.toContain("A$499");
    expect(pricing).not.toContain("BEST VALUE");
  });

  it("uses one paid founding setup offer instead of free founder work", () => {
    expect(products).toContain('id: "founding_pilot_setup_sprint"');
    expect(products).toContain("priceExGst: 250000");
    expect(products).toContain("amount: 275000");
    expect(evaluation).toContain("A$2,500 plus GST");
    expect(evaluation).toContain('intent: "Paid Pilot Setup"');
    expect(publicPricing).toContain("Total payment: A$2,750");

    for (const source of [pricing, home, demo, evaluation, products, publicPricing]) {
      expect(source).not.toContain("Live Plan Evaluation");
    }
  });
});
