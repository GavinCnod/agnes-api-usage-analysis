/**
 * ChangelogContent —— 更新日志页的 <noscript> 回退内容
 *
 * 该组件为不执行 JavaScript 的爬虫提供 Agnes 版本历史摘要，
 * 以便搜索引擎仍能抓取到项目当前的维护状态。
 */

import translations from "@/i18n/translations";

/**
 * 迁移后的版本摘要。
 */
const VERSION_SUMMARY = [
  {
    version: "v0.1.1",
    date: "2026-06-30",
    zh: "三维核心指标优化版本：Overview / Trends 改为相对对比图，分享卡补充静态最高/最低标注，KPI 文案、金额符号与 Hero 排版进一步统一。",
    en: "Three-core-metric refinement release: Overview / Trends now use relative-comparison charts, share cards add static peak/lowest annotations, and KPI copy, currency display, and Hero layout are further unified.",
  },
  {
    version: "v0.1.0",
    date: "2026-06-28",
    zh: "Agnes 单 CSV 迁移版本：移除 Cache 语义，切换到 success-only 统计口径，并完成页面、SEO 与文档改写。",
    en: "Agnes single-CSV migration release: removed cache semantics, switched to success-only counting, and rewrote pages, SEO text, and docs.",
  },
];

export default function ChangelogContent() {
  return (
    <noscript>
      <section lang="en">
        <h1>{translations.en.changelog.pageTitle}</h1>
        <p>Last Updated: 2026-06-30</p>
        <p>
          Agnes AI Usage Analysis changelog. This project now focuses on Agnes
          usage CSV analytics processed locally in the browser.
        </p>
        <ol>
          {VERSION_SUMMARY.map((item) => (
            <li key={item.version}>
              <strong>{item.version}</strong>
              {` — ${item.date} — ${item.en}`}
            </li>
          ))}
        </ol>
      </section>

      <section lang="zh">
        <h1>{translations.zh.changelog.pageTitle}</h1>
        <p>最后更新：2026-06-30</p>
        <p>
          Agnes AI Usage Analysis 更新日志。当前项目已聚焦于 Agnes
          用量 CSV 的本地浏览器分析能力。
        </p>
        <ol>
          {VERSION_SUMMARY.map((item) => (
            <li key={item.version}>
              <strong>{item.version}</strong>
              {` — ${item.date} — ${item.zh}`}
            </li>
          ))}
        </ol>
      </section>
    </noscript>
  );
}
