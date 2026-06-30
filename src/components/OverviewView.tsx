"use client";

/**
 * 文件说明：
 * 总览视图模块，负责以三维 Hero + 可切换多指标图表的方式展示 Agnes 多模态用量概览。
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
 * 生成总览视图。
 *
 * 顶部固定展示文本 Token、图片数量、视频时长三个主指标，
 * 下方图表共享同一指标切换状态，避免再次退回到“只看 Token”的语义。
 */
export default function OverviewView() {
  const { filteredResult: result } = useData();
  const { locale, t } = useTranslation();
  const { theme } = useTheme();
  const [metric, setMetric] = useState<DashboardMetricKey>("tokens");
  const daily = result?.daily ?? [];
  const keys = result?.keys ?? [];
  const summary = result?.summary;

  const isDark = theme === "dark";
  const textColor = isDark ? "#98989D" : "#86868B";
  const gridColor = isDark ? "#2C2C2E" : "#E5E5EA";
  const palette = isDark
    ? ["#F5F5F7", "#D2D2D7", "#98989D", "#636366", "#48484A", "#38383A"]
    : ["#1D1D1F", "#636366", "#86868B", "#98989D", "#D2D2D7", "#E5E5EA"];
  const metricOptions = useMemo(() => buildComparisonMetricItems(t), [t]);
  const activeMetricLabel = metricOptions.find((item) => item.key === metric)?.label ?? "";
  const heroItems = useMemo(
    () => (summary ? buildHeroMetricItems(summary, locale, t) : []),
    [locale, summary, t]
  );

  const dailyTitle = locale === "zh" ? `每日${activeMetricLabel}` : `Daily ${activeMetricLabel}`;
  const distributionTitle = locale === "zh" ? `${activeMetricLabel} 按 Key 分布` : `${activeMetricLabel} by API Key`;

  const dailyOption = useMemo(() => {
    const dates = [...new Set(daily.map((item) => item.date))].sort();
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
      series: [
        {
          type: "bar",
          data: dates.map((date) => byDate.get(date) ?? 0),
          itemStyle: { color: isDark ? "#F5F5F7" : "#1D1D1F", borderRadius: [4, 4, 0, 0] },
        },
      ],
    };
  }, [daily, gridColor, isDark, locale, metric, textColor]);

  const donutOption = useMemo(() => {
    const data = keys
      .map((item) => ({
        name: item.apiKeyName,
        value: getMetricValue(item, metric),
      }))
      .filter((item) => item.value > 0);

    return {
      tooltip: {
        trigger: "item" as const,
        valueFormatter: (value: unknown) => formatMetricValue(metric, value as number, locale),
      },
      legend: {
        orient: "vertical" as const,
        right: 0,
        top: "center",
        textStyle: { fontSize: 11, color: textColor },
      },
      color: palette,
      series: [
        {
          type: "pie",
          radius: ["42%", "68%"],
          center: ["35%", "50%"],
          data,
          label: { show: false },
          emphasis: {
            label: { show: true, fontSize: 12, fontWeight: "bold" as const },
          },
        },
      ],
    };
  }, [keys, locale, metric, palette, textColor]);

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

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <span className="text-[11px] font-semibold uppercase tracking-[0.24em]" style={{ color: "var(--text-secondary)" }}>
          {t.overview.chartMetricLabel}
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

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div>
          <h3 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.24em]" style={{ color: "var(--text-secondary)" }}>
            {dailyTitle}
          </h3>
          <div aria-label={dailyTitle} role="img">
            <ReactECharts option={dailyOption} style={{ height: 300 }} />
          </div>
        </div>
        <div>
          <h3 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.24em]" style={{ color: "var(--text-secondary)" }}>
            {distributionTitle}
          </h3>
          <div aria-label={distributionTitle} role="img">
            <ReactECharts option={donutOption} style={{ height: 300 }} />
          </div>
        </div>
      </div>
    </div>
  );
}
