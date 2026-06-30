/**
 * 姊妹项目链接配置模块
 *
 * 统一管理 Agnes 与 DeepSeek 两个分析工具之间的互跳地址、UTM 参数与品牌文案。
 * 这样站内入口、结构化数据与后续更多工具矩阵都能复用同一套来源。
 */

/** Agnes 站点公开地址。 */
const AGNES_SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://agnes-usage.xyz";

/** Agnes 开源仓库地址。 */
const AGNES_GITHUB_URL = "https://github.com/GavinCnod/agnes-api-usage-analysis";

/** DeepSeek 开源仓库地址。 */
const DEEPSEEK_GITHUB_URL =
  process.env.NEXT_PUBLIC_DEEPSEEK_GITHUB_URL ||
  "https://github.com/GavinCnod/deepseek-api-usage-analysis";

/**
 * DeepSeek 线上站点地址。
 *
 * 若当前尚未部署独立站点，则安全回退到仓库地址，避免前端出现无效链接。
 */
const DEEPSEEK_SITE_URL =
  process.env.NEXT_PUBLIC_DEEPSEEK_SITE_URL || DEEPSEEK_GITHUB_URL;

/** 工具矩阵品牌名。 */
export const TOOL_SERIES_NAME = "API Usage Analyzer Series";

/**
 * 为跨站链接追加 UTM 参数。
 *
 * @param baseUrl - 跳转目标地址
 * @param campaign - 本次入口对应的活动标识
 * @returns 带 UTM 参数的完整链接
 */
export function buildTrackedSisterUrl(baseUrl: string, campaign: string): string {
  const url = new URL(baseUrl);
  url.searchParams.set("utm_source", "agnes_site");
  url.searchParams.set("utm_medium", "referral");
  url.searchParams.set("utm_campaign", campaign);
  return url.toString();
}

/** Agnes 当前站点的对外品牌信息。 */
export const agnesProject = {
  name: "Agnes AI Usage Analytics",
  siteUrl: AGNES_SITE_URL,
  githubUrl: AGNES_GITHUB_URL,
} as const;

/** DeepSeek 姊妹工具的对外品牌信息。 */
export const deepseekProject = {
  name: "DeepSeek API Usage Analyzer",
  siteUrl: DEEPSEEK_SITE_URL,
  githubUrl: DEEPSEEK_GITHUB_URL,
  trackedSiteUrls: {
    header: buildTrackedSisterUrl(DEEPSEEK_SITE_URL, "sister_tool_header"),
    landing: buildTrackedSisterUrl(DEEPSEEK_SITE_URL, "sister_tool_landing"),
    footer: buildTrackedSisterUrl(DEEPSEEK_SITE_URL, "sister_tool_footer"),
  },
  trackedRepoUrls: {
    landing: buildTrackedSisterUrl(DEEPSEEK_GITHUB_URL, "sister_repo_landing"),
    footer: buildTrackedSisterUrl(DEEPSEEK_GITHUB_URL, "sister_repo_footer"),
  },
} as const;
