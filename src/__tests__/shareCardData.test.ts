/**
 * 分享卡片数据提取测试
 *
 * 校验分享卡片已切换为与页面一致的三维主展示，
 * 并确保辅助图表指标会按 Token / 图片 / 视频的顺序稳定回退。
 */

import { describe, expect, it } from "vitest";
import { extractShareCardData, getShareMetricKey } from "@/lib/shareCardData";
import type { DailyUsage, KeyStats, ParseResult, UsageMetrics } from "@/lib/types";
import type { ProjectDef } from "@/lib/ProjectConfigContext";

/**
 * 构造完整的多模态指标默认值，避免测试夹具遗漏字段。
 */
function createUsageMetrics(overrides: Partial<UsageMetrics> = {}): UsageMetrics {
  return {
    requestCount: 0,
    textRequestCount: 0,
    imageRequestCount: 0,
    videoRequestCount: 0,
    unknownTypeRequestCount: 0,
    inputTokens: 0,
    outputTokens: 0,
    totalTokens: 0,
    imageCount: 0,
    videoSeconds: 0,
    ...overrides,
  };
}

/**
 * 构造每日聚合记录。
 */
function createDailyUsage(overrides: Partial<DailyUsage>): DailyUsage {
  return {
    date: "2026-06-01",
    model: "agnes-2.0-pro",
    apiKeyName: "Key-A",
    totalCost: 0,
    ...createUsageMetrics(),
    ...overrides,
  };
}

/**
 * 构造 Key 聚合记录。
 */
function createKeyStats(overrides: Partial<KeyStats>): KeyStats {
  return {
    apiKeyName: "Key-A",
    totalCost: 0,
    ...createUsageMetrics(),
    ...overrides,
  };
}

/**
 * 构造最小可用的解析结果，便于聚焦分享卡片逻辑测试。
 */
function createParseResult(options: {
  summary: {
    totalCost: number;
    totalTokens: number;
    imageCount: number;
    videoSeconds: number;
    totalRequests: number;
  };
  daily: ParseResult["daily"];
  keys: ParseResult["keys"];
}): ParseResult {
  const summaryMetrics = createUsageMetrics({
    requestCount: options.summary.totalRequests,
    totalTokens: options.summary.totalTokens,
    imageCount: options.summary.imageCount,
    videoSeconds: options.summary.videoSeconds,
  });

  return {
    daily: options.daily,
    keys: options.keys,
    summary: {
      ...summaryMetrics,
      totalCost: options.summary.totalCost,
      totalRequests: options.summary.totalRequests,
      activeKeys: options.keys.length,
      dateRange: { start: "2026-06-01", end: "2026-06-02" },
      models: ["agnes-2.0-pro", "agnes-2.0-flash"],
    },
    warnings: [],
  };
}

