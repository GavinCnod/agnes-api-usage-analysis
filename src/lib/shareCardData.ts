/**
 * 分享卡片数据提取模块
 *
 * 统一为分享层提供与页面一致的多模态口径：
 * - Hero 主展示固定为文本 Token、图片数量、视频时长三维并列
 * - 图表/排行的辅助指标使用同一套稳定回退顺序
 * - Projects / Keys / Trends 共享同一类多模态聚合结构
 */

import type { ProjectDef } from "./ProjectConfigContext";
import { UNCATEGORIZED } from "./ProjectConfigContext";
import {
  type DashboardMetricKey,
  HERO_METRIC_KEYS,
  getMetricValue,
  sortByMetric,
} from "./dashboardMetrics";
import type { ParseResult } from "./types";

/** Dashboard 中的 Tab 类型。 */
export type ShareTab = "overview" | "projects" | "keys" | "trends";

/** 分享卡片固定主展示的三维指标类型。 */
export type ShareHeroMetricKey = Extract<DashboardMetricKey, "tokens" | "images" | "videoSeconds">;

/** 分享卡片图表与排行可使用的辅助指标类型。 */
export type ShareMetricKey = DashboardMetricKey;

/**
 * 分享 Hero 单项数据。
 */
export interface ShareHeroMetricItem {
  key: ShareHeroMetricKey;
  value: number;
}

/**
 * 分享排行项的通用结构。
 */
interface ShareRankItem {
  name: string;
  totalCost: number;
  totalTokens: number;
  imageCount: number;
  videoSeconds: number;
  requestCount: number;
}

/**
 * 分享卡片共享的汇总字段。
 */
interface ShareAggregateTotals {
  totalCost: number;
  totalTokens: number;
  imageCount: number;
  videoSeconds: number;
  totalRequests: number;
}

// ============================================================================
// 各 tab 数据接口
// ============================================================================

export interface OverviewShareData extends ShareAggregateTotals {
  tab: "overview";
  heroMetrics: ShareHeroMetricItem[];
  chartMetric: ShareMetricKey;
  activeKeys: number;
  modelCount: number;
  dateRange: { start: string; end: string } | null;
  dailyAverageValue: number;
}

export interface ProjectShareData extends ShareAggregateTotals {
  tab: "projects";
  heroMetrics: ShareHeroMetricItem[];
  chartMetric: ShareMetricKey;
  projectCount: number;
  keyCount: number;
  modelCount: number;
  dateRange: { start: string; end: string } | null;
  /** 当前分享指标下的头部项目排行。 */
  topProjects: ShareRankItem[];
}

export interface KeyShareData extends ShareAggregateTotals {
  tab: "keys";
  heroMetrics: ShareHeroMetricItem[];
  chartMetric: ShareMetricKey;
  keyCount: number;
  modelCount: number;
  dateRange: { start: string; end: string } | null;
  /** 当前分享指标下的头部 Key 排行。 */
  topKeys: ShareRankItem[];
}

