"use client";

/**
 * 社交媒体分享卡片组件。
 *
 * 使用与主页面一致的多模态展示口径：
 * - 左侧固定展示文本 Token、图片数量、视频时长三维 Hero
 * - 右侧图表使用统一的辅助指标选择结果
 * - 底部保留时间范围、品牌与二维码信息
 */

import { useMemo, useCallback, useRef } from "react";
import ReactECharts from "echarts-for-react";
import type { ParseResult, DailyUsage } from "@/lib/types";
import type { Locale } from "@/i18n";
import type { ShareCardData, ShareMetricKey } from "@/lib/shareCardData";
import { formatMetricValue, getMetricValue } from "@/lib/dashboardMetrics";

// ============================================================================
// 常量
// ============================================================================

export const CARD_W = 1200;
export const CARD_H = 630;

// ============================================================================
// Props
// ============================================================================

export interface ShareCardStrings {
  tabLabel: string;
  appName: string;
  fromLabel: string;
  textTokensLabel: string;
  imagesLabel: string;
  videoSecondsLabel: string;
  requestsLabel: string;
  costLabel: string;
  activeKeysLabel: string;
  modelsLabel: string;
  projectsLabel: string;
  keysLabel: string;
  chartMetricLabel: string;
  peakLabel: string;
  lowestLabel: string;
  dailyAverageLabel: string;
  generatedBy: string;
  scanToVisit: string;
}

export interface ShareCardProps {
  /** 完整解析结果（用于图表数据） */
  result: ParseResult;
  /** 提取好的分享数据 */
  data: ShareCardData;
  /** 用户/团队名称 */
  fromName: string;
  /** 可选自定义文案 */
  customMessage?: string;
  /** 当前主题 */
  theme: "light" | "dark";
  /** 当前语言 */
  locale: Locale;
  /** 二维码 Data URL */
  qrDataUrl: string;
  /** 翻译字符串 */
  s: ShareCardStrings;
  /** 所有图表渲染完毕回调 */
  onChartsReady?: () => void;
}

// ============================================================================
// 主题色
// ============================================================================

function themeColors(isDark: boolean) {
  return {
    bg: isDark ? "#000000" : "#F5F5F7",
    bgSurface: isDark ? "#1C1C1E" : "#FFFFFF",
    textPrimary: isDark ? "#F5F5F7" : "#1D1D1F",
    textSecondary: isDark ? "#98989D" : "#86868B",
    textTertiary: isDark ? "#636366" : "#98989D",
    border: isDark ? "#38383A" : "#E5E5EA",
    positive: isDark ? "#34D399" : "#059669",
    chartGrid: isDark ? "#2C2C2E" : "#E5E5EA",
    chartText: isDark ? "#98989D" : "#86868B",
    chartLine: isDark ? "#F5F5F7" : "#1D1D1F",
    chartArea: isDark ? "rgba(245,245,247,0.06)" : "rgba(29,29,31,0.03)",
    barColor: isDark ? "#F5F5F7" : "#1D1D1F",
  };
}

// ============================================================================
// 格式化
// ============================================================================

/** 用 Canvas 精确测量文本宽度，用于 JS 侧截断（避免 html2canvas CSS 截断问题） */
function truncateText(text: string, maxWidth: number, fontSize: number, maxLines: number): string {
  if (typeof document === "undefined") return text;
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return text;
  ctx.font = `italic ${fontSize}px "Hubot Sans", -apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", sans-serif`;

  let result = "";
  let currentLine = "";
  let lines = 0;

  for (const char of text) {
    const testLine = currentLine + char;
    if (ctx.measureText(testLine).width > maxWidth && currentLine.length > 0) {
      lines++;
      if (lines >= maxLines) {
        // 已达最大行数：给当前行加省略号
        while (ctx.measureText(currentLine + "...").width > maxWidth && currentLine.length > 0) {
          currentLine = currentLine.slice(0, -1);
        }
        return result + currentLine + "...";
      }
      result += currentLine + "\n";
      currentLine = char;
    } else {
      currentLine += char;
    }
  }
  return result + currentLine;
}

function fmtCost(yuan: number, locale: Locale): string {
  if (locale === "zh" && yuan >= 10000) return `¥${(yuan / 10000).toFixed(2)}万`;
  if (locale === "en" && yuan >= 10000) return `¥${(yuan / 1000).toFixed(2)}K`;
  return `¥${yuan.toFixed(2)}`;
}

