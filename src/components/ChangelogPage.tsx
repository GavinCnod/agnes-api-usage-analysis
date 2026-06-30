"use client";

/**
 * ChangelogPage —— Agnes 更新日志页面
 *
 * 当前页面作为 Agnes AI Usage Analysis 的版本历史入口：
 * 1. 展示 Agnes 迁移后的版本记录与后续迭代；
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
    version: "v0.1.1",
    date: "2026-06-30",
    added: [
      {
        zh: "Overview 与 Trends 改为三维核心指标的相对对比图，减少原有单指标切换操作，同时保留真实数值悬浮查看。",
        en: "Replaced the single-metric chart switchers in Overview and Trends with relative-comparison charts for the three core metrics while preserving raw-value hover details.",
      },
      {
        zh: "Overview 与 Trends 的分享卡同步切换为三维相对对比图，并为文本 Token、图片数量、视频时长补充静态最高/最低标注。",
        en: "Aligned Overview and Trends share cards with the new three-metric relative-comparison charts and added static peak/lowest annotations for text tokens, images, and video duration.",
      },
    ],
    improved: [
      {
        zh: "统一 KPI、Tab 与分享卡中的核心指标命名，将文本、图片、视频描述改为更精确的产品文案。",
        en: "Unified KPI, tab, and share-card naming for the three core metrics with more precise product-facing labels.",
      },
      {
        zh: "简化 MetricHero 结构，移除 eyebrow，将 subtitle 与 sideNote 收敛为更克制的单行次级说明排版。",
        en: "Simplified the MetricHero layout by removing the eyebrow and collapsing subtitle plus sideNote into a more restrained single-line secondary note.",
      },
      {
        zh: "将应用显示层中的金额符号统一调整为美元，并同步更新相关文案与示例文本。",
        en: "Standardized the displayed currency symbol to USD across the app and updated related copy and examples accordingly.",
      },
    ],
    fixed: [
      {
        zh: "同步更新版本号、更新日志、README、用户手册与公开 LLM 文本，确保 0.1.1 版本信息一致。",
        en: "Synchronized the version number across the changelog, README files, user guide, and public LLM text so all release-facing references now point to 0.1.1.",
      },
    ],
  },
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
    ? "这里记录 Agnes AI Usage Analysis 的版本演进。v0.1.0 完成 Agnes 单 CSV 迁移，v0.1.1 继续围绕三维核心指标的表达、分享卡一致性与界面克制感进行收敛。"
    : "This page tracks the evolution of Agnes AI Usage Analysis. Version 0.1.0 completed the Agnes single-CSV migration, and v0.1.1 continues refining the three-core-metric experience, share-card consistency, and restrained interface design.";

  const lastUpdated = isZh
    ? "最后更新：2026-06-30"
    : "Last Updated: 2026-06-30";

  const changelogJsonLd = useMemo(() => {
    return {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: isZh
        ? "更新日志 — Agnes AI Usage Analysis"
        : "Changelog — Agnes AI Usage Analysis",
      description: isZh
        ? "Agnes AI Usage Analysis 的更新日志，记录 Agnes 单 CSV 分析器从 v0.1.0 到 v0.1.1 的功能演进与界面改进。"
        : "Changelog for Agnes AI Usage Analysis, tracking product and UI evolution from v0.1.0 to v0.1.1 for the Agnes single-CSV analytics experience.",
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
