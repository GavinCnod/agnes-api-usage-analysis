"use client";

/**
 * 文件说明：
 * 趋势视图模块，负责在固定三维 Hero 之下展示可切换的多指标趋势图。
 */

import { useMemo, useState } from "react";
import ReactECharts from "echarts-for-react";
import { useData } from "@/lib/DataContext";
import { useTranslation } from "@/i18n";
import { useTheme } from "@/lib/ThemeContext";
import MetricHero from "@/components/MetricHero";
import {
  type DashboardMetricKey,
  buildComparisonMetricItems,
  buildHeroMetricItems,
  formatMetricValue,
  getMetricValue,
} from "@/lib/dashboardMetrics";

/**
 * 趋势视图组件。
 *
 * Hero 固定展示文本 Token、图片数量、视频时长，
 * 趋势图区域承担请求数、费用等辅助指标切换。
 */
export default function TrendsView() {
  const { filteredResult: result } = useData();
  const { locale, t } = useTranslation();
  const { theme } = useTheme();
  const [metric, setMetric] = useState<DashboardMetricKey>("tokens");
  const daily = result?.daily ?? [];
  const summary = result?.summary;

  const dates = [...new Set(daily.map((item) => item.date))].sort();
  const isDark = theme === "dark";
  const textColor = isDark ? "#98989D" : "#86868B";
  const gridColor = isDark ? "#2C2C2E" : "#E5E5EA";
  const lineColor = isDark ? "#F5F5F7" : "#1D1D1F";
  const metricOptions = useMemo(() => buildComparisonMetricItems(t), [t]);
  const activeMetricLabel = metricOptions.find((item) => item.key === metric)?.label ?? "";
  const heroItems = useMemo(
    () => (summary ? buildHeroMetricItems(summary, locale, t) : []),
    [locale, summary, t]
  );

  const option = useMemo(() => {
    const byDate = new Map<string, number>();

    for (const item of daily) {
      byDate.set(item.date, (byDate.get(item.date) ?? 0) + getMetricValue(item, metric));
    }

    return {
      tooltip: {
        trigger: "axis" as const,
        valueFormatter: (value: unknown) => formatMetricValue(metric, value as number, locale),
      },
      grid: { top: 8, right: 16, bottom: 24, left: 52 },
      xAxis: {
        type: "category" as const,
        data: dates,
        axisLabel: { fontSize: 10, color: textColor, rotate: dates.length > 15 ? 45 : 0 },
        axisLine: { lineStyle: { color: gridColor } },
      },
      yAxis: {
        type: "value" as const,
        axisLabel: {
          fontSize: 10,
          color: textColor,
          formatter: (value: number) => formatMetricValue(metric, value, locale),
        },
        splitLine: { lineStyle: { color: gridColor } },
      },
      dataZoom: dates.length > 30 ? [{ type: "inside" as const }] : undefined,
      series: [
        {
          type: "line",
          data: dates.map((date) => {
            const value = byDate.get(date) ?? 0;
            return +value.toFixed(4);
          }),
          smooth: true,
          lineStyle: { color: lineColor, width: 2 },
          itemStyle: { color: lineColor },
          areaStyle: {
            color: {
              type: "linear" as const,
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: isDark ? "rgba(245,245,247,0.08)" : "rgba(29,29,31,0.04)" },
                { offset: 1, color: "transparent" },
              ],
            },
          },
        },
      ],
    };
  }, [daily, dates, gridColor, isDark, lineColor, locale, metric, textColor]);

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
        eyebrow={t.trends.heroEyebrow}
        subtitle={t.trends.heroSubtitle.replace("{days}", String(dates.length))}
        sideNote={`${t.trends.activeMetric}: ${activeMetricLabel}`}
      />

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <span className="text-[11px] font-semibold uppercase tracking-[0.24em]" style={{ color: "var(--text-secondary)" }}>
          {t.trends.activeMetric}
        </span>
        <div className="flex flex-wrap gap-2">
          {metricOptions.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setMetric(item.key)}
              className="rounded-full border px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.18em] transition-colors duration-200"
              style={{
                borderColor: metric === item.key ? "var(--text-primary)" : "var(--border)",
                color: metric === item.key ? "var(--accent-inverse)" : "var(--text-secondary)",
                background: metric === item.key ? "var(--text-primary)" : "transparent",
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div aria-label={activeMetricLabel} role="img">
        <ReactECharts option={option} style={{ height: 360 }} />
      </div>
    </div>
  );
}
