"use client";

import { useData } from"@/lib/DataContext";
import { useTranslation } from"@/i18n";
import { formatCost } from"@/lib/format";
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
   label:
    item.key === "tokens"
     ? t.kpi.totalTextTokens
     : item.key === "images"
      ? t.kpi.generatedImages
      : item.key === "videoSeconds"
       ? t.kpi.generatedVideoSeconds
       : item.label,
  })),
  {
  value: summary.totalRequests.toLocaleString(locale),
  label: t.kpi.totalRequests,
  },
  {
  value: formatCost(summary.totalCost, locale),
  label: t.kpi.totalCost,
  },
  {
  value: String(summary.activeKeys),
  label: t.kpi.activeKeys,
  },
 ];

 return (
 <div className="mb-12 mt-4">
  <div className="grid grid-cols-2 gap-x-4 lg:grid-cols-6 lg:gap-x-6">
  {items.map((item) => (
   <div key={item.label} className="px-0 py-5">
   <div
    className="text-3xl font-bold tracking-tight"
    style={{ color: "var(--text-primary)", letterSpacing: "-0.03em" }}
   >
    {item.value}
   </div>
   <div className="mt-2 text-xs font-medium uppercase leading-snug tracking-wider" style={{ color: "var(--text-secondary)" }}>
    {item.label}
   </div>
   </div>
  ))}
  </div>
  {/* 底部通栏细横线分割 */}
  <hr style={{ borderColor: "var(--border)", marginTop: "0.5rem" }} />
 </div>
 );
}
