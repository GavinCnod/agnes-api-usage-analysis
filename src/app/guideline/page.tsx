import type { Metadata } from "next";
import { GuidelinePage } from "@/components/GuidelinePage";

/** 站点公开 URL（构建时从 .env 注入） */
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://agnes-usage.xyz";

/**
 * 动态生成指南页元数据（SEO）
 *
 * 为 /guideline 页面生成独立的 title、description、canonical URL、
 * OpenGraph 和 Twitter Card 元数据。
 */
export function generateMetadata(): Metadata {
  const title = "Agnes AI Usage Analytics — User Guide";
  const description =
    "Complete user guide for Agnes AI multimodal usage analytics. Learn how to export one Agnes usage CSV, understand the text-token/image/video three-metric layout, review relative-comparison charts, and navigate the four dashboard tabs.";

  return {
    title,
    description,
    alternates: {
      canonical: `${SITE_URL}/guideline`,
    },
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/guideline`,
      type: "website",
      siteName: "Agnes AI Usage Analytics Dashboard",
      locale: "en_US",
      alternateLocale: ["zh_CN"],
    },
    twitter: {
      card: "summary",
      site: "@GavinCnod",
      creator: "@GavinCnod",
      title,
      description,
    },
    keywords: [
      "Agnes AI usage guide",
      "Agnes AI dashboard tutorial",
      "Agnes AI CSV export",
      "Agnes AI multimodal analytics guide",
      "API cost analysis guide",
      "Agnes AI 多模态使用指南",
      "Agnes AI 使用指南",
    ],
    authors: [{ name: "Gavin & Mindrose Team" }],
    robots: {
      index: true,
      follow: true,
    },
  };
}

/**
 * 指南页路由
 *
 * 静态导出兼容的独立操作指南页面，包含：
 * - 完整操作手册内容（结构化文字块渲染）
 * - 与当前产品状态同步的中英双语文字指南
 * - 交互式目录导航
 * - 返回首页按钮
 * - SEO metadata + JSON-LD 结构化数据
 */
export default function GuidelineRoute() {
  return <GuidelinePage />;
}
