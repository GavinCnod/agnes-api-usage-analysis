"use client";

/**
 * Key 详情视图文件
 *
 * 提供按 Secret Key 维度的明细表格。
 * 当前固定以总 Token 数降序展示，同时保留费用列的一键复制能力。
 */

import { useMemo } from "react";
import { useData } from "@/lib/DataContext";
import { useTranslation } from "@/i18n";
import { formatCost, formatTokens } from "@/lib/format";
import { useTheme } from "@/lib/ThemeContext";
import CopyButton from "@/components/CopyButton";
import type { DailyUsage, KeyStats } from "@/lib/types";

/**
 * 对 Key 列表执行稳定的降序排序。
 *
 * 固定按总 Token 数排序，再回退到费用、请求数和 Key 名称，
 * 避免相同数值时表格顺序频繁抖动。
 */
function sortKeys(keys: KeyStats[]): KeyStats[] {
  return [...keys].sort((left, right) => {
    const primaryDiff = right.totalTokens - left.totalTokens;
    if (primaryDiff !== 0) return primaryDiff;

    const costDiff = right.totalCost - left.totalCost;
    if (costDiff !== 0) return costDiff;

    const requestDiff = right.requestCount - left.requestCount;
    if (requestDiff !== 0) return requestDiff;

    return left.apiKeyName.localeCompare(right.apiKeyName);
  });
}

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
 * 列表固定按 Token 数降序展示，右侧进度条也以 Token 数为基准。
 */
export default function KeyView() {
  const { filteredResult: result } = useData();
  const { locale, t } = useTranslation();
  const { theme } = useTheme();

  const keys = result?.keys ?? [];
  const daily = result?.daily ?? [];
  const isDark = theme === "dark";

  const modelCount = useMemo(() => getModelCount(daily), [daily]);
  const sortedKeys = useMemo(() => sortKeys(keys), [keys]);
  const maxMetricValue = useMemo(
    () => Math.max(...sortedKeys.map((item) => item.totalTokens), 1),
    [sortedKeys]
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
      {/* Hero — 大数字活跃 Key 数 */}
      <div className="text-center mb-12 pt-4">
        <div
          className="text-5xl sm:text-6xl md:text-[5rem] font-bold leading-none tracking-tighter"
          style={{ color: "var(--text-primary)", letterSpacing: "-0.04em" }}
        >
          {sortedKeys.length}
        </div>
        <p className="text-sm font-semibold mt-3" style={{ color: "var(--text-secondary)" }}>
          {t.kpi.activeKeys}
        </p>
        <p className="text-xs mt-1" style={{ color: "var(--text-tertiary)" }}>
          {t.keys.heroSubtitle
            .replace("{keys}", String(sortedKeys.length))
            .replace("{models}", String(modelCount))}
        </p>
      </div>

      <div className="mb-4">
        <h3
          className="text-[11px] font-semibold uppercase tracking-widest"
          style={{ color: "var(--text-secondary)" }}
        >
          {t.keys.title}
        </h3>
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
                {t.keys.tokens}
              </th>
              <th
                className="px-3 py-2.5 text-right text-[10px] font-semibold uppercase tracking-wider"
                style={{ color: "var(--text-tertiary)" }}
              >
                {t.keys.cost}
              </th>
              <th
                className="px-3 py-2.5 text-right text-[10px] font-semibold uppercase tracking-wider"
                style={{ color: "var(--text-tertiary)" }}
              >
                {t.keys.requests}
              </th>
              <th className="px-3 py-2.5 w-28"></th>
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
                  {formatTokens(keyItem.totalTokens, locale)}
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
                    {formatCost(keyItem.totalCost, locale)}
                  </CopyButton>
                </td>
                <td
                  className="px-3 py-3 text-right"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {keyItem.requestCount.toLocaleString(locale)}
                </td>
                <td className="px-3 py-3">
                  <div
                    className="w-24 h-1 rounded-full overflow-hidden"
                    style={{ background: "var(--border)" }}
                  >
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${(keyItem.totalTokens / maxMetricValue) * 100}%`,
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
