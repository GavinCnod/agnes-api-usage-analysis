/**
 * 数值格式化工具模块。
 *
 * 统一提供费用、Token、图片数量、视频时长等指标的紧凑格式与完整格式，
 * 供多模态 Hero、图表、表格和分享卡复用。
 */

import type { Locale } from "@/i18n";

/**
 * 以紧凑形式格式化通用数字。
 *
 * 中文优先使用“万 / 亿”，英文使用“K / M”，
 * 适合 Hero、标签和图表坐标轴等有限空间场景。
 */
export function formatCompactNumber(value: number, locale?: Locale): string {
  if (locale === "zh") {
    if (value >= 100_000_000) {
      return `${(value / 100_000_000).toFixed(3)}亿`;
    }
    if (value >= 10_000) {
      return `${(value / 10_000).toFixed(1)}万`;
    }
  }

  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`;
  return String(value);
}

/**
 * Format a cost value in CNY.
 * EN: ¥12,345.67  or ¥12.35K
 * ZH: ¥12,345.67  or ¥1.23万
 */
export function formatCost(yuan: number, locale: Locale): string {
  if (locale === "zh" && yuan >= 10000) {
    return `¥${(yuan / 10000).toFixed(2)}万`;
  }
  if (locale === "en" && yuan >= 10000) {
    return `¥${(yuan / 1000).toFixed(2)}K`;
  }
  return `¥${yuan.toFixed(2)}`;
}

/**
 * Format a token count.
 * EN: 1.2M / 1K / 123
 * ZH: 1.234亿 / 1.2万 / 123
 */
export function formatTokens(n: number, locale?: Locale): string {
  return formatCompactNumber(n, locale);
}

/**
 * Format a ratio (0–1) as a percentage string.
 */
export function formatPercent(n: number): string {
  return `${(n * 100).toFixed(1)}%`;
}

/**
 * Format a cost as a full number with no suffix abbreviation.
 * Always 2 decimals, comma-separated thousands.
 */
export function formatCostFull(yuan: number): string {
  return `¥${yuan.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * 以完整数字格式输出通用数量，不使用缩写。
 */
export function formatCountFull(value: number, locale?: Locale): string {
  return value.toLocaleString(locale === "zh" ? "zh-CN" : "en-US");
}

/**
 * Format a token count as a full number with no suffix abbreviation.
 * Comma-separated thousands.
 */
export function formatTokensFull(n: number, locale?: Locale): string {
  return formatCountFull(n, locale);
}