export interface TrendsShareData extends ShareAggregateTotals {
  tab: "trends";
  heroMetrics: ShareHeroMetricItem[];
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
 * 从分享卡片数据中读取当前图表或排行实际使用的辅助指标。
 */
export function getShareMetricKey(data: ShareCardData): ShareMetricKey {
  switch (data.tab) {
    case "overview":
      return data.chartMetric;
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
 * 提取分享卡片固定三维 Hero 指标。
 */
function buildShareHeroMetrics(summary: ParseResult["summary"]): ShareHeroMetricItem[] {
  return (HERO_METRIC_KEYS as ShareHeroMetricKey[]).map((metric) => ({
    key: metric,
    value: getMetricValue(summary, metric),
  }));
}

/**
 * 读取汇总对象中对应指标的值。
 */
function getSummaryMetricValue(summary: ParseResult["summary"], metric: ShareMetricKey): number {
  return getMetricValue(summary, metric);
}

/**
 * 读取排行项中对应指标的值。
 */
function getRankMetricValue(item: ShareRankItem, metric: ShareMetricKey): number {
  return getMetricValue(item, metric);
}

/**
 * 判断排行项在任意辅助指标上是否存在有效值。
 */
function hasAnyRankActivity(item: ShareRankItem): boolean {
  return ["tokens", "images", "videoSeconds", "requests", "cost"].some(
    (metric) => getRankMetricValue(item, metric as ShareMetricKey) > 0
  );
}

/**
 * 选择分享卡图表/排行的辅助指标。
 *
 * 默认顺序与主页面保持一致：优先文本 Token，
 * 若该数据集完全没有 Token，再依次回退到图片数量、视频时长、请求数、费用。
 */
function pickShareMetric(source: ParseResult["summary"] | ShareRankItem): ShareMetricKey {
  const metricOrder: ShareMetricKey[] = ["tokens", "images", "videoSeconds", "requests", "cost"];
  return metricOrder.find((metric) => getMetricValue(source, metric) > 0) ?? "tokens";
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
 * 读取汇总的共享统计字段。
 */
function buildAggregateTotals(summary: ParseResult["summary"]): ShareAggregateTotals {
  return {
    totalCost: summary.totalCost,
    totalTokens: summary.totalTokens,
    imageCount: summary.imageCount,
    videoSeconds: summary.videoSeconds,
    totalRequests: summary.totalRequests,
  };
}

/**
 * 压缩排行项字段，避免把内部状态直接暴露给渲染层。
 */
function mapRankItem(item: ShareRankItem): ShareRankItem {
  return {
    name: item.name,
    totalCost: item.totalCost,
    totalTokens: item.totalTokens,
    imageCount: item.imageCount,
    videoSeconds: item.videoSeconds,
    requestCount: item.requestCount,
  };
}

/**
 * 提取总览分享数据。
 */
function extractOverviewData(result: ParseResult): OverviewShareData {
  const { summary, daily } = result;
  const chartMetric = pickShareMetric(summary);
  const days = daily.length > 0
    ? [...new Set(daily.map((d) => d.date))].length
    : 1;

  return {
    tab: "overview",
    heroMetrics: buildShareHeroMetrics(summary),
    chartMetric,
    ...buildAggregateTotals(summary),
    activeKeys: summary.activeKeys,
    modelCount: summary.models.length,
    dateRange: summary.dateRange,
    dailyAverageValue: getSummaryMetricValue(summary, chartMetric) / days,
  };
}

/**
 * 提取项目分享数据。
 */
function extractProjectData(
  result: ParseResult,
  config: ProjectDef[],
  uncategorizedLabel: string
): ProjectShareData {
  const { daily, summary } = result;
  const allKeys = [...new Set(daily.map((d) => d.apiKeyName))];
  const chartMetric = pickShareMetric(summary);

  const map = new Map<string, ShareRankItem & { isUncategorized: boolean }>();

  for (const p of config) {
    map.set(p.name, {
      name: p.name,
      totalCost: 0,
      totalTokens: 0,
      imageCount: 0,
      videoSeconds: 0,
      requestCount: 0,
      isUncategorized: false,
    });
  }
  map.set(UNCATEGORIZED, {
    name: uncategorizedLabel,
    totalCost: 0,
    totalTokens: 0,
    imageCount: 0,
    videoSeconds: 0,
    requestCount: 0,
    isUncategorized: true,
  });

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
    entry.imageCount += d.imageCount;
    entry.videoSeconds += d.videoSeconds;
    entry.totalCost += d.totalCost;
    entry.requestCount += d.requestCount;
  }

  const projects = Array.from(map.values()).filter((p) => !p.isUncategorized || hasAnyRankActivity(p));
  const sortedProjects = sortByMetric(projects, chartMetric);
  const activeCount = projects.filter((p) => !p.isUncategorized).length;

  return {
    tab: "projects",
    heroMetrics: buildShareHeroMetrics(summary),
    chartMetric,
    ...buildAggregateTotals(summary),
    projectCount: activeCount,
    keyCount: allKeys.length,
    modelCount: summary.models.length,
    dateRange: summary.dateRange,
    topProjects: selectTopRankItems(sortedProjects, chartMetric, 8).map(mapRankItem),
  };
}

/**
 * 提取 Key 分享数据。
 */
function extractKeyData(result: ParseResult): KeyShareData {
  const { keys, summary } = result;
  const chartMetric = pickShareMetric(summary);
  const sortedKeys = sortByMetric(
    keys.map((k) => ({
      name: k.apiKeyName,
      totalCost: k.totalCost,
      totalTokens: k.totalTokens,
      imageCount: k.imageCount,
      videoSeconds: k.videoSeconds,
      requestCount: k.requestCount,
    })),
    chartMetric
  );

  return {
    tab: "keys",
    heroMetrics: buildShareHeroMetrics(summary),
    chartMetric,
    ...buildAggregateTotals(summary),
    keyCount: keys.length,
    modelCount: summary.models.length,
    dateRange: summary.dateRange,
    topKeys: selectTopRankItems(sortedKeys, chartMetric, 8).map(mapRankItem),
  };
}

/**
 * 提取趋势分享数据。
 */
function extractTrendsData(result: ParseResult): TrendsShareData {
  const { daily, summary } = result;
  const metric = pickShareMetric(summary);
  const dateMap = new Map<string, number>();

  for (const d of daily) {
    dateMap.set(d.date, (dateMap.get(d.date) ?? 0) + getMetricValue(d, metric));
  }

  const dailyValues = [...dateMap.values()];
  const peakValue = dailyValues.length > 0 ? Math.max(...dailyValues) : 0;
  const lowestValue = dailyValues.length > 0 ? Math.min(...dailyValues) : 0;
  const days = dailyValues.length || 1;

  return {
    tab: "trends",
    heroMetrics: buildShareHeroMetrics(summary),
    ...buildAggregateTotals(summary),
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

/**
 * 按当前 tab 提取分享卡片数据。
 */
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
