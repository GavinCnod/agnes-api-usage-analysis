/**
 * 分享卡片数据提取模块
 *
 * 从 ParseResult 中提取各 tab 分享卡片所需的汇总数据。
 * 每个 tab 独立计算，返回用于 ShareCard 渲染的扁平数据结构。
 */

import type { ParseResult } from "./types";
import type { ProjectDef } from "./ProjectConfigContext";
import { UNCATEGORIZED } from "./ProjectConfigContext";

/** Dashboard 中的 Tab 类型 */
export type ShareTab = "overview" | "projects" | "keys" | "trends";

/** 分享卡片支持的核心指标类型。 */
export type ShareMetricKey = "cost" | "tokens" | "requests";

/**
 * 分享排行项的通用结构。
 */
interface ShareRankItem {
  name: string;
  totalCost: number;
  totalTokens: number;
  requestCount: number;
}

// ============================================================================
// 各 tab 数据接口
// ============================================================================

export interface OverviewShareData {
  tab: "overview";
  primaryMetric: ShareMetricKey;
  totalCost: number;
  totalTokens: number;
  totalRequests: number;
  activeKeys: number;
  modelCount: number;
  dateRange: { start: string; end: string } | null;
  dailyAverageValue: number;
}

export interface ProjectShareData {
  tab: "projects";
  chartMetric: ShareMetricKey;
  projectCount: number;
  keyCount: number;
  modelCount: number;
  dateRange: { start: string; end: string } | null;
  totalCost: number;
  totalTokens: number;
  totalRequests: number;
  /** 当前分享指标下的头部项目排行。 */
  topProjects: ShareRankItem[];
}

export interface KeyShareData {
  tab: "keys";
  chartMetric: ShareMetricKey;
  keyCount: number;
  modelCount: number;
  dateRange: { start: string; end: string } | null;
  totalCost: number;
  totalTokens: number;
  totalRequests: number;
  /** 当前分享指标下的头部 Key 排行。 */
  topKeys: ShareRankItem[];
}

export interface TrendsShareData {
  tab: "trends";
  metric: ShareMetricKey;
  totalValue: number;
  peakValue: number;
  lowestValue: number;
  dailyAverage: number;
  dateRange: { start: string; end: string } | null;
}

export type ShareCardData =
  | OverviewShareData
  | ProjectShareData
  | KeyShareData
  | TrendsShareData;

/**
 * 从分享卡片数据中读取当前实际采用的分享指标。
 *
 * 该函数用于让预览层和渲染层共享同一套指标选择结果，避免出现
 * 数据层已回退到 Token / Request，但界面仍按费用文案展示的情况。
 */
export function getShareMetricKey(data: ShareCardData): ShareMetricKey {
  switch (data.tab) {
    case "overview":
      return data.primaryMetric;
    case "projects":
      return data.chartMetric;
    case "keys":
      return data.chartMetric;
    case "trends":
      return data.metric;
  }
}

// ============================================================================
// 数据提取函数
// ============================================================================

/**
 * 根据汇总值选择分享卡片的主指标。
 *
 * 优先使用费用；若费用为 0，则自动回退到 Token；若 Token 也为 0，再回退到请求数。
 */
function pickShareMetric(totalCost: number, totalTokens: number, totalRequests: number): ShareMetricKey {
  if (totalCost > 0) return "cost";
  if (totalTokens > 0) return "tokens";
  return "requests";
}

/**
 * 读取汇总对象中对应指标的值。
 */
function getSummaryMetricValue(summary: ParseResult["summary"], metric: ShareMetricKey): number {
  switch (metric) {
    case "cost":
      return summary.totalCost;
    case "tokens":
      return summary.totalTokens;
    case "requests":
      return summary.totalRequests;
  }
}

/**
 * 读取排行项中对应指标的值。
 */
function getRankMetricValue(
  item: Pick<ShareRankItem, "totalCost" | "totalTokens" | "requestCount">,
  metric: ShareMetricKey
): number {
  switch (metric) {
    case "cost":
      return item.totalCost;
    case "tokens":
      return item.totalTokens;
    case "requests":
      return item.requestCount;
  }
}

/**
 * 判断排行项在任意可回退指标上是否存在有效值。
 */
function hasAnyRankActivity(item: Pick<ShareRankItem, "totalCost" | "totalTokens" | "requestCount">): boolean {
  return item.totalCost > 0 || item.totalTokens > 0 || item.requestCount > 0;
}

/**
 * 选出当前分享指标下可展示的头部排行项。
 *
 * 优先保留当前指标值大于 0 的项；若整体数据全为 0，则保留原始排序结果前几项，
 * 避免分享卡片在极端情况下完全没有排行数据。
 */
function selectTopRankItems<T extends ShareRankItem>(
  items: T[],
  metric: ShareMetricKey,
  limit: number
): T[] {
  const activeItems = items.filter((item) => getRankMetricValue(item, metric) > 0);
  if (activeItems.length > 0) {
    return activeItems.slice(0, limit);
  }

  return items.filter((item) => hasAnyRankActivity(item)).slice(0, limit);
}

/**
 * 按指定指标排序排行项，并使用其他指标作为稳定回退条件。
 */
function sortRankItems<T extends ShareRankItem>(
  items: T[],
  metric: ShareMetricKey
): T[] {
  const fallbackMetrics: ShareMetricKey[] = ["tokens", "cost", "requests"];

  return [...items].sort((left, right) => {
    const primaryDiff = getRankMetricValue(right, metric) - getRankMetricValue(left, metric);
    if (primaryDiff !== 0) return primaryDiff;

    for (const fallbackMetric of fallbackMetrics) {
      if (fallbackMetric === metric) continue;
      const fallbackDiff = getRankMetricValue(right, fallbackMetric) - getRankMetricValue(left, fallbackMetric);
      if (fallbackDiff !== 0) return fallbackDiff;
    }

    return left.name.localeCompare(right.name);
  });
}

