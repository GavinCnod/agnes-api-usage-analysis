/**
 * 分享卡片数据提取测试
 *
 * 校验零费用场景下分享卡片会自动回退到 Token / Request，
 * 并确保排行与趋势都使用同一套回退指标。
 */

import { describe, expect, it } from "vitest";
import { extractShareCardData, getShareMetricKey } from "@/lib/shareCardData";
import type { ParseResult } from "@/lib/types";
import type { ProjectDef } from "@/lib/ProjectConfigContext";

/**
 * 构造最小可用的解析结果，便于聚焦分享卡片逻辑测试。
 */
function createParseResult(options: {
  totalCost: number;
  totalTokens: number;
  totalRequests: number;
  daily: ParseResult["daily"];
  keys: ParseResult["keys"];
}): ParseResult {
  return {
    daily: options.daily,
    keys: options.keys,
    summary: {
      totalCost: options.totalCost,
      totalTokens: options.totalTokens,
      totalRequests: options.totalRequests,
      activeKeys: options.keys.length,
      dateRange: { start: "2026-06-01", end: "2026-06-02" },
      models: ["agnes-2.0-pro", "agnes-2.0-flash"],
    },
    warnings: [],
  };
}

describe("extractShareCardData", () => {
  it("在总费用为 0 时统一回退到 token 指标", () => {
    const projectConfig: ProjectDef[] = [
      { name: "Project A", keyNames: ["Key-A"] },
      { name: "Project B", keyNames: ["Key-B"] },
    ];
    const result = createParseResult({
      totalCost: 0,
      totalTokens: 300,
      totalRequests: 5,
      daily: [
        {
          date: "2026-06-01",
          model: "agnes-2.0-pro",
          apiKeyName: "Key-A",
          requestCount: 4,
          inputTokens: 80,
          outputTokens: 20,
          totalTokens: 100,
          totalCost: 0,
        },
        {
          date: "2026-06-02",
          model: "agnes-2.0-flash",
          apiKeyName: "Key-B",
          requestCount: 1,
          inputTokens: 140,
          outputTokens: 60,
          totalTokens: 200,
          totalCost: 0,
        },
      ],
      keys: [
        {
          apiKeyName: "Key-A",
          totalTokens: 100,
          inputTokens: 80,
          outputTokens: 20,
          totalCost: 0,
          requestCount: 4,
        },
        {
          apiKeyName: "Key-B",
          totalTokens: 200,
          inputTokens: 140,
          outputTokens: 60,
          totalCost: 0,
          requestCount: 1,
        },
      ],
    });

    const overviewData = extractShareCardData({ tab: "overview", result });
    const projectData = extractShareCardData({
      tab: "projects",
      result,
      projectConfig,
      uncategorizedLabel: "Uncategorized",
    });
    const keyData = extractShareCardData({ tab: "keys", result });
    const trendsData = extractShareCardData({ tab: "trends", result });

    expect(getShareMetricKey(overviewData)).toBe("tokens");
    expect(getShareMetricKey(projectData)).toBe("tokens");
    expect(getShareMetricKey(keyData)).toBe("tokens");
    expect(getShareMetricKey(trendsData)).toBe("tokens");

    expect(projectData.tab).toBe("projects");
    if (projectData.tab === "projects") {
      expect(projectData.topProjects[0]?.name).toBe("Project B");
      expect(projectData.topProjects[0]?.totalTokens).toBe(200);
    }

    expect(keyData.tab).toBe("keys");
    if (keyData.tab === "keys") {
      expect(keyData.topKeys[0]?.name).toBe("Key-B");
      expect(keyData.topKeys[0]?.totalTokens).toBe(200);
    }

    expect(trendsData.tab).toBe("trends");
    if (trendsData.tab === "trends") {
      expect(trendsData.totalValue).toBe(300);
      expect(trendsData.peakValue).toBe(200);
      expect(trendsData.lowestValue).toBe(100);
    }
  });

  it("在总费用与 token 都为 0 时继续回退到请求数", () => {
    const result = createParseResult({
      totalCost: 0,
      totalTokens: 0,
      totalRequests: 8,
      daily: [
        {
          date: "2026-06-01",
          model: "agnes-2.0-pro",
          apiKeyName: "Key-A",
          requestCount: 3,
          inputTokens: 0,
          outputTokens: 0,
          totalTokens: 0,
          totalCost: 0,
        },
        {
          date: "2026-06-02",
          model: "agnes-2.0-flash",
          apiKeyName: "Key-B",
          requestCount: 5,
          inputTokens: 0,
          outputTokens: 0,
          totalTokens: 0,
          totalCost: 0,
        },
      ],
      keys: [
        {
          apiKeyName: "Key-A",
          totalTokens: 0,
          inputTokens: 0,
          outputTokens: 0,
          totalCost: 0,
          requestCount: 3,
        },
        {
          apiKeyName: "Key-B",
          totalTokens: 0,
          inputTokens: 0,
          outputTokens: 0,
          totalCost: 0,
          requestCount: 5,
        },
      ],
    });

    const overviewData = extractShareCardData({ tab: "overview", result });
    const keyData = extractShareCardData({ tab: "keys", result });
    const trendsData = extractShareCardData({ tab: "trends", result });

    expect(getShareMetricKey(overviewData)).toBe("requests");
    expect(getShareMetricKey(keyData)).toBe("requests");
    expect(getShareMetricKey(trendsData)).toBe("requests");

    expect(keyData.tab).toBe("keys");
    if (keyData.tab === "keys") {
      expect(keyData.topKeys[0]?.name).toBe("Key-B");
      expect(keyData.topKeys[0]?.requestCount).toBe(5);
    }

    expect(trendsData.tab).toBe("trends");
    if (trendsData.tab === "trends") {
      expect(trendsData.totalValue).toBe(8);
      expect(trendsData.dailyAverage).toBe(4);
    }
  });
});
