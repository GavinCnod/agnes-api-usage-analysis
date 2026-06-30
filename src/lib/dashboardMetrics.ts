/**
 * 仪表盘多模态指标辅助模块。
 *
 * 统一管理三维 Hero、趋势切换、表格排序和进度条基准使用的指标定义，
 * 确保 Token、图片数量、视频时长、请求数、费用在各视图中的语义一致。
 */

import type { TranslationKeys } from "@/i18n/translations";
import type { Locale } from "@/i18n";
import { formatCompactNumber, formatCost, formatCostFull, formatCountFull, formatTokens, formatTokensFull } from "@/lib/format";

/** 可参与对比与排序的仪表盘指标。 */
export type DashboardMetricKey = "tokens" | "images" | "videoSeconds" | "requests" | "cost";

/** Hero 固定展示的三维主指标。 */
export const HERO_METRIC_KEYS: DashboardMetricKey[] = ["tokens", "images", "videoSeconds"];

/** 表格与图表支持切换的全部比较指标。 */
export const COMPARISON_METRIC_KEYS: DashboardMetricKey[] = [
  "tokens",
  "images",
  "videoSeconds",
  "requests",
  "cost",
];

/** 可被通用指标访问器消费的最小字段集合。 */
export interface MetricSource {
  totalTokens: number;
  imageCount: number;
  videoSeconds: number;
  totalCost: number;
  requestCount?: number;
  totalRequests?: number;
}

/** 已格式化的展示指标。 */
export interface MetricDisplayItem {
  key: DashboardMetricKey;
  label: string;
  value: number;
  formattedValue: string;
}

/**
 * 读取对象上的指定指标值。
 */
export function getMetricValue(source: MetricSource, metric: DashboardMetricKey): number {
  switch (metric) {
    case "tokens":
      return source.totalTokens;
    case "images":
      return source.imageCount;
    case "videoSeconds":
      return source.videoSeconds;
    case "requests":
      return source.totalRequests ?? source.requestCount ?? 0;
    case "cost":
      return source.totalCost;
  }
}

/**
 * 返回指标的双语展示名称。
 */
export function getMetricLabel(metric: DashboardMetricKey, t: TranslationKeys): string {
  switch (metric) {
    case "tokens":
      return t.metrics.textTokens;
    case "images":
      return t.metrics.images;
    case "videoSeconds":
      return t.metrics.videoSeconds;
    case "requests":
      return t.metrics.requests;
    case "cost":
      return t.metrics.cost;
  }
}

/**
 * 统一格式化指标值，保证 Hero、图表和表格口径一致。
 */
export function formatMetricValue(
  metric: DashboardMetricKey,
  value: number,
  locale: Locale,
  mode: "compact" | "full" = "compact"
): string {
  if (metric === "cost") {
    return mode === "full" ? formatCostFull(value) : formatCost(value, locale);
  }

  if (metric === "tokens") {
    return mode === "full" ? formatTokensFull(value, locale) : formatTokens(value, locale);
  }

  return mode === "full" ? formatCountFull(value, locale) : formatCompactNumber(value, locale);
}

/**
 * 构造多模态 Hero 所需的三维指标列表。
 */
export function buildHeroMetricItems(
  source: MetricSource,
  locale: Locale,
  t: TranslationKeys
): MetricDisplayItem[] {
  return HERO_METRIC_KEYS.map((metric) => {
    const value = getMetricValue(source, metric);
    return {
      key: metric,
      label: getMetricLabel(metric, t),
      value,
      formattedValue: formatMetricValue(metric, value, locale),
    };
  });
}

/**
 * 构造趋势切换或排序按钮可用的完整指标列表。
 */
export function buildComparisonMetricItems(t: TranslationKeys): Array<{ key: DashboardMetricKey; label: string }> {
  return COMPARISON_METRIC_KEYS.map((metric) => ({
    key: metric,
    label: getMetricLabel(metric, t),
  }));
}

/**
 * 对支持多模态字段的数据执行稳定降序排序。
 */
export function sortByMetric<T extends MetricSource & { name?: string; apiKeyName?: string; isUncategorized?: boolean }>(
  items: T[],
  metric: DashboardMetricKey
): T[] {
  return [...items].sort((left, right) => {
    const uncategorizedDiff = Number(Boolean(left.isUncategorized)) - Number(Boolean(right.isUncategorized));
    if (uncategorizedDiff !== 0) return uncategorizedDiff;

    const primaryDiff = getMetricValue(right, metric) - getMetricValue(left, metric);
    if (primaryDiff !== 0) return primaryDiff;

    for (const fallbackMetric of COMPARISON_METRIC_KEYS) {
      if (fallbackMetric === metric) continue;
      const fallbackDiff = getMetricValue(right, fallbackMetric) - getMetricValue(left, fallbackMetric);
      if (fallbackDiff !== 0) return fallbackDiff;
    }

    const leftName = left.apiKeyName ?? left.name ?? "";
    const rightName = right.apiKeyName ?? right.name ?? "";
    return leftName.localeCompare(rightName);
  });
}
