"use client";

import { useData } from"@/lib/DataContext";
import { useTranslation } from"@/i18n";
import { formatCost, formatTokens } from"@/lib/format";

/**
 * 文件说明：
 * KPI 卡片模块，负责在仪表盘顶部展示核心汇总指标。
 */

/**
 * KPI 指标卡片
 *
 * Apple 极简风格，采用大数字与细标签组合。
 * 当前按用量优先展示：Token、请求、费用、活跃 Key。
 */
export default function KPICards() {
 const { result } = useData();
 const { locale, t } = useTranslation();
 if (!result) return null;

 const { summary } = result;

 const items = [
  {
  value: formatTokens(summary.totalTokens, locale),
  label: t.kpi.totalTokens,
  sub: summary.dateRange
   ? `${summary.dateRange.start} — ${summary.dateRange.end}`
   :"",
  },
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
  <div className="grid grid-cols-2 lg:grid-cols-4">
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
