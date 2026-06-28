/**
 * Schema.org 结构化数据辅助模块
 *
 * 生成 JSON-LD 格式的 Schema Markup，支持多语言（en / zh）。
 * 在 LandingPage 客户端组件中根据当前 locale 动态渲染。
 */
import type { Locale } from "@/i18n/translations";

/* ------------------------------------------------------------------ */
/*  多语言翻译映射                                                       */
/* ------------------------------------------------------------------ */

/** 应用版本号，与 package.json 保持同步 */
const APP_VERSION = "0.1.0";

/** 站点公开 URL */
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://deepseek-usage.xyz";

/** SoftwareApplication Schema 翻译 */
const softwareAppSchema: Record<
  Locale,
  { name: string; description: string; version: string }
> = {
  en: {
    name: "Agnes AI Usage Analytics Dashboard by Gavin & Mindrose Team",
    description:
      "Visualize your Agnes AI usage — upload a usage CSV and get instant cost analytics, request trends, and per-key breakdowns. Free, open-source, browser-side.",
    version: APP_VERSION,
  },
  zh: {
    name: "Agnes AI 用量分析仪表盘 by Gavin & Mindrose Team",
    description:
      "可视化您的 Agnes AI 使用情况 — 上传 usage CSV，即时获取费用分析、请求趋势和各 Key 用量明细。免费、开源、纯浏览器端。",
    version: APP_VERSION,
  },
};

/** FAQPage Schema 翻译 */
const faqSchema: Record<Locale, { questions: { q: string; a: string }[] }> = {
  en: {
    questions: [
      {
        q: "Is my data uploaded to any server?",
        a: "No. All CSV parsing and cost computation runs entirely in your browser. Your data never leaves your device.",
      },
      {
        q: "What CSV files do I need?",
        a: "You need a single Agnes usage CSV file. The current version does not require ZIP extraction or multi-file pairing.",
      },
      {
        q: "Can I analyze multiple months at once?",
        a: "Not yet. The current Agnes version focuses on one usage CSV at a time.",
      },
      {
        q: "What models are supported?",
        a: "Any model listed in your Agnes usage export. The dashboard auto-detects all models and provides a filter to view them individually or combined.",
      },
      {
        q: "Why does my cost show as $0?",
        a: "If the Agnes export itself reports Consumption Amount(cents) as 0, the dashboard will also show 0. No extra cost file is required.",
      },
      {
        q: "What does \"Incomplete Upload\" mean?",
        a: "In the Agnes version, this usually means the uploaded file is empty, missing required columns, or is not a valid Agnes usage CSV.",
      },
      {
        q: "Where can I find more troubleshooting help?",
        a: "Check the Troubleshooting section in our full User Guide. It covers common issues like CSV format errors, missing columns, and upload validation.",
      },
      {
        q: "Is there a file size limit?",
        a: "Yes, each file must be under 50 MB. This keeps the browser responsive and prevents oversized files from freezing the page.",
      },
      {
        q: "Can I group API keys by project?",
        a: "Yes. Switch to the 'By Project' tab and click the gear icon to open the configuration panel. Drag API key names from the unassigned pool into your custom project groups. Your project configuration is saved in your browser's local storage.",
      },
    ],
  },
  zh: {
    questions: [
      {
        q: "我的数据会上传到服务器吗？",
        a: "不会。所有 CSV 解析和费用计算均在您的浏览器中完成，数据不会离开您的设备。",
      },
      {
        q: "我需要哪些 CSV 文件？",
        a: "需要一个 Agnes usage CSV 文件。当前版本不需要 ZIP 解压，也不需要双文件配对。",
      },
      {
        q: "可以同时分析多个月份吗？",
        a: "暂时还不支持。当前 Agnes 版本先聚焦单个 usage CSV 的稳定分析流程。",
      },
      {
        q: "支持哪些模型？",
        a: "Agnes usage 导出中的所有模型均支持。仪表盘会自动检测模型，并提供筛选器以便单独或合并查看。",
      },
      {
        q: "为什么费用显示为 0？",
        a: "如果 Agnes 导出的 Consumption Amount(cents) 本身为 0，仪表盘中显示的费用也会是 0。本工具不再依赖额外的 cost 文件。",
      },
      {
        q: "显示\u201C上传不完整\u201D是什么意思？",
        a: "在 Agnes 版本里，这通常表示上传的文件为空、缺少必需列，或不是有效的 Agnes usage CSV。",
      },
      {
        q: "哪里可以找到更多故障排查帮助？",
        a: "请查看完整操作指南中的\u201C常见问题排查\u201D章节，涵盖 CSV 格式错误、缺少字段和上传校验等常见问题。",
      },
      {
        q: "有文件大小限制吗？",
        a: "有，单个文件不能超过 50 MB。这是为了保持浏览器响应速度，避免超大文件导致页面卡死。",
      },
      {
        q: "可以按项目分组 API Key 吗？",
        a: "可以。切换到「按项目」标签页，点击齿轮图标打开配置面板。将 API Key 从「未分配 Key」区域拖拽到对应的自定义项目分组中即可。项目配置保存在浏览器本地存储中。",
      },
    ],
  },
};

