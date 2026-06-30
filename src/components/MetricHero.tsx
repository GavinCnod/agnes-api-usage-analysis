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
  subtitle?: ReactNode;
  sideNote?: ReactNode;
}

/**
 * 渲染统一风格的三维 Hero 区域。
 */
export default function MetricHero({ items, subtitle, sideNote }: MetricHeroProps) {
  return (
    <div className="mb-12 pt-4">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {items.map((item) => {
          const isEmpty = item.value === 0;
          return (
            <div
              key={item.key}
              className="rounded-subtle border px-0 py-4 text-center md:border-x-0 md:border-y-0 md:px-4 md:first:pl-0 md:last:pr-0"
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

      {(subtitle || sideNote) && (
        <div
          className="mt-4 flex items-center justify-center pt-2 text-center"
        >
          <div
            className="flex flex-wrap items-center justify-center gap-2 text-[11px]"
            style={{ color: "var(--text-tertiary)", opacity: 0.82 }}
          >
            {subtitle && <span>{subtitle}</span>}
            {subtitle && sideNote && <span aria-hidden="true">&middot;</span>}
            {sideNote && <span>{sideNote}</span>}
          </div>
        </div>
      )}
    </div>
  );
}