describe("extractShareCardData", () => {
  it("固定输出 tokens/images/videoSeconds 三维 Hero，并默认以 token 作为辅助图表指标", () => {
    const projectConfig: ProjectDef[] = [
      { name: "Project A", keyNames: ["Key-A"] },
      { name: "Project B", keyNames: ["Key-B"] },
    ];
    const result = createParseResult({
      summary: {
        totalCost: 0,
        totalTokens: 300,
        imageCount: 12,
        videoSeconds: 90,
        totalRequests: 5,
      },
      daily: [
        createDailyUsage({
          date: "2026-06-01",
          apiKeyName: "Key-A",
          requestCount: 4,
          textRequestCount: 4,
          inputTokens: 80,
          outputTokens: 20,
          totalTokens: 100,
          imageCount: 2,
          videoSeconds: 30,
          totalCost: 0,
        }),
        createDailyUsage({
          date: "2026-06-02",
          model: "agnes-2.0-flash",
          apiKeyName: "Key-B",
          requestCount: 1,
          textRequestCount: 1,
          inputTokens: 140,
          outputTokens: 60,
          totalTokens: 200,
          imageCount: 10,
          videoSeconds: 60,
          totalCost: 0,
        }),
      ],
      keys: [
        createKeyStats({
          apiKeyName: "Key-A",
          totalTokens: 100,
          inputTokens: 80,
          outputTokens: 20,
          imageCount: 2,
          videoSeconds: 30,
          totalCost: 0,
          requestCount: 4,
          textRequestCount: 4,
        }),
        createKeyStats({
          apiKeyName: "Key-B",
          totalTokens: 200,
          inputTokens: 140,
          outputTokens: 60,
          imageCount: 10,
          videoSeconds: 60,
          totalCost: 0,
          requestCount: 1,
          textRequestCount: 1,
        }),
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
    expect(overviewData.heroMetrics).toEqual([
      { key: "tokens", value: 300 },
      { key: "images", value: 12 },
      { key: "videoSeconds", value: 90 },
    ]);

    expect(projectData.tab).toBe("projects");
    if (projectData.tab === "projects") {
      expect(projectData.topProjects[0]?.name).toBe("Project B");
      expect(projectData.topProjects[0]?.totalTokens).toBe(200);
      expect(projectData.topProjects[0]?.imageCount).toBe(10);
    }

    expect(keyData.tab).toBe("keys");
    if (keyData.tab === "keys") {
      expect(keyData.topKeys[0]?.name).toBe("Key-B");
      expect(keyData.topKeys[0]?.totalTokens).toBe(200);
      expect(keyData.topKeys[0]?.videoSeconds).toBe(60);
    }

    expect(trendsData.tab).toBe("trends");
    if (trendsData.tab === "trends") {
      expect(trendsData.totalValue).toBe(300);
      expect(trendsData.peakValue).toBe(200);
      expect(trendsData.lowestValue).toBe(100);
    }
  });

  it("在 token 为 0 时会优先回退到图片指标，而不是费用或请求数", () => {
    const result = createParseResult({
      summary: {
        totalCost: 16,
        totalTokens: 0,
        imageCount: 12,
        videoSeconds: 45,
        totalRequests: 8,
      },
      daily: [
        createDailyUsage({
          date: "2026-06-01",
          apiKeyName: "Key-A",
          requestCount: 3,
          imageRequestCount: 3,
          imageCount: 2,
          videoSeconds: 15,
          totalCost: 4,
        }),
        createDailyUsage({
          date: "2026-06-02",
          model: "agnes-2.0-flash",
          apiKeyName: "Key-B",
          requestCount: 5,
          imageRequestCount: 5,
          imageCount: 10,
          videoSeconds: 30,
          totalCost: 12,
        }),
      ],
      keys: [
        createKeyStats({
          apiKeyName: "Key-A",
          requestCount: 3,
          imageRequestCount: 3,
          imageCount: 2,
          videoSeconds: 15,
          totalCost: 4,
        }),
        createKeyStats({
          apiKeyName: "Key-B",
          requestCount: 5,
          imageRequestCount: 5,
          imageCount: 10,
          videoSeconds: 30,
          totalCost: 12,
        }),
      ],
    });

    const overviewData = extractShareCardData({ tab: "overview", result });
    const keyData = extractShareCardData({ tab: "keys", result });
    const trendsData = extractShareCardData({ tab: "trends", result });

    expect(getShareMetricKey(overviewData)).toBe("images");
    expect(getShareMetricKey(keyData)).toBe("images");
    expect(getShareMetricKey(trendsData)).toBe("images");
    expect(overviewData.heroMetrics).toEqual([
      { key: "tokens", value: 0 },
      { key: "images", value: 12 },
      { key: "videoSeconds", value: 45 },
    ]);

    expect(keyData.tab).toBe("keys");
    if (keyData.tab === "keys") {
      expect(keyData.topKeys[0]?.name).toBe("Key-B");
      expect(keyData.topKeys[0]?.imageCount).toBe(10);
    }

    expect(trendsData.tab).toBe("trends");
    if (trendsData.tab === "trends") {
      expect(trendsData.totalValue).toBe(12);
      expect(trendsData.dailyAverage).toBe(6);
      expect(trendsData.peakValue).toBe(10);
    }
  });
});