function fmtRange(start: string, end: string): string {
  return `${start}  —  ${end}`;
}

/**
 * 格式化整数统计值。
 */
function fmtCount(value: number, locale: Locale): string {
  return Math.round(value).toLocaleString(locale);
}

/**
 * 读取分享指标对应的文案标签。
 */
function getMetricLabel(metric: ShareMetricKey, s: ShareCardStrings): string {
  switch (metric) {
    case "tokens":
      return s.textTokensLabel;
    case "images":
      return s.imagesLabel;
    case "videoSeconds":
      return s.videoSecondsLabel;
    case "requests":
      return s.requestsLabel;
    case "cost":
      return s.costLabel;
  }
}

/**
 * 读取排行项中对应指标的值。
 */
function getRankMetricValue(
  item: { totalCost: number; totalTokens: number; imageCount: number; videoSeconds: number; requestCount: number },
  metric: ShareMetricKey
): number {
  return getMetricValue(item, metric);
}

/**
 * 将排行数据转换为图表可直接消费的结构。
 */
function buildRankChartItems(
  items: { name: string; totalCost: number; totalTokens: number; imageCount: number; videoSeconds: number; requestCount: number }[],
  metric: ShareMetricKey
): { name: string; value: number }[] {
  return items
    .map((item) => ({ name: item.name, value: getRankMetricValue(item, metric) }))
    .filter((item) => item.value > 0);
}

/**
 * 生成横轴标签的格式化函数。
 */
function getChartAxisFormatter(metric: ShareMetricKey, locale: Locale) {
  return (v: number) => formatMetricValue(metric, v, locale);
}

// ============================================================================
// ECharts 配置生成器
// ============================================================================

/** Overview / Trends 每日指标柱状图或折线图 */
function buildDailyMetricChart(
  daily: DailyUsage[],
  type: "bar" | "line",
  c: ReturnType<typeof themeColors>,
  metric: ShareMetricKey,
  locale: Locale,
) {
  const dates = [...new Set(daily.map((d) => d.date))].sort();
  const byDate = new Map<string, number>();
  for (const d of daily) {
    byDate.set(d.date, (byDate.get(d.date) ?? 0) + getMetricValue(d, metric));
  }

  return {
    grid: { top: 10, right: 12, bottom: 28, left: 44 },
    xAxis: {
      type: "category" as const,
      data: dates,
      axisLabel: { fontSize: 9, color: c.chartText, rotate: dates.length > 20 ? 45 : 0 },
      axisLine: { lineStyle: { color: c.chartGrid } },
    },
    yAxis: {
      type: "value" as const,
      axisLabel: { fontSize: 9, color: c.chartText, formatter: getChartAxisFormatter(metric, locale) },
      splitLine: { lineStyle: { color: c.chartGrid } },
    },
    series: [{
      type,
      data: dates.map((d) => +(byDate.get(d) ?? 0).toFixed(4)),
      ...(type === "bar"
        ? { itemStyle: { color: c.barColor, borderRadius: [3, 3, 0, 0] } }
        : {
            smooth: true,
            lineStyle: { color: c.chartLine, width: 2 },
            itemStyle: { color: c.chartLine },
            areaStyle: { color: c.chartArea },
          }),
    }],
  };
}

/** Keys / Projects 横向柱状图 */
function buildHorizontalBarChart(
  items: { name: string; value: number }[],
  valueFormatter: (v: number) => string,
  c: ReturnType<typeof themeColors>,
) {
  const data = [...items].reverse(); // ECharts 从下往上渲染
  return {
    grid: { top: 4, right: 16, bottom: 4, left: 100, containLabel: false },
    xAxis: {
      type: "value" as const,
      axisLabel: { fontSize: 9, color: c.chartText, formatter: valueFormatter },
      splitLine: { lineStyle: { color: c.chartGrid } },
    },
    yAxis: {
      type: "category" as const,
      data: data.map((d) => d.name),
      axisLabel: { fontSize: 10, color: c.textPrimary, width: 90, overflow: "truncate" as const },
      axisLine: { show: false },
      axisTick: { show: false },
    },
    series: [{
      type: "bar",
      data: data.map((d) => d.value),
      itemStyle: { color: c.barColor, borderRadius: [0, 3, 3, 0] },
      barMaxWidth: 20,
    }],
  };
}

// ============================================================================
// 主组件
// ============================================================================

