/**
 * 多模态 Hero 展示组件。
 *
 * 为 Overview、Trends、Keys、Projects 等视图提供统一的三维并列大数字布局，
 * 确保文本 Token、图片数量、视频时长始终以同等层级出现在首屏。
 */

import type { ReactNode } from "react";
import type { MetricDisplayItem } from "@/lib/dashboardMetrics";

/** Hero 单项展示数据。 */
interface MetricHeroProps {
  items: MetricDisplayItem[];
  eyebrow?: string;
  subtitle?: ReactNode;
  sideNote?: ReactNode;
}

/**
 * 渲染统一风格的三维 Hero 区域。
 */
export default function MetricHero({ items, eyebrow, subtitle, sideNote }: MetricHeroProps) {
  return (
    <div className="mb-12 pt-4">
      {(eyebrow || sideNote) && (
        <div className="mb-5 flex flex-col gap-2 border-b pb-4 md:flex-row md:items-end md:justify-between" style={{ borderColor: "var(--border)" }}>
          <div>
            {eyebrow && (
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em]" style={{ color: "var(--text-secondary)" }}>
                {eyebrow}
              </p>
            )}
            {subtitle && (
              <div className="mt-2 text-xs" style={{ color: "var(--text-tertiary)" }}>
                {subtitle}
              </div>
            )}
          </div>
          {sideNote && (
            <div className="text-xs md:text-right" style={{ color: "var(--text-tertiary)" }}>
              {sideNote}
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {items.map((item) => {
          const isEmpty = item.value === 0;
          return (
            <div
              key={item.key}
              className="rounded-subtle border px-0 py-4 md:border-x-0 md:border-y-0 md:px-4 md:first:pl-0 md:last:pr-0"
              style={{ borderColor: "var(--border)" }}
            >
              <div
                className="text-4xl font-bold leading-none tracking-tight sm:text-5xl"
                style={{
                  color: isEmpty ? "var(--text-secondary)" : "var(--text-primary)",
                  letterSpacing: "-0.04em",
                }}
              >
                {item.formattedValue}
              </div>
              <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.22em]" style={{ color: "var(--text-secondary)" }}>
                {item.label}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
