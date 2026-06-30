"use client";

/**
 * ChangelogPage —— Agnes 更新日志页面
 *
 * 当前页面作为 Agnes AI Usage Analysis 的版本历史入口：
 * 1. 展示 Agnes 迁移后的首个版本记录；
 * 2. 保留现有法律页风格与中英双语能力；
 * 3. 通过 JSON-LD 输出基础 WebPage 结构化数据。
 */

import Link from "next/link";
import { useMemo } from "react";
import { useTranslation } from "@/i18n";
import TitleBar from "./TitleBar";
import FooterBar from "./FooterBar";

/**
 * 双语变更项。
 */
interface ChangeItem {
  en: string;
  zh: string;
}

/**
 * 单个版本条目。
 */
interface VersionEntry {
  version: string;
  date: string;
  added?: ChangeItem[];
  improved?: ChangeItem[];
  fixed?: ChangeItem[];
  dependencies?: ChangeItem[];
}

/**
 * Agnes 当前版本历史。
 */
const CHANGELOG_DATA: VersionEntry[] = [
  {
    version: "v0.1.0",
    date: "2026-06-28",
    added: [
      {
        zh: "基于前期本团队开源项目 deepseek-api-usage-analysis，构建此工程，将输入切换为 Agnes 用量 CSV。",
        en: "Switched the input to a single Agnes usage CSV base on our existing open-source project deepseek-api-usage-analysis.",
      },
      {
        zh: "保留 Overview、By Project、By Key、Trends 四个标签页，并适配 Agnes 的 Cost、Tokens、Requests 统计口径。",
        en: "Kept the Overview, By Project, By Key, and Trends tabs and adapted them to Agnes cost, token, and request metrics.",
      },
      {
        zh: "新增 Agnes 版操作手册、更新日志与多语言说明文案，统一到单文件上传流程。",
        en: "Added an Agnes-specific guide, changelog, and localized copy aligned with the single-file upload workflow.",
      },
    ],
    improved: [
      {
        zh: "上传流程收敛为单个 CSV 文件，显式拦截多文件、非 CSV 与超大文件输入。",
        en: "Streamlined uploads to a single CSV flow with explicit handling for multiple files, non-CSV files, and oversized files.",
      },
      {
        zh: "分享卡、SEO 文案、法律页和 README 说明全面切换到 Agnes 语义。",
        en: "Updated share-card copy, SEO text, legal pages, and README content to Agnes wording.",
      },
    ],
    fixed: [
      {
        zh: "解析器只统计 success 状态，并对异常 Quantity 字符串给出 warning，而不是直接导致页面失败。",
        en: "The parser now counts only success rows and emits warnings for malformed quantity strings instead of failing the whole page.",
      },
    ],
    dependencies: [
      {
        zh: "保留现有前端依赖栈，未为本次迁移引入新的服务端或数据库依赖。",
        en: "Kept the existing frontend dependency stack with no new server-side or database dependencies introduced for this migration.",
      },
    ],
  },
];

/**
 * ChangelogPage 组件。
 */
export function ChangelogPage() {
  const { locale, t } = useTranslation();
  const isZh = locale === "zh";

  const intro = isZh
    ? "这里记录 Agnes AI Usage Analysis 的版本演进。当前版本从旧项目迁移而来，但从产品语义、输入格式和仪表盘行为上已经收敛为 Agnes 单 CSV 分析工具。"
    : "This page tracks the evolution of Agnes AI Usage Analysis. The current version is migrated from an earlier project, but its product wording, input format, and dashboard behavior are now fully centered on Agnes single-CSV analytics.";

  const lastUpdated = isZh
    ? "最后更新：2026-06-28"
    : "Last Updated: 2026-06-28";

  const changelogJsonLd = useMemo(() => {
    return {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: isZh
        ? "更新日志 — Agnes AI Usage Analysis"
        : "Changelog — Agnes AI Usage Analysis",
      description: isZh
        ? "Agnes AI Usage Analysis 的更新日志，记录 Agnes 单 CSV 分析器的功能演进与迁移说明。"
        : "Changelog for Agnes AI Usage Analysis, tracking the evolution of the Agnes single-CSV analytics experience.",
      about: {
        "@type": "Thing",
        name: isZh ? "更新日志" : "Changelog",
      },
      isPartOf: {
        "@type": "WebSite",
        name: "Agnes AI Usage Analysis",
        url: "https://agnes-usage.xyz",
      },
    };
  }, [isZh]);

  const categories: {
    key: keyof Pick<VersionEntry, "added" | "improved" | "fixed" | "dependencies">;
    label: string;
    dotColor: string;
  }[] = [
    { key: "added", label: t.changelog.added, dotColor: "#34C759" },
    { key: "improved", label: t.changelog.improved, dotColor: "#007AFF" },
    { key: "fixed", label: t.changelog.fixed, dotColor: "#FF9500" },
    { key: "dependencies", label: t.changelog.dependencies, dotColor: "#AF52DE" },
  ];

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(changelogJsonLd) }}
      />

      <TitleBar />

      <div className="max-w-3xl mx-auto px-6 py-8">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-medium transition-colors duration-200 mb-8 hover:opacity-80"
          style={{ color: "var(--text-secondary)" }}
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M19 12H5M12 19l-7-7 7-7"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          {t.changelog.backToHome}
        </Link>

        <h1
          className="text-2xl font-bold tracking-tight mb-2"
          style={{
            color: "var(--text-primary)",
            letterSpacing: "-0.03em",
          }}
          translate="no"
        >
          {t.changelog.pageTitle}
        </h1>

        <p className="text-xs mb-10" style={{ color: "var(--text-tertiary)" }}>
          {lastUpdated}
        </p>

        <p
          className="text-sm leading-relaxed mb-12 text-pretty"
          style={{ color: "var(--text-secondary)" }}
        >
          {intro}
        </p>

        {CHANGELOG_DATA.map((entry) => (
          <section key={entry.version} className="mb-12">
            <h2
              className="text-lg font-bold mb-1"
              style={{
                color: "var(--text-primary)",
                letterSpacing: "-0.02em",
              }}
            >
              {entry.version}
            </h2>

            <p
              className="text-xs mb-5"
              style={{ color: "var(--text-tertiary)" }}
            >
              {entry.date}
            </p>

            {categories.map((category) => {
              const items = entry[category.key];
              if (!items || items.length === 0) {
                return null;
              }

              return (
                <div key={category.key} className="mb-5">
                  <div className="flex items-center gap-1.5 mb-2">
                    <span
                      className="inline-block w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: category.dotColor }}
                      aria-hidden="true"
                    />
                    <span
                      className="text-xs font-semibold uppercase tracking-wide"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {category.label}
                    </span>
                  </div>

                  <ul className="space-y-1.5 pl-4">
                    {items.map((item, index) => (
                      <li
                        key={`${category.key}-${index}`}
                        className="text-sm leading-relaxed text-pretty"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        {isZh ? item.zh : item.en}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}

            <hr className="mt-8" style={{ borderColor: "var(--border)" }} />
          </section>
        ))}

        <hr className="my-10" style={{ borderColor: "var(--border)" }} />

        <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
          <a
            href="https://github.com/GavinCnod/agnes-api-usage-analysis"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 transition-colors duration-200"
            style={{ color: "var(--text-secondary)" }}
          >
            {t.changelog.githubLabel}
          </a>
        </p>
      </div>

      <FooterBar />
    </div>
  );
}