export default function ShareCard({
  result, data, fromName, customMessage, theme, locale, qrDataUrl, s, onChartsReady,
}: ShareCardProps) {
  const isDark = theme === "dark";
  const c = themeColors(isDark);
  const chartMetric = data.tab === "trends" ? data.metric : data.chartMetric;

  // 图表就绪计数
  const readyCountRef = useRef(0);
  const expectedCharts = 1; // 每个卡片 1 个图表
  const handleChartReady = useCallback(() => {
    readyCountRef.current += 1;
    if (readyCountRef.current >= expectedCharts) {
      onChartsReady?.();
    }
  }, [onChartsReady]);

  const dateRangeStr = (() => {
    if ("dateRange" in data && data.dateRange)
      return fmtRange(data.dateRange.start, data.dateRange.end);
    return null;
  })();

  // 截断自定义文案（JS 侧截断，末尾加空行避免 html2canvas 裁边）
  const truncatedMessage = customMessage ? truncateText(`\u201c${customMessage}\u201d`, 420, 16, 2) + "\n" : null;
  const chartOption = useMemo(() => {
    switch (data.tab) {
      case "overview":
        return buildDailyMetricChart(result.daily, "bar", c, data.chartMetric, locale);
      case "trends":
        return buildDailyMetricChart(result.daily, "line", c, data.metric, locale);
      case "projects":
        return buildHorizontalBarChart(
          buildRankChartItems(data.topProjects, data.chartMetric),
          getChartAxisFormatter(data.chartMetric, locale),
          c,
        );
      case "keys":
        return buildHorizontalBarChart(
          buildRankChartItems(data.topKeys, data.chartMetric),
          getChartAxisFormatter(data.chartMetric, locale),
          c,
        );
    }
  }, [data, result.daily, c, locale]);

  /**
   * 构建左侧三维 Hero 的展示项。
   */
  const primaryMetricItems = useMemo(() => {
    return data.heroMetrics.map((item) => ({
      key: item.key,
      label: getMetricLabel(item.key, s),
      value: item.value,
      formattedValue: formatMetricValue(item.key, item.value, locale),
    }));
  }, [data.heroMetrics, locale, s]);

  /**
   * 构建辅助 KPI 网格项。
   */
  const kpiItems: { value: string; label: string }[] = (() => {
    switch (data.tab) {
      case "overview":
        return [
          { value: fmtCount(data.totalRequests, locale), label: s.requestsLabel },
          { value: fmtCost(data.totalCost, locale), label: s.costLabel },
          { value: fmtCount(data.activeKeys, locale), label: s.activeKeysLabel },
          { value: fmtCount(data.modelCount, locale), label: s.modelsLabel },
        ];
      case "projects":
        return [
          { value: fmtCount(data.projectCount, locale), label: s.projectsLabel },
          { value: fmtCount(data.keyCount, locale), label: s.keysLabel },
          { value: fmtCount(data.totalRequests, locale), label: s.requestsLabel },
          { value: fmtCost(data.totalCost, locale), label: s.costLabel },
        ];
      case "keys":
        return [
          { value: fmtCount(data.keyCount, locale), label: s.keysLabel },
          { value: fmtCount(data.modelCount, locale), label: s.modelsLabel },
          { value: fmtCount(data.totalRequests, locale), label: s.requestsLabel },
          { value: fmtCost(data.totalCost, locale), label: s.costLabel },
        ];
      case "trends":
        return [
          { value: formatMetricValue(data.metric, data.totalValue, locale), label: getMetricLabel(data.metric, s) },
          { value: formatMetricValue(data.metric, data.peakValue, locale), label: s.peakLabel },
          { value: formatMetricValue(data.metric, data.lowestValue, locale), label: s.lowestLabel },
          { value: formatMetricValue(data.metric, data.dailyAverage, locale), label: s.dailyAverageLabel },
        ];
    }
  })();

  /**
   * 渲染左侧主展示与辅助 KPI。
   */
  const renderHero = () => (
    <div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr",
          gap: 14,
          paddingBottom: 20,
          borderBottom: `1px solid ${c.border}`,
        }}
      >
        {primaryMetricItems.map((item) => (
          <div
            key={item.key}
            style={{
              paddingBottom: 6,
              borderBottom: `1px solid ${c.border}`,
            }}
          >
            <div
              style={{
                fontSize: 36,
                fontWeight: 700,
                lineHeight: 1,
                letterSpacing: "-0.04em",
                color: item.value === 0 ? c.textSecondary : c.textPrimary,
              }}
            >
              {item.formattedValue}
            </div>
            <div style={{ fontSize: 11, fontWeight: 600, color: c.textSecondary, marginTop: 6, letterSpacing: "0.08em", textTransform: "uppercase" }}>
              {item.label}
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 18, fontSize: 10, fontWeight: 600, color: c.textTertiary, letterSpacing: "0.08em", textTransform: "uppercase" }}>
        {s.chartMetricLabel}: {getMetricLabel(chartMetric, s)}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 20px", marginTop: 14 }}>
        {kpiItems.map((item, i) => (
          <div key={i} style={{ minWidth: 0 }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: c.textPrimary, letterSpacing: "-0.02em", lineHeight: 1.2 }}>
              {item.value}
            </div>
            <div style={{ fontSize: 10, fontWeight: 500, color: c.textTertiary, marginTop: 2, letterSpacing: "0.03em", textTransform: "uppercase" }}>
              {item.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div
      className="share-card-root"
      style={{
        width: CARD_W,
        height: CARD_H,
        background: c.bg,
        fontFamily: '"Hubot Sans", -apple-system, BlinkMacSystemFont, "SF Pro Text", "PingFang SC", "Microsoft YaHei", sans-serif',
        padding: "40px 52px",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        position: "relative",
      }}
    >
      {/* ================================================================ */}
      {/* 第一行：Header */}
      {/* ================================================================ */}
      <div style={{ marginBottom: 16 }}>
        {/* 第一行：App 名称 · Tab 标签（左） + 自定义文案（右上角） */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: c.textPrimary, letterSpacing: "-0.02em" }}>
            {s.appName}
            <span style={{ fontWeight: 500, color: c.textTertiary, marginLeft: 8 }}>
              &middot; {s.tabLabel}
            </span>
          </div>
          {truncatedMessage && (
            <span style={{
              fontSize: 16, fontStyle: "italic", color: c.textTertiary,
              lineHeight: 1.4, maxWidth: 420, textAlign: "right",
              whiteSpace: "pre-line",
            }}>
              {truncatedMessage}
            </span>
          )}
        </div>

        {/* 第二行：From XXX — 大号字体 */}
        <div style={{ fontSize: 42, fontWeight: 700, color: c.textPrimary, letterSpacing: "-0.03em", lineHeight: 1.1, marginTop: 4 }}>
          {s.fromLabel} {fromName}
        </div>
      </div>

      {/* ================================================================ */}
      {/* 第二行：Hero/KPI（左）+ 图表（右） */}
      {/* ================================================================ */}
      <div style={{ display: "flex", gap: 40, flex: 1, alignItems: "center", minHeight: 0 }}>
        {/* 左侧：Hero + KPI */}
        <div style={{ width: 336, flexShrink: 0 }}>
          {renderHero()}
        </div>

        {/* 右侧：图表 */}
        <div style={{ flex: 1, height: "100%", minWidth: 0 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: c.textSecondary, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 10 }}>
            {s.chartMetricLabel}: {getMetricLabel(chartMetric, s)}
          </div>
          {chartOption && (
            <ReactECharts
              option={chartOption}
              style={{ width: "100%", height: "calc(100% - 24px)" }}
              opts={{ renderer: "canvas" }}
              onChartReady={() => {
                // 延迟一小段时间确保渲染完成
                setTimeout(() => handleChartReady(), 200);
              }}
            />
          )}
        </div>
      </div>

      {/* ================================================================ */}
      {/* 第三行：Footer */}
      {/* ================================================================ */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 20 }}>
        {/* 日期范围 */}
        <div>
          {dateRangeStr && (
            <span style={{ fontSize: 12, color: c.textTertiary, letterSpacing: "0.02em" }}>
              {dateRangeStr}
            </span>
          )}
        </div>

        {/* 水印文字 + Logo + QR */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {/* 水印文字 */}
          <span style={{ fontSize: 9, color: c.textTertiary, opacity: 0.4, textAlign: "right", lineHeight: 1.4 }}>
            {s.generatedBy}<br />{s.scanToVisit}
          </span>

          {/* 应用 Logo */}
          <img
            src="/agnes-usage-logo.png"
            alt="Logo"
            width={44}
            height={44}
            style={{ borderRadius: 6, display: "block" }}
          />

          {/* 二维码 */}
          <img
            src={qrDataUrl}
            alt="QR"
            width={44}
            height={44}
            style={{ display: "block", borderRadius: 4 }}
          />
        </div>
      </div>
    </div>
  );
}
