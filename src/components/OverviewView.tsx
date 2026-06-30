"use client";

/**
 * 文件说明：
 * 总览视图模块，负责以三维 Hero + 三维归一化合并图表的方式展示 Agnes 多模态用量概览。
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
 * 将同一指标序列归一化到 0-100，便于跨量纲并排比较。
 */
function normalizeValues(values: number[]): number[] {
  const maxValue = Math.max(...values, 0);
  if (maxValue <= 0) {
    return values.map(() => 0);
  }

  return values.map((value) => Number(((value / maxValue) * 100).toFixed(2)));
}

/**
 * 构造轴触发 tooltip，展示真实数值而不是归一化百分比。
 */
function formatAxisTooltip(params: unknown): string {
  const items = (Array.isArray(params) ? params : [params]) as TooltipParam[];
  if (items.length === 0) return "";

  const title = items[0]?.axisValueLabel ?? items[0]?.axisValue ?? "";
  const lines = items.map((item) => `${item.marker ?? ""}${item.seriesName}: ${item.data?.formattedValue ?? "-"}`);
  return [title, ...lines].join("<br/>");
}

/**
 * 生成总览视图。
 *
 * 顶部固定展示文本 Token、图片数量、视频时长三个主指标，
 * 下方图表改为三维归一化合并视图，减少切换操作并通过悬浮提供真实数值。
 */
export default function OverviewView() {
  const { filteredResult: result } = useData();
  const { locale, t } = useTranslation();
  const { theme } = useTheme();
  const daily = result?.daily ?? [];
  const keys = result?.keys ?? [];
  const summary = result?.summary;

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

  const dailyOption = useMemo(() => {
    const dates = [...new Set(daily.map((item) => item.date))].sort();
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

    const rawValuesByMetric = {
      tokens: dates.map((date) => totalsByDate.get(date)?.tokens ?? 0),
      images: dates.map((date) => totalsByDate.get(date)?.images ?? 0),
      videoSeconds: dates.map((date) => totalsByDate.get(date)?.videoSeconds ?? 0),
    };

    return {
      tooltip: {
        trigger: "axis" as const,
        axisPointer: { type: "shadow" as const },
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
        const rawValues = rawValuesByMetric[metricItem.key as "tokens" | "images" | "videoSeconds"];
        const normalizedValues = normalizeValues(rawValues);

        return {
          name: metricItem.label,
          type: "bar" as const,
          barMaxWidth: 18,
          itemStyle: {
            color: palette[metricItem.key as "tokens" | "images" | "videoSeconds"],
            borderRadius: [4, 4, 0, 0] as [number, number, number, number],
          },
          data: normalizedValues.map((value, index) => ({
            value,
            rawValue: rawValues[index],
            formattedValue: formatMetricValue(metricItem.key, rawValues[index], locale),
          })),
        };
      }),
    };
  }, [coreMetricItems, daily, gridColor, locale, palette, textColor]);

  const distributionOption = useMemo(() => {
    const rankedRows = keys
      .map((item) => ({
        name: item.apiKeyName,
        tokens: getMetricValue(item, "tokens"),
        images: getMetricValue(item, "images"),
        videoSeconds: getMetricValue(item, "videoSeconds"),
      }))
      .filter((item) => item.tokens > 0 || item.images > 0 || item.videoSeconds > 0);

    const maxValues = {
      tokens: Math.max(...rankedRows.map((item) => item.tokens), 0),
      images: Math.max(...rankedRows.map((item) => item.images), 0),
      videoSeconds: Math.max(...rankedRows.map((item) => item.videoSeconds), 0),
    };

    const topRows = rankedRows
      .map((item) => {
        const normalized = {
          tokens: maxValues.tokens > 0 ? Number(((item.tokens / maxValues.tokens) * 100).toFixed(2)) : 0,
          images: maxValues.images > 0 ? Number(((item.images / maxValues.images) * 100).toFixed(2)) : 0,
          videoSeconds:
            maxValues.videoSeconds > 0 ? Number(((item.videoSeconds / maxValues.videoSeconds) * 100).toFixed(2)) : 0,
        };

        return {
          ...item,
          normalized,
          score: normalized.tokens + normalized.images + normalized.videoSeconds,
        };
      })
      .sort((left, right) => right.score - left.score)
      .slice(0, 8);

    return {
      tooltip: {
        trigger: "axis" as const,
        axisPointer: { type: "shadow" as const },
        formatter: formatAxisTooltip,
      },
      legend: {
        top: 0,
        textStyle: { fontSize: 11, color: textColor },
      },
      grid: { top: 36, right: 20, bottom: 8, left: 120 },
      xAxis: {
        type: "value" as const,
        max: 100,
        axisLabel: {
          fontSize: 10,
          color: textColor,
          formatter: (value: number) => `${value}%`,
        },
        splitLine: { lineStyle: { color: gridColor } },
      },
      yAxis: {
        type: "category" as const,
        inverse: true,
        data: topRows.map((item) => item.name),
        axisLabel: { fontSize: 10, color: textColor },
        axisLine: { show: false },
        axisTick: { show: false },
      },
      series: coreMetricItems.map((metricItem) => ({
        name: metricItem.label,
        type: "bar" as const,
        barMaxWidth: 12,
        itemStyle: {
          color: palette[metricItem.key as "tokens" | "images" | "videoSeconds"],
          borderRadius: [0, 4, 4, 0] as [number, number, number, number],
        },
        data: topRows.map((item) => ({
          value: item.normalized[metricItem.key as "tokens" | "images" | "videoSeconds"],
          rawValue: item[metricItem.key as "tokens" | "images" | "videoSeconds"],
          formattedValue: formatMetricValue(
            metricItem.key,
            item[metricItem.key as "tokens" | "images" | "videoSeconds"],
            locale
          ),
        })),
      })),
    };
  }, [coreMetricItems, gridColor, keys, locale, palette, textColor]);

  if (!result) return null;

  if (daily.length === 0 || !summary) {
    return (
      <div className="py-16 text-center">
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          {t.empty?.overview ?? "No data for the selected model. Try a different filter."}
        </p>
      </div>
    );
  }

  return (
    <div>
      <MetricHero
        items={heroItems}
        eyebrow={t.overview.heroEyebrow}
        subtitle={
          summary.dateRange
            ? t.overview.heroSubtitle
                .replace("{start}", summary.dateRange.start)
                .replace("{end}", summary.dateRange.end)
            : undefined
        }
        sideNote={`${summary.totalRequests.toLocaleString(locale)} ${t.metrics.requests} · ${summary.activeKeys.toLocaleString(locale)} ${t.kpi.activeKeys}`}
      />

      <div className="mb-6 text-[11px] font-semibold uppercase tracking-[0.24em]" style={{ color: "var(--text-secondary)" }}>
        {t.overview.normalizedHint}
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div>
          <h3 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.24em]" style={{ color: "var(--text-secondary)" }}>
            {t.overview.dailyCoreMetrics}
          </h3>
          <div aria-label={t.overview.dailyCoreMetrics} role="img">
            <ReactECharts option={dailyOption} style={{ height: 320 }} />
          </div>
        </div>
        <div>
          <h3 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.24em]" style={{ color: "var(--text-secondary)" }}>
            {t.overview.coreMetricsByKey}
          </h3>
          <div aria-label={t.overview.coreMetricsByKey} role="img">
            <ReactECharts option={distributionOption} style={{ height: 320 }} />
          </div>
        </div>
      </div>
    </div>
  );
}
