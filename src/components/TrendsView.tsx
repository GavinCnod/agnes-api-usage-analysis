"use client";

/**
 * 文件说明：
 * 趋势视图模块，负责在固定三维 Hero 之下展示归一化的三维合并趋势图。
 */

import { useMemo } from "react";
import ReactECharts from "echarts-for-react";
import { useData } from "@/lib/DataContext";
import { useTranslation } from "@/i18n";
import { useTheme } from "@/lib/ThemeContext";
import MetricHero from "@/components/MetricHero";
import {
  buildCoreComparisonMetricItems,
  buildHeroMetricItems,
  formatMetricValue,
  getMetricValue,
} from "@/lib/dashboardMetrics";

/** 图表单点数据。 */
interface ChartDatum {
  value: number;
  rawValue: number;
  formattedValue: string;
}

/** ECharts tooltip 参数的最小结构。 */
interface TooltipParam {
  axisValue?: string;
  axisValueLabel?: string;
  seriesName: string;
  marker?: string;
  data?: ChartDatum;
}

/**
 * 将同一指标序列归一化到 0-100，便于在一张趋势图内比较变化方向。
 */
function normalizeValues(values: number[]): number[] {
  const maxValue = Math.max(...values, 0);
  if (maxValue <= 0) {
    return values.map(() => 0);
  }

  return values.map((value) => Number(((value / maxValue) * 100).toFixed(2)));
}

/**
 * 构造轴触发 tooltip，优先展示悬浮位置的原始真实数值。
 */
function formatAxisTooltip(params: unknown): string {
  const items = (Array.isArray(params) ? params : [params]) as TooltipParam[];
  if (items.length === 0) return "";

  const title = items[0]?.axisValueLabel ?? items[0]?.axisValue ?? "";
  const lines = items.map((item) => `${item.marker ?? ""}${item.seriesName}: ${item.data?.formattedValue ?? "-"}`);
  return [title, ...lines].join("<br/>");
}

/**
 * 趋势视图组件。
 *
 * Hero 固定展示文本 Token、图片数量、视频时长，
 * 下方趋势图将三维核心指标归一化叠加，减少交互切换并保留 hover 真实数值。
 */
export default function TrendsView() {
  const { filteredResult: result } = useData();
  const { locale, t } = useTranslation();
  const { theme } = useTheme();
  const daily = result?.daily ?? [];
  const summary = result?.summary;

  const dates = [...new Set(daily.map((item) => item.date))].sort();
  const isDark = theme === "dark";
  const textColor = isDark ? "#98989D" : "#86868B";
  const gridColor = isDark ? "#2C2C2E" : "#E5E5EA";
  const palette = isDark
    ? {
        tokens: "#F5F5F7",
        images: "#C7C7CC",
        videoSeconds: "#8E8E93",
      }
    : {
        tokens: "#1D1D1F",
        images: "#636366",
        videoSeconds: "#8E8E93",
      };
  const coreMetricItems = useMemo(() => buildCoreComparisonMetricItems(t), [t]);
  const heroItems = useMemo(
    () => (summary ? buildHeroMetricItems(summary, locale, t) : []),
    [locale, summary, t]
  );

  const option = useMemo(() => {
    const totalsByDate = new Map<
      string,
      {
        tokens: number;
        images: number;
        videoSeconds: number;
      }
    >();

    for (const item of daily) {
      const current = totalsByDate.get(item.date) ?? { tokens: 0, images: 0, videoSeconds: 0 };
      current.tokens += getMetricValue(item, "tokens");
      current.images += getMetricValue(item, "images");
      current.videoSeconds += getMetricValue(item, "videoSeconds");
      totalsByDate.set(item.date, current);
    }

    return {
      tooltip: {
        trigger: "axis" as const,
        formatter: formatAxisTooltip,
      },
      legend: {
        top: 0,
        textStyle: { fontSize: 11, color: textColor },
      },
      grid: { top: 36, right: 16, bottom: 28, left: 52 },
      xAxis: {
        type: "category" as const,
        data: dates,
        axisLabel: { fontSize: 10, color: textColor, rotate: dates.length > 15 ? 45 : 0 },
        axisLine: { lineStyle: { color: gridColor } },
      },
      yAxis: {
        type: "value" as const,
        max: 100,
        axisLabel: {
          fontSize: 10,
          color: textColor,
          formatter: (value: number) => `${value}%`,
        },
        splitLine: { lineStyle: { color: gridColor } },
      },
      dataZoom: dates.length > 30 ? [{ type: "inside" as const }] : undefined,
      series: coreMetricItems.map((metricItem) => {
        const rawValues = dates.map(
          (date) => totalsByDate.get(date)?.[metricItem.key as "tokens" | "images" | "videoSeconds"] ?? 0
        );
        const normalizedValues = normalizeValues(rawValues);

        return {
          name: metricItem.label,
          type: "line" as const,
          data: normalizedValues.map((value, index) => ({
            value,
            rawValue: rawValues[index],
            formattedValue: formatMetricValue(metricItem.key, rawValues[index], locale),
          })),
          smooth: true,
          showSymbol: dates.length <= 40,
          symbolSize: 6,
          lineStyle: { color: palette[metricItem.key as "tokens" | "images" | "videoSeconds"], width: 2 },
          itemStyle: { color: palette[metricItem.key as "tokens" | "images" | "videoSeconds"] },
          areaStyle: {
            color: {
              type: "linear" as const,
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                {
                  offset: 0,
                  color:
                    metricItem.key === "tokens"
                      ? isDark
                        ? "rgba(245,245,247,0.10)"
                        : "rgba(29,29,31,0.06)"
                      : metricItem.key === "images"
                        ? isDark
                          ? "rgba(199,199,204,0.10)"
                          : "rgba(99,99,102,0.06)"
                        : isDark
                          ? "rgba(142,142,147,0.10)"
                          : "rgba(142,142,147,0.06)",
                },
                { offset: 1, color: "transparent" },
              ],
            },
          },
        };
      }),
    };
  }, [coreMetricItems, daily, dates, gridColor, isDark, locale, palette, textColor]);

  if (!result) return null;

  if (daily.length === 0 || !summary) {
    return (
      <div className="py-16 text-center">
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          {t.empty?.trends ?? "Not enough data to show trends. Upload more months of CSVs."}
        </p>
      </div>
    );
  }

  return (
    <div>
      <MetricHero
        items={heroItems}
        subtitle={t.trends.heroSubtitle.replace("{days}", String(dates.length))}
        sideNote={t.trends.normalizedHint}
      />

      <div aria-label={t.trends.coreMetricsTrend} role="img">
        <h3 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.24em]" style={{ color: "var(--text-secondary)" }}>
          {t.trends.coreMetricsTrend}
        </h3>
        <ReactECharts option={option} style={{ height: 360 }} />
      </div>
    </div>
  );
}
