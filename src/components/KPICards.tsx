"use client";

import { useData } from"@/lib/DataContext";
import { useTranslation } from"@/i18n";
import { formatCost, formatTokens } from"@/lib/format";
import { buildHeroMetricItems } from "@/lib/dashboardMetrics";

/**
 * 文件说明：
 * KPI 卡片模块，负责在仪表盘顶部展示核心汇总指标。
 */

/**
 * KPI 指标卡片。
 *
 * 将首页顶层指标重排为三维主展示 + 三个辅助指标，
 * 让文本 Token、图片数量、视频时长在首屏并列可见。
 */
export default function KPICards() {
 const { result } = useData();
 const { locale, t } = useTranslation();
 if (!result) return null;

 const { summary } = result;
  const heroItems = buildHeroMetricItems(summary, locale, t);

 const items = [
  ...heroItems.map((item) => ({
   value: item.formattedValue,
   label: item.label,
   sub:
    item.key === "tokens"
     ? summary.dateRange
       ? `${summary.dateRange.start} — ${summary.dateRange.end}`
       :""
     : item.key === "images"
      ? `${summary.imageRequestCount.toLocaleString(locale)} ${t.metrics.requests.toLowerCase()}`
      : `${summary.videoRequestCount.toLocaleString(locale)} ${t.metrics.requests.toLowerCase()}`,
  })),
  {
  value: summary.totalRequests.toLocaleString(),
  label: t.kpi.totalRequests,
  sub: t.kpi.requestsPerKey.replace("{count}", String(summary.activeKeys || 0)),
  },
  {
  value: formatCost(summary.totalCost, locale),
  label: t.kpi.totalCost,
  sub: t.kpi.models.replace("{count}", String(summary.models.length)),
  },
  {
  value: String(summary.activeKeys),
  label: t.kpi.activeKeys,
  sub:"",
  },
 ];

 return (
 <div className="mb-12 mt-4">
  <div className="grid grid-cols-2 lg:grid-cols-6">
  {items.map((item) => (
   <div key={item.label} className="px-0 py-5">
   <div
    className="text-3xl font-bold tracking-tight"
    style={{ color: "var(--text-primary)", letterSpacing: "-0.03em" }}
   >
    {item.value}
   </div>
   <div className="text-xs font-medium mt-2 uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
    {item.label}
   </div>
   {item.sub && (
    <div className="text-xs mt-0.5" style={{ color: "var(--text-tertiary)" }}>
    {item.sub}
    </div>
   )}
   </div>
  ))}
  </div>
  {/* 底部通栏细横线分割 */}
  <hr style={{ borderColor: "var(--border)", marginTop: "0.5rem" }} />
 </div>
 );
}