/* ------------------------------------------------------------------ */
/*  生成器                                                              */
/* ------------------------------------------------------------------ */

/** 根据 locale 生成 SoftwareApplication JSON-LD */
export function buildSoftwareAppJsonLd(locale: Locale): Record<string, unknown> {
  const t = softwareAppSchema[locale];
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: t.name,
    version: t.version,
    operatingSystem: "Any (web browser)",
    applicationCategory: "DeveloperApplication",
    description: t.description,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
  };
}

/** 根据 locale 生成 FAQPage JSON-LD */
export function buildFaqJsonLd(locale: Locale): Record<string, unknown> {
  const t = faqSchema[locale];
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: t.questions.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.a,
      },
    })),
  };
}

/**
 * BreadcrumbList JSON-LD Schema 翻译
 *
 * 面包屑导航的多语言名称映射。
 */
const breadcrumbSchema: Record<Locale, { home: string; guideline: string; privacy: string; terms: string; changelog: string }> = {
  en: {
    home: "Agnes AI Usage Analytics Dashboard",
    guideline: "User Guide",
    privacy: "Privacy Policy",
    terms: "Terms of Use",
    changelog: "Changelog",
  },
  zh: {
    home: "Agnes AI 用量分析仪表盘",
    guideline: "使用指南",
    privacy: "隐私政策",
    terms: "使用条款",
    changelog: "更新日志",
  },
};

/**
 * 根据 locale 生成 BreadcrumbList JSON-LD
 *
 * 包含站点所有主要页面的面包屑导航，
 * 帮助搜索引擎理解站点层级结构。
 */
export function buildBreadcrumbJsonLd(locale: Locale): Record<string, unknown> {
  const t = breadcrumbSchema[locale];
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: t.home,
        item: SITE_URL,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: t.guideline,
        item: `${SITE_URL}/guideline`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: t.privacy,
        item: `${SITE_URL}/privacy`,
      },
      {
        "@type": "ListItem",
        position: 4,
        name: t.terms,
        item: `${SITE_URL}/terms`,
      },
      {
        "@type": "ListItem",
        position: 5,
        name: t.changelog,
        item: `${SITE_URL}/changelog`,
      },
    ],
  };
}

/** Organization Schema 翻译 */
const organizationSchema: Record<Locale, { name: string; description: string }> = {
  en: {
    name: "Agnes AI Usage Analytics Dashboard by Gavin & Mindrose Team",
    description:
      "Free, open-source, browser-side dashboard for Agnes AI usage analytics. Upload a usage CSV and get instant cost analysis.",
  },
  zh: {
    name: "Agnes AI 用量分析仪表盘 by Gavin & Mindrose Team",
    description:
      "免费、开源、纯浏览器端的 Agnes AI 用量分析仪表盘。上传 usage CSV 即可获取即时费用分析。",
  },
};

/**
 * 根据 locale 生成 Organization JSON-LD
 *
 * 帮助 Google 建立品牌实体识别（Knowledge Panel），
 * 通过 sameAs 链接关联 GitHub 等外部平台。
 */
export function buildOrganizationJsonLd(locale: Locale): Record<string, unknown> {
  const t = organizationSchema[locale];
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: t.name,
    url: SITE_URL,
    logo: `${SITE_URL}/ds-usage-logo.png`,
    description: t.description,
    sameAs: ["https://github.com/GavinCnod/deepseek-api-usage-analysis"],
  };
}
