import type { Metadata } from "next";
import { TermsPage } from "@/components/TermsPage";
import TermsContent from "@/components/TermsContent";

/** 站点公开 URL（构建时从 .env 注入） */
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://agnes-usage.xyz";

/**
 * 动态生成使用条款页元数据（SEO）
 *
 * 为 /terms 页面生成独立的 title、description、canonical URL、
 * OpenGraph 和 Twitter Card 元数据。双语支持英文和中文版本。
 */
export function generateMetadata(): Metadata {
  const title = "Terms of Use — Agnes AI Usage Analytics Dashboard";
  const description =
    "Terms of Use for the Agnes AI Usage Analytics Dashboard. As-is open source software, no warranty, not affiliated with Agnes AI. Built by Gavin & MindRose Team.";

  return {
    title,
    description,
    alternates: {
      canonical: `${SITE_URL}/terms`,
    },
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/terms`,
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
    keywords: ["Agnes AI dashboard terms", "open source analytics terms", "Agnes AI 使用条款"],
    authors: [{ name: "Gavin & Mindrose Team" }],
    robots: {
      index: true,
      follow: true,
    },
  };
}

/**
 * 使用条款页路由
 *
 * 静态导出兼容的独立使用条款页面，包含：
 * - 完整使用条款内容（中英双语，通过 useTranslation 切换）
 * - 8 个章节：按现状提供、免责声明、与 Agnes AI 无关、用户数据与责任、开源许可、责任限制、条款变更、联系我们
 * - Apple 极简风格，与主应用一致
 * - 返回首页 + FooterBar
 * - SEO metadata + OpenGraph + Twitter Card
 */
export default function TermsRoute() {
  return (
    <>
      <TermsPage />
      <TermsContent />
    </>
  );
}
