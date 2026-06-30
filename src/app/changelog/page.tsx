import type { Metadata } from "next";
import { ChangelogPage } from "@/components/ChangelogPage";
import ChangelogContent from "@/components/ChangelogContent";

/** 站点公开 URL（构建时从 .env 注入） */
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://agnes-usage.xyz";

/**
 * 动态生成更新日志页元数据（SEO）
 *
 * 为 /changelog 页面生成独立的 title、description、canonical URL、
 * OpenGraph 和 Twitter Card 元数据。
 */
export function generateMetadata(): Metadata {
  const title = "Changelog — Agnes AI Usage Analytics Dashboard";
  const description =
    "Complete changelog for the Agnes AI Usage Analytics Dashboard. Track all new features, improvements, bug fixes, and dependency changes from v0.1.0 through v0.1.1. Built by Gavin & MindRose Team.";

  return {
    title,
    description,
    alternates: {
      canonical: `${SITE_URL}/changelog`,
    },
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/changelog`,
      type: "website",
      siteName: "Agnes AI Usage Analytics Dashboard",
      locale: "en_US",
      alternateLocale: ["zh_CN"],
      images: [
        {
          url: `${SITE_URL}/agnes-usage-logo.png`,
          width: 512,
          height: 512,
          alt: "Agnes AI Usage Analytics Dashboard logo",
          type: "image/png",
        },
      ],
    },
    twitter: {
      card: "summary",
      site: "@GavinCnod",
      creator: "@GavinCnod",
      title,
      description,
      images: [`${SITE_URL}/agnes-usage-logo.png`],
    },
    keywords: ["Agnes AI dashboard changelog", "API analytics release notes", "Agnes AI 更新日志"],
    authors: [{ name: "Gavin & Mindrose Team" }],
    robots: {
      index: true,
      follow: true,
    },
  };
}

/**
 * 更新日志页路由
 *
 * 静态导出兼容的独立更新日志页面，包含：
 * - 自 v0.1.0 至 v0.1.1 的完整版本变更记录
 * - 按类别（新增/改进/修复/依赖）分组展示
 * - Apple 极简风格，与主应用一致
 * - 返回首页 + FooterBar
 * - SEO metadata + OpenGraph + Twitter Card
 */
export default function ChangelogRoute() {
  return <ChangelogPage />;
}