function extractOverviewData(result: ParseResult): OverviewShareData {
  const { summary, daily } = result;
  const primaryMetric = pickShareMetric(summary.totalCost, summary.totalTokens, summary.totalRequests);
  const days = daily.length > 0
    ? [...new Set(daily.map((d) => d.date))].length
    : 1;

  return {
    tab: "overview",
    primaryMetric,
    totalCost: summary.totalCost,
    totalTokens: summary.totalTokens,
    totalRequests: summary.totalRequests,
    activeKeys: summary.activeKeys,
    modelCount: summary.models.length,
    dateRange: summary.dateRange,
    dailyAverageValue: getSummaryMetricValue(summary, primaryMetric) / days,
  };
}

function extractProjectData(
  result: ParseResult,
  config: ProjectDef[],
  uncategorizedLabel: string
): ProjectShareData {
  const { daily, summary } = result;
  const allKeys = [...new Set(daily.map((d) => d.apiKeyName))];
  const chartMetric = pickShareMetric(summary.totalCost, summary.totalTokens, summary.totalRequests);

  const map = new Map<string, { name: string; totalCost: number; totalTokens: number; requestCount: number; isUncategorized: boolean }>();

  for (const p of config) {
    map.set(p.name, { name: p.name, totalCost: 0, totalTokens: 0, requestCount: 0, isUncategorized: false });
  }
  map.set(UNCATEGORIZED, { name: uncategorizedLabel, totalCost: 0, totalTokens: 0, requestCount: 0, isUncategorized: true });

  for (const d of daily) {
    const lowerName = d.apiKeyName.toLowerCase();
    let matched = UNCATEGORIZED;
    for (const p of config) {
      if (p.keyNames.some((k) => k.toLowerCase() === lowerName)) {
        matched = p.name;
        break;
      }
    }
    const entry = map.get(matched);
    if (!entry) continue;
    entry.totalTokens += d.totalTokens;
    entry.totalCost += d.totalCost;
    entry.requestCount += d.requestCount;
  }

  const projects = Array.from(map.values()).filter((p) => !p.isUncategorized || hasAnyRankActivity(p));
  const sortedProjects = sortRankItems(projects, chartMetric);

  const activeCount = projects.filter((p) => !p.isUncategorized).length;

  return {
    tab: "projects",
    chartMetric,
    projectCount: activeCount,
    keyCount: allKeys.length,
    modelCount: summary.models.length,
    dateRange: summary.dateRange,
    totalCost: summary.totalCost,
    totalTokens: summary.totalTokens,
    totalRequests: summary.totalRequests,
    topProjects: selectTopRankItems(sortedProjects, chartMetric, 8).map((p) => ({
      name: p.name,
      totalCost: p.totalCost,
      totalTokens: p.totalTokens,
      requestCount: p.requestCount,
    })),
  };
}

function extractKeyData(result: ParseResult): KeyShareData {
  const { keys, summary } = result;
  const chartMetric = pickShareMetric(summary.totalCost, summary.totalTokens, summary.totalRequests);
  const sortedKeys = sortRankItems(
    keys.map((k) => ({
      name: k.apiKeyName,
      totalCost: k.totalCost,
      totalTokens: k.totalTokens,
      requestCount: k.requestCount,
    })),
    chartMetric
  );

  return {
    tab: "keys",
    chartMetric,
    keyCount: keys.length,
    modelCount: summary.models.length,
    dateRange: summary.dateRange,
    totalCost: summary.totalCost,
    totalTokens: summary.totalTokens,
    totalRequests: summary.totalRequests,
    topKeys: selectTopRankItems(sortedKeys, chartMetric, 8).map((k) => ({
      name: k.name,
      totalCost: k.totalCost,
      totalTokens: k.totalTokens,
      requestCount: k.requestCount,
    })),
  };
}

function extractTrendsData(result: ParseResult): TrendsShareData {
  const { daily, summary } = result;
  const metric = pickShareMetric(summary.totalCost, summary.totalTokens, summary.totalRequests);
  const dateMap = new Map<string, number>();
  for (const d of daily) {
    dateMap.set(d.date, (dateMap.get(d.date) ?? 0) + getRankMetricValue(d, metric));
  }
  const dailyCosts = [...dateMap.values()];
  const peakValue = dailyCosts.length > 0 ? Math.max(...dailyCosts) : 0;
  const lowestValue = dailyCosts.length > 0 ? Math.min(...dailyCosts) : 0;
  const days = dailyCosts.length || 1;

  return {
    tab: "trends",
    metric,
    totalValue: getSummaryMetricValue(summary, metric),
    peakValue,
    lowestValue,
    dailyAverage: getSummaryMetricValue(summary, metric) / days,
    dateRange: summary.dateRange,
  };
}

// ============================================================================
// 统一入口
// ============================================================================

export interface ShareCardDataOptions {
  tab: ShareTab;
  result: ParseResult;
  projectConfig?: ProjectDef[];
  uncategorizedLabel?: string;
}

export function extractShareCardData(options: ShareCardDataOptions): ShareCardData {
  const { tab, result, projectConfig = [], uncategorizedLabel = "Uncategorized" } = options;

  switch (tab) {
    case "overview":
      return extractOverviewData(result);
    case "projects":
      return extractProjectData(result, projectConfig, uncategorizedLabel);
    case "keys":
      return extractKeyData(result);
    case "trends":
      return extractTrendsData(result);
  }
}
