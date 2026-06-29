import { describe, it, expect } from "vitest";
import { buildOrganizationJsonLd, buildBreadcrumbJsonLd } from "@/lib/schema";

describe("buildOrganizationJsonLd", () => {
  it("returns Agnes organization schema for English", () => {
    const result = buildOrganizationJsonLd("en");

    expect(result["@context"]).toBe("https://schema.org");
    expect(result["@type"]).toBe("Organization");
    expect(result.name).toContain("Agnes");
    expect(result.url).toContain("agnes-usage.xyz");
    expect(result.logo).toContain("agnes-usage-logo.png");
    expect(result.sameAs).toEqual([
      "https://github.com/GavinCnod/agnes-api-usage-analysis",
    ]);
  });

  it("returns Agnes organization schema for Chinese", () => {
    const result = buildOrganizationJsonLd("zh");

    expect(result["@context"]).toBe("https://schema.org");
    expect(result["@type"]).toBe("Organization");
    expect(result.name).toContain("Agnes");
    expect(result.name).toContain("用量分析");
  });
});

describe("buildBreadcrumbJsonLd", () => {
  it("returns 5 breadcrumb items for English", () => {
    const result = buildBreadcrumbJsonLd("en");
    const items = result.itemListElement as Array<Record<string, unknown>>;

    expect(result["@context"]).toBe("https://schema.org");
    expect(result["@type"]).toBe("BreadcrumbList");
    expect(items).toHaveLength(5);
    expect(items[0].position).toBe(1);
    expect(items[0].name).toBe("Agnes AI Usage Analysis Dashboard");
    expect(items[1].name).toBe("User Guide");
    expect(items[2].name).toBe("Privacy Policy");
    expect(items[3].name).toBe("Terms of Use");
    expect(items[4].name).toBe("Changelog");
  });

  it("returns 5 breadcrumb items for Chinese", () => {
    const result = buildBreadcrumbJsonLd("zh");
    const items = result.itemListElement as Array<Record<string, unknown>>;

    expect(items).toHaveLength(5);
    expect(items[0].name).toBe("Agnes AI 用量分析仪表盘");
    expect(items[1].name).toBe("使用指南");
    expect(items[2].name).toBe("隐私政策");
    expect(items[3].name).toBe("使用条款");
    expect(items[4].name).toBe("更新日志");
  });
});
