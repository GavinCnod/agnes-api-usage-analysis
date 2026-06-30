"use client";

/**
 * Key 详情视图文件
 *
 * 提供按 Secret Key 维度的多模态明细表格与排序联动能力。
 */

import { useMemo, useState } from "react";
import { useData } from "@/lib/DataContext";
import { useTranslation } from "@/i18n";
import { useTheme } from "@/lib/ThemeContext";
import CopyButton from "@/components/CopyButton";
import type { DailyUsage, KeyStats } from "@/lib/types";
import MetricHero from "@/components/MetricHero";
import {
  type DashboardMetricKey,
  buildComparisonMetricItems,
  buildHeroMetricItems,
  formatMetricValue,
  getMetricValue,
  sortByMetric,
} from "@/lib/dashboardMetrics";

/**
 * 统计当前筛选结果中出现过的模型数量。
 */
function getModelCount(daily: DailyUsage[]): number {
  return new Set(daily.map((item) => item.model)).size;
}

/**
 * Key 详情表格视图
 *
 * Apple 极简风格，不包裹卡片，使用通栏表格展示所有 Key 指标。
 * 排序方式、表头激活态与右侧进度条基准共享同一指标状态。
 */
export default function KeyView() {
  const { filteredResult: result } = useData();
  const { locale, t } = useTranslation();
  const { theme } = useTheme();
  const [metric, setMetric] = useState<DashboardMetricKey>("tokens");

  const keys = result?.keys ?? [];
  const daily = result?.daily ?? [];
  const summary = result?.summary;
  const isDark = theme === "dark";

  const modelCount = useMemo(() => getModelCount(daily), [daily]);
  const sortedKeys = useMemo(() => sortByMetric(keys, metric), [keys, metric]);
  const metricOptions = useMemo(() => buildComparisonMetricItems(t), [t]);
  const activeMetricLabel = metricOptions.find((item) => item.key === metric)?.label ?? "";
  const heroItems = useMemo(
    () => (summary ? buildHeroMetricItems(summary, locale, t) : []),
    [locale, summary, t]
  );
  const maxMetricValue = useMemo(
    () => Math.max(...sortedKeys.map((item) => getMetricValue(item, metric)), 1),
    [metric, sortedKeys]
  );

  if (!result) return null;

  if (sortedKeys.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          {t.empty?.keys ?? "No API keys found in the data."}
        </p>
      </div>
    );
  }

  return (
    <div>
      <MetricHero
        items={heroItems}
        eyebrow={t.keys.heroEyebrow}
        subtitle={t.keys.heroSubtitle
          .replace("{keys}", String(sortedKeys.length))
          .replace("{models}", String(modelCount))}
        sideNote={`${t.keys.sortBy}: ${activeMetricLabel}`}
      />

      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <h3 className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: "var(--text-secondary)" }}>
          {t.keys.title}
        </h3>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-[0.24em]" style={{ color: "var(--text-secondary)" }}>
            {t.keys.sortBy}
          </span>
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

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: `1px solid var(--border)` }}>
              <th
                className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider"
                style={{ color: "var(--text-tertiary)" }}
              >
                {t.keys.apiKeyName}
              </th>
              <th
                className="px-3 py-2.5 text-right text-[10px] font-semibold uppercase tracking-wider"
                style={{ color: "var(--text-tertiary)" }}
              >
                <button type="button" onClick={() => setMetric("tokens")} style={{ color: metric === "tokens" ? "var(--text-primary)" : "inherit" }}>
                  {t.keys.tokens}
                </button>
              </th>
              <th
                className="px-3 py-2.5 text-right text-[10px] font-semibold uppercase tracking-wider"
                style={{ color: "var(--text-tertiary)" }}
              >
                <button type="button" onClick={() => setMetric("images")} style={{ color: metric === "images" ? "var(--text-primary)" : "inherit" }}>
                  {t.keys.images}
                </button>
              </th>
              <th
                className="px-3 py-2.5 text-right text-[10px] font-semibold uppercase tracking-wider"
                style={{ color: "var(--text-tertiary)" }}
              >
                <button type="button" onClick={() => setMetric("videoSeconds")} style={{ color: metric === "videoSeconds" ? "var(--text-primary)" : "inherit" }}>
                  {t.keys.videoSeconds}
                </button>
              </th>
              <th
                className="px-3 py-2.5 text-right text-[10px] font-semibold uppercase tracking-wider"
                style={{ color: "var(--text-tertiary)" }}
              >
                <button type="button" onClick={() => setMetric("cost")} style={{ color: metric === "cost" ? "var(--text-primary)" : "inherit" }}>
                  {t.keys.cost}
                </button>
              </th>
              <th
                className="px-3 py-2.5 text-right text-[10px] font-semibold uppercase tracking-wider"
                style={{ color: "var(--text-tertiary)" }}
              >
                <button type="button" onClick={() => setMetric("requests")} style={{ color: metric === "requests" ? "var(--text-primary)" : "inherit" }}>
                  {t.keys.requests}
                </button>
              </th>
              <th className="px-3 py-2.5 w-28 text-right text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>
                {t.keys.progressBy.replace("{metric}", activeMetricLabel)}
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedKeys.map((keyItem) => (
              <tr
                key={keyItem.apiKeyName}
                className="group transition-colors duration-150"
                style={{ borderBottom: `1px solid var(--border)` }}
              >
                <td
                  className="px-3 py-3 font-semibold"
                  style={{ color: "var(--text-primary)" }}
                >
                  {keyItem.apiKeyName}
                </td>
                <td
                  className="px-3 py-3 text-right"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {formatMetricValue("tokens", keyItem.totalTokens, locale, "full")}
                </td>
                <td
                  className="px-3 py-3 text-right"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {formatMetricValue("images", keyItem.imageCount, locale, "full")}
                </td>
                <td
                  className="px-3 py-3 text-right"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {formatMetricValue("videoSeconds", keyItem.videoSeconds, locale, "full")}
                </td>
                <td
                  className="px-3 py-3 text-right font-semibold"
                  style={{ color: "var(--text-primary)" }}
                >
                  <CopyButton
                    value={keyItem.totalCost}
                    name={keyItem.apiKeyName}
                    className="cursor-pointer transition-opacity duration-150 hover:opacity-70"
                  >
                    {formatMetricValue("cost", keyItem.totalCost, locale, "full")}
                  </CopyButton>
                </td>
                <td
                  className="px-3 py-3 text-right"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {formatMetricValue("requests", keyItem.requestCount, locale, "full")}
                </td>
                <td className="px-3 py-3">
                  <div
                    className="w-24 h-1 rounded-full overflow-hidden"
                    style={{ background: "var(--border)" }}
                  >
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${(getMetricValue(keyItem, metric) / maxMetricValue) * 100}%`,
                        background: isDark ? "var(--text-primary)" : "var(--accent)",
                        opacity: 0.6,
                      }}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
