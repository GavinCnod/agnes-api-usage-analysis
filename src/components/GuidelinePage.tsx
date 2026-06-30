"use client";

/**
 * GuidelinePage —— Agnes 操作手册页
 *
 * 该页面提供 Agnes AI Usage Analysis 的中英双语操作说明：
 * 1. 保留目录侧栏 + 正文内容区的结构；
 * 2. 保留旧截图资源作为迁移期示意图；
 * 3. 文案统一改为 Agnes 单 CSV 工作流；
 * 4. 支持基于滚动位置的目录高亮。
 */

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "@/i18n";
import TitleBar from "./TitleBar";
import FooterBar from "./FooterBar";

/**
 * 截图映射表。
 *
 * 当前迁移阶段沿用已有截图资源，只将文案改为 Agnes 语义。
 */
const SCREENSHOT_MAP: Record<number, string> = {
  1: "01-Ds-Api-Usage-Dashboard-Overview",
  3: "03-Drap-Drop-Csvs-Trigger-Analysis",
  4: "04-TitleBar",
  16: "16-Ds-Api-Usage-Dashboard-Overview",
  17: "17-Action-Buttons",
  20: "20-Total-Overview-Data",
  23: "23-Usage-Overview",
  24: "24-Usage-By-Key-Overview",
  28: "28-Trends-Of-Usage-Overview",
  29: "29-Trends-Of-Usage-Overview2",
};

/**
 * 内容块类型。
 */
type GuideBlock =
  | { type: "p"; text: string }
  | { type: "note"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "ol"; items: string[] }
  | { type: "table"; headers: string[]; rows: string[][] }
  | { type: "screenshot"; id: number; description: string };

/**
 * 手册章节。
 */
interface GuideSection {
  id: string;
  title: string;
  blocks: GuideBlock[];
}

/**
 * 手册正文数据。
 */
interface GuideDocument {
  title: string;
  subtitle: string;
  sections: GuideSection[];
  jsonLd: {
    name: string;
    description: string;
    steps: { name: string; text: string }[];
  };
}

/**
 * 将标题转换为锚点 ID。
 */
function toAnchorId(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^\w\u4e00-\u9fff\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

/**
 * 构造中文手册内容。
 */
function createZhGuide(): GuideDocument {
  const sections: GuideSection[] = [
    {
      id: toAnchorId("一、概述"),
      title: "一、概述",
      blocks: [
        {
          type: "p",
          text:
            "Agnes AI Usage Analysis 是一个纯浏览器端运行的 Agnes 用量分析工具。您只需上传单个 Agnes 用量 CSV，即可并列查看文本 Token、图片数量、视频时长，并继续分析请求数、费用、按 Key 明细、按项目聚合和趋势图表。",
        },
        {
          type: "ul",
          items: [
            "核心三维：文本 Token、图片数量、视频时长在首页和各分析页中并列展示",
            "费用总览：总费用、每日费用变化、各 Secret Key 费用占比",
            "用量统计：文本 Token、图片数量、视频时长、请求次数",
            "Key 明细：按 Secret Key 查看文本 Token、图片数量、视频时长、Cost、Requests",
            "项目归组：将多个 Secret Key 归入自定义项目，并保留多模态聚合结果",
            "趋势分析：在费用、文本 Token、图片数量、视频时长、请求数之间切换",
            "分享图片：为当前标签页生成 1200×630 分享图",
          ],
        },
        {
          type: "note",
          text:
            "当前页面中的截图仍沿用旧版资源，仅作为布局和操作位置示意；实际 Agnes 控制台导出界面可能不同，但不影响本文中的操作步骤。",
        },
        {
          type: "screenshot",
          id: 1,
          description: "概览页与整体布局示意。",
        },
      ],
    },
    {
      id: toAnchorId("二、快速开始"),
      title: "二、快速开始",
      blocks: [
        {
          type: "ol",
          items: [
            "登录 Agnes AI 控制台，打开 usage 或 billing 相关页面。",
            "导出用量 CSV。",
            "确认 CSV 至少包含 Type、Secret Key Name、Consumption Model、Consumption Amount(cents)、Consumption Quantity、Consumption Time、Consumption Status 这些列。",
            "将 CSV 拖拽到首页上传区域，或点击上传区域手动选择文件。",
            "等待解析完成，页面会自动切换到仪表盘。",
          ],
        },
        {
          type: "note",
          text:
            "当前版本只支持单个 CSV 文件，不需要 ZIP 解压，也不需要 amount / cost 双文件配对；只统计 Consumption Status=success 的记录，仪表盘固定为 Overview、By Project、By Key、Trends 四个标签页。",
        },
        {
          type: "table",
          headers: ["统计口径", "说明"],
          rows: [
            ["状态过滤", "仅统计 Consumption Status=success 的记录"],
            ["Quantity 解析", "从 input:xxx/output:yyy 中提取输入与输出 token"],
            ["费用口径", "Consumption Amount(cents) 按分解释，展示时换算为元"],
            ["缓存字段", "Agnes CSV 当前不提供缓存字段，因此没有 Cache 标签页"],
          ],
        },
        {
          type: "screenshot",
          id: 3,
          description: "上传区域与拖拽交互示意。",
        },
      ],
    },
    {
      id: toAnchorId("三、导航与基础界面"),
      title: "三、导航与基础界面",
      blocks: [
        {
          type: "table",
          headers: ["元素", "说明"],
          rows: [
            ["Logo", "应用图标"],
            ["应用名称", "Agnes AI Usage Analysis"],
            ["GitHub 图标", "打开项目仓库"],
            ["操作手册图标", "打开本页"],
            ["更新日志图标", "打开更新日志"],
            ["语言切换器", "EN / 中文"],
            ["主题切换器", "浅色 / 深色"],
          ],
        },
        {
          type: "screenshot",
          id: 4,
          description: "顶部导航栏示意。",
        },
        {
          type: "p",
          text:
            "上传成功后，页面会从落地页切换到仪表盘。顶部操作栏左侧显示当前文件名和日期范围，右侧提供“加载其他文件”和“清除”按钮。",
        },
        {
          type: "screenshot",
          id: 16,
          description: "仪表盘主视图示意。",
        },
        {
          type: "screenshot",
          id: 17,
          description: "文件信息与操作按钮示意。",
        },
        {
          type: "note",
          text:
            "错误横幅用于空文件、缺列、金额格式错误等阻断性问题；警告横幅用于数量串部分解析失败或非 success 记录被忽略等非阻断问题。",
        },
      ],
    },
    {
      id: toAnchorId("四、KPI 与筛选"),
      title: "四、KPI 与筛选",
      blocks: [
        {
          type: "table",
          headers: ["指标", "说明"],
          rows: [
            ["文本 Token", "所有文本 success 记录的 input + output 累计值"],
            ["图片数量", "所有 image success 记录的生成图片数"],
            ["视频时长", "所有 video success 记录的生成秒数"],
            ["总请求数", "success 记录条数"],
            ["总费用", "所有 success 记录换算后的费用总和"],
            ["活跃 Key 数", "出现在结果中的 Secret Key 数量"],
          ],
        },
        {
          type: "screenshot",
          id: 20,
          description: "KPI 区域示意。",
        },
        {
          type: "table",
          headers: ["标签页", "说明"],
          rows: [
            ["Overview", "查看三维 Hero，以及按当前指标切换的每日趋势和按 Key 分布"],
            ["By Project", "查看自定义项目归组后的三维 Hero 与项目级聚合结果"],
            ["By Key", "查看 Secret Key 维度的三维 Hero 与多指标明细"],
            ["Trends", "固定展示三维 Hero，并切换查看每日费用、文本 Token、图片数量、视频时长、请求数变化"],
          ],
        },
        {
          type: "p",
          text:
            "当 CSV 中包含多个模型时，KPI 下方会出现模型筛选器，可切换到单模型视角查看三项核心指标及其对应的图表、表格与排行。",
        },
      ],
    },
    {
      id: toAnchorId("五、各视图说明"),
      title: "五、各视图说明",
      blocks: [
        {
          type: "ul",
          items: [
            "Overview：Hero 固定并列展示文本 Token、图片数量、视频时长，下方图表再切换查看文本、图片、视频、请求数和费用。",
            "By Key：Hero 固定展示三项核心指标，表格可按文本 Token、图片数量、视频时长、Cost、Requests 排序，费用值支持一键复制。",
            "By Project：可将多个 Secret Key 归入自定义项目，并在项目级别查看文本 Token、图片数量、视频时长、Cost、Requests。",
            "Trends：Hero 不再只显示单一指标，而是固定并列展示三项核心指标；趋势图区域再承担每日费用、文本 Token、图片数量、视频时长、请求次数的切换。",
          ],
        },
        {
          type: "screenshot",
          id: 23,
          description: "Overview 图表布局示意。",
        },
        {
          type: "screenshot",
          id: 24,
          description: "By Key 表格示意。",
        },
        {
          type: "screenshot",
          id: 28,
          description: "Trends 视图示意。",
        },
        {
          type: "screenshot",
          id: 29,
          description: "Trends 视图的另一种显示状态示意。",
        },
      ],
    },
    {
      id: toAnchorId("六、分享图片"),
      title: "六、分享图片",
      blocks: [
        {
          type: "ol",
          items: [
            "点击标签栏右侧的分享按钮。",
            "填写署名，可选填写附言。",
            "在弹窗中预览卡片效果。",
            "复制到剪贴板，或下载 PNG 文件。",
          ],
        },
        {
          type: "ul",
          items: [
            "当前支持 Overview、By Project、By Key、Trends 四个标签页。",
            "分享卡会根据当前语言和主题切换文案与样式。",
            "二维码当前仍指向站点现有域名，这是迁移期的临时保留项。",
          ],
        },
      ],
    },
    {
      id: toAnchorId("七、CSV 字段说明"),
      title: "七、CSV 字段说明",
      blocks: [
        {
          type: "table",
          headers: ["列名", "用途"],
          rows: [
            ["Type", "记录类型"],
            ["Secret Key Name", "Key 维度展示名称"],
            ["Consumption Model", "模型筛选与模型统计来源"],
            ["Consumption Amount(cents)", "费用字段，按分换算"],
            ["Consumption Quantity", "解析 input / output token"],
            ["Consumption Time", "归一为日维度趋势"],
            ["Consumption Status", "仅 success 会参与统计"],
          ],
        },
        {
          type: "ul",
          items: [
            "常见 Quantity 示例：input:142064/output:85",
            "常见 Quantity 示例：input:55380/output:7",
            "如果某一行只解析出 input 或 output，系统会继续统计可解析部分，并给出 warning。",
          ],
        },
      ],
    },
    {
      id: toAnchorId("八、隐私与常见问题"),
      title: "八、隐私与常见问题",
      blocks: [
        {
          type: "table",
          headers: ["维度", "说明"],
          rows: [
            ["数据处理", "仅在浏览器本地完成"],
            ["文件上传", "不上传 CSV 内容"],
            ["第三方服务", "仅页面资源与可选 GA 脚本"],
            ["项目配置", "保存在本地浏览器存储"],
          ],
        },
        {
          type: "table",
          headers: ["问题", "可能原因", "建议"],
          rows: [
            ["上传后无反应", "不是 CSV 文件", "确认上传的是 Agnes 用量 CSV"],
            ["显示文件过大", "文件超过 50 MB", "检查是否误选了其他大文件"],
            ["提示缺列", "不是标准 Agnes 导出", "重新从 Agnes 控制台导出"],
            ["金额为 0", "原始导出本身金额为 0", "先核对 Agnes 控制台数据"],
            ["趋势缺少某些日期", "当天没有 success 调用", "属于正常现象"],
            ["某些行被忽略", "状态不是 success", "检查 Consumption Status 列"],
          ],
        },
      ],
    },
  ];

  return {
    title: "Agnes AI Usage Analysis — 用户操作手册",
    subtitle: "版本：v0.1.1 | 适用语言：中文 / English | 最后更新：2026-06-30",
    sections,
    jsonLd: {
      name: "Agnes AI Usage Analysis — 用户操作手册",
      description:
        "完整的 Agnes AI Usage Analysis 操作指南。学习如何导出 Agnes 用量 CSV、上传单个文件，并理解文本 Token、图片数量、视频时长三维并列展示，以及总览、项目、Key 和趋势视图。",
      steps: [
        {
          name: "导出 Agnes 用量 CSV",
          text: "前往 Agnes AI 控制台的 usage 或 billing 页面，导出包含 Secret Key、Model、Amount、Quantity、Time、Status 的用量 CSV。",
        },
        {
          name: "上传单个 CSV 文件",
          text: "将单个 Agnes 用量 CSV 拖拽到上传区域，或点击上传区域手动选择文件。",
        },
        {
          name: "查看分析结果",
          text: "即刻并列查看文本 Token、图片数量、视频时长，再结合请求数、费用、按项目与按 Key 明细，以及每日趋势完成分析；所有数据都在浏览器本地处理。",
        },
      ],
    },
  };
}

/**
 * 构造英文手册内容。
 */
function createEnGuide(): GuideDocument {
  const sections: GuideSection[] = [
    {
      id: toAnchorId("1. Overview"),
      title: "1. Overview",
      blocks: [
        {
          type: "p",
          text:
            "Agnes AI Usage Analysis is a browser-side analytics tool for Agnes usage exports. Upload one Agnes usage CSV and you can immediately inspect text tokens, image counts, video seconds, requests, cost, key-level breakdowns, project grouping, and daily trends.",
        },
        {
          type: "ul",
          items: [
            "Core three-metric layout: text tokens, image counts, and video seconds stay visible side by side across the dashboard",
            "Cost overview: total cost, daily cost trend, cost split by Secret Key",
            "Usage metrics: text tokens, image counts, video seconds, and requests",
            "Key breakdown: per-key text tokens, image counts, video seconds, cost, and requests",
            "Project grouping: aggregate multiple Secret Keys into custom projects with multimodal totals preserved",
            "Trend charts: switch between cost, text tokens, image counts, video seconds, and requests",
            "Share cards: export a 1200×630 infographic for the current tab",
          ],
        },
        {
          type: "note",
          text:
            "The screenshots on this page are legacy visual references kept during the migration. The real Agnes console export screen may look different.",
        },
        {
          type: "screenshot",
          id: 1,
          description: "Overall dashboard layout reference.",
        },
      ],
    },
    {
      id: toAnchorId("2. Quick Start"),
      title: "2. Quick Start",
      blocks: [
        {
          type: "ol",
          items: [
            "Sign in to the Agnes AI console and open the usage or billing page.",
            "Export the usage CSV.",
            "Make sure the CSV includes Type, Secret Key Name, Consumption Model, Consumption Amount(cents), Consumption Quantity, Consumption Time, and Consumption Status.",
            "Drag the CSV into the homepage uploader, or click the uploader to choose the file manually.",
            "Wait for parsing to finish. The page automatically switches into dashboard mode.",
          ],
        },
        {
          type: "note",
          text:
            "The current version supports one CSV file only. No ZIP extraction and no amount/cost file pairing are required. Only rows with Consumption Status=success are counted, and the dashboard scope stays fixed to Overview, By Project, By Key, and Trends.",
        },
        {
          type: "table",
          headers: ["Counting Rule", "Description"],
          rows: [
            ["Status filter", "Only rows with Consumption Status=success are counted"],
            ["Quantity parsing", "Input and output tokens are extracted from input:xxx/output:yyy"],
            ["Cost handling", "Consumption Amount(cents) is treated as cents and converted to Yuan"],
            ["Cache fields", "Agnes CSV currently does not expose cache fields, so there is no Cache tab"],
          ],
        },
        {
          type: "screenshot",
          id: 3,
          description: "Upload area and drag-and-drop interaction.",
        },
      ],
    },
    {
      id: toAnchorId("3. Navigation And Base Layout"),
      title: "3. Navigation And Base Layout",
      blocks: [
        {
          type: "table",
          headers: ["Element", "Description"],
          rows: [
            ["Logo", "Application icon"],
            ["App Name", "Agnes AI Usage Analysis"],
            ["GitHub Icon", "Opens the repository"],
            ["Guide Icon", "Opens this page"],
            ["Changelog Icon", "Opens the changelog"],
            ["Language Switcher", "EN / 中文"],
            ["Theme Switcher", "Light / Dark"],
          ],
        },
        {
          type: "screenshot",
          id: 4,
          description: "Top navigation reference.",
        },
        {
          type: "p",
          text:
            "After the CSV is parsed successfully, the landing page switches into dashboard mode. The action bar shows the current filename and date range, plus actions for loading another file or clearing the result.",
        },
        {
          type: "screenshot",
          id: 16,
          description: "Dashboard main view reference.",
        },
        {
          type: "screenshot",
          id: 17,
          description: "File info and action bar reference.",
        },
        {
          type: "note",
          text:
            "Error banners are used for blocking issues such as empty files, missing columns, or malformed amount values. Warning banners are used for partial quantity parsing or ignored non-success statuses.",
        },
      ],
    },
    {
      id: toAnchorId("4. KPI Strip And Filtering"),
      title: "4. KPI Strip And Filtering",
      blocks: [
        {
          type: "table",
          headers: ["Metric", "Description"],
          rows: [
            ["Text Tokens", "Combined input + output tokens from counted text rows"],
            ["Image Count", "Generated images from counted image rows"],
            ["Video Seconds", "Generated duration from counted video rows"],
            ["Total Requests", "Number of counted success rows"],
            ["Total Cost", "Sum of all counted success rows"],
            ["Active Keys", "Number of Secret Keys in the result"],
          ],
        },
        {
          type: "screenshot",
          id: 20,
          description: "KPI strip reference.",
        },
        {
          type: "table",
          headers: ["Tab", "Description"],
          rows: [
            ["Overview", "Inspect the three-metric hero plus switchable daily and by-key comparisons"],
            ["By Project", "Inspect the three-metric hero and project-level aggregation"],
            ["By Key", "Inspect the three-metric hero and key-level multi-metric details"],
            ["Trends", "Keep the three-metric hero fixed while switching daily cost, text tokens, image counts, video seconds, and requests"],
          ],
        },
        {
          type: "p",
          text:
            "When the CSV contains multiple models, a model filter appears below the tabs so you can inspect the three core metrics and supporting comparisons for one model or for all models combined.",
        },
      ],
    },
    {
      id: toAnchorId("5. View Guide"),
      title: "5. View Guide",
      blocks: [
        {
          type: "ul",
          items: [
            "Overview: the hero keeps text tokens, image counts, and video seconds visible together, while the charts switch across text, image, video, requests, and cost.",
            "By Key: the hero keeps the three core metrics fixed, and the table can sort by text tokens, image counts, video seconds, cost, and requests for each Secret Key.",
            "By Project: multiple Secret Keys can be grouped into custom projects to inspect project-level text tokens, image counts, video seconds, cost, and requests.",
            "Trends: the hero no longer collapses into one metric. Instead, it keeps the three core metrics side by side while the chart switches across daily cost, text tokens, image counts, video seconds, and requests.",
          ],
        },
        {
          type: "screenshot",
          id: 23,
          description: "Overview chart layout.",
        },
        {
          type: "screenshot",
          id: 24,
          description: "By Key table reference.",
        },
        {
          type: "screenshot",
          id: 28,
          description: "Trends view reference.",
        },
        {
          type: "screenshot",
          id: 29,
          description: "Alternate trends state reference.",
        },
      ],
    },
    {
      id: toAnchorId("6. Share Cards"),
      title: "6. Share Cards",
      blocks: [
        {
          type: "ol",
          items: [
            "Click the Share button on the right side of the tab bar.",
            "Enter a signature name and optionally add a short message.",
            "Review the live preview inside the modal.",
            "Copy the image to clipboard or download a PNG file.",
          ],
        },
        {
          type: "ul",
          items: [
            "The current version supports Overview, By Project, By Key, and Trends.",
            "Share cards follow the current locale and theme.",
            "The QR code still points to the existing site domain as a temporary migration-era external link.",
          ],
        },
      ],
    },
    {
      id: toAnchorId("7. CSV Schema Notes"),
      title: "7. CSV Schema Notes",
      blocks: [
        {
          type: "table",
          headers: ["Column", "Purpose"],
          rows: [
            ["Type", "Record type"],
            ["Secret Key Name", "Display name for key-level views"],
            ["Consumption Model", "Source for model filtering"],
            ["Consumption Amount(cents)", "Cost field converted from cents"],
            ["Consumption Quantity", "Parsed into input/output tokens"],
            ["Consumption Time", "Normalized into daily trends"],
            ["Consumption Status", "Only success rows are counted"],
          ],
        },
        {
          type: "ul",
          items: [
            "Typical quantity value: input:142064/output:85",
            "Typical quantity value: input:55380/output:7",
            "If only one side of the quantity can be parsed, the valid part is still counted and a warning is emitted.",
          ],
        },
      ],
    },
    {
      id: toAnchorId("8. Privacy And Troubleshooting"),
      title: "8. Privacy And Troubleshooting",
      blocks: [
        {
          type: "table",
          headers: ["Area", "Description"],
          rows: [
            ["Data processing", "Runs locally in the browser"],
            ["Uploads", "CSV contents are not uploaded"],
            ["Third-party services", "Only page assets and optional GA script"],
            ["Project config", "Stored in local browser storage"],
          ],
        },
        {
          type: "table",
          headers: ["Problem", "Possible Cause", "Suggestion"],
          rows: [
            ["Nothing happens after upload", "Not a CSV file", "Upload an Agnes usage CSV"],
            ["File too large", "File exceeds 50 MB", "Check whether you selected the wrong file"],
            ["Missing column error", "Not a standard Agnes export", "Re-export from the Agnes console"],
            ["Cost is 0", "The source export also shows 0", "Verify the original Agnes data"],
            ["Missing dates in trends", "No success calls on that day", "This is normal"],
            ["Some rows are ignored", "Status is not success", "Check the Consumption Status column"],
          ],
        },
      ],
    },
  ];

  return {
    title: "Agnes AI Usage Analysis — User Guide",
    subtitle: "Version: v0.1.1 | Language: English / 中文 | Last Updated: 2026-06-30",
    sections,
    jsonLd: {
      name: "Agnes AI Usage Analysis — User Guide",
      description:
        "Complete user guide for Agnes AI Usage Analysis. Learn how to export an Agnes usage CSV, upload a single file, understand the side-by-side text-token/image/video layout, and navigate the overview, project, key, and trends views.",
      steps: [
        {
          name: "Export an Agnes usage CSV",
          text: "Open the Agnes AI console usage or billing page and export the CSV containing Secret Key, Model, Amount, Quantity, Time, and Status columns.",
        },
        {
          name: "Upload a single CSV file",
          text: "Drag a single Agnes usage CSV onto the upload area, or click the uploader to choose a file manually.",
        },
        {
          name: "View analytics",
          text: "Inspect text tokens, image counts, and video seconds side by side, then compare requests, cost, project and key breakdowns, plus daily trends. All processing stays in the browser.",
        },
      ],
    },
  };
}

/**
 * GuidelinePage 组件。
 */
export function GuidelinePage() {
  const { locale, t } = useTranslation();
  const [activeSection, setActiveSection] = useState<string>("");

  /**
   * 根据当前语言返回手册正文。
   */
  const guide = useMemo<GuideDocument>(() => {
    return locale === "zh" ? createZhGuide() : createEnGuide();
  }, [locale]);

  /**
   * 生成当前语言的截图路径。
   */
  const getScreenshotSrc = (id: number): string => {
    const base = SCREENSHOT_MAP[id];
    if (!base) {
      return "";
    }
    const localeSuffix = locale === "zh" ? "cn" : "en";
    return `/guideline/${base}-${localeSuffix}.png`;
  };

  /**
   * 渲染单个内容块。
   */
  const renderBlock = (block: GuideBlock, key: string) => {
    if (block.type === "p") {
      return (
        <p
          key={key}
          className="text-sm leading-7 text-pretty mb-4"
          style={{ color: "var(--text-secondary)" }}
        >
          {block.text}
        </p>
      );
    }

    if (block.type === "note") {
      return (
        <blockquote
          key={key}
          className="text-sm leading-7 pl-4 mb-4"
          style={{
            color: "var(--text-secondary)",
            borderLeft: "2px solid var(--border)",
          }}
        >
          {block.text}
        </blockquote>
      );
    }

    if (block.type === "ul") {
      return (
        <ul
          key={key}
          className="list-disc pl-5 space-y-2 mb-4 text-sm leading-7"
          style={{ color: "var(--text-secondary)" }}
        >
          {block.items.map((item) => (
            <li key={`${key}-${item}`}>{item}</li>
          ))}
        </ul>
      );
    }

    if (block.type === "ol") {
      return (
        <ol
          key={key}
          className="list-decimal pl-5 space-y-2 mb-4 text-sm leading-7"
          style={{ color: "var(--text-secondary)" }}
        >
          {block.items.map((item) => (
            <li key={`${key}-${item}`}>{item}</li>
          ))}
        </ol>
      );
    }

    if (block.type === "table") {
      return (
        <div key={key} className="overflow-x-auto mb-5">
          <table
            className="min-w-full text-sm"
            style={{ borderCollapse: "collapse" }}
          >
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                {block.headers.map((header) => (
                  <th
                    key={`${key}-${header}`}
                    className="text-left py-2 pr-4 font-semibold"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, rowIndex) => (
                <tr
                  key={`${key}-row-${rowIndex}`}
                  style={{ borderBottom: "1px solid var(--border)" }}
                >
                  {row.map((cell, cellIndex) => (
                    <td
                      key={`${key}-cell-${rowIndex}-${cellIndex}`}
                      className="py-2 pr-4 align-top leading-6"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    return (
      <figure key={key} className="mb-6">
        <div
          className="rounded-subtle overflow-hidden"
          style={{ border: "1px solid var(--border)" }}
        >
          <Image
            src={getScreenshotSrc(block.id)}
            alt={block.description}
            width={1400}
            height={900}
            className="w-full h-auto"
            unoptimized
          />
        </div>
        <figcaption
          className="text-xs mt-2"
          style={{ color: "var(--text-tertiary)" }}
        >
          {block.description}
        </figcaption>
      </figure>
    );
  };

  /**
   * 根据滚动位置更新当前激活章节。
   */
  useEffect(() => {
    const elements = guide.sections
      .map((section) => document.getElementById(section.id))
      .filter((element): element is HTMLElement => element !== null);

    if (elements.length === 0) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

        if (visible[0]?.target?.id) {
          setActiveSection(visible[0].target.id);
        }
      },
      {
        rootMargin: "-20% 0px -60% 0px",
        threshold: [0.1, 0.3, 0.6],
      }
    );

    elements.forEach((element) => observer.observe(element));

    return () => {
      observer.disconnect();
    };
  }, [guide.sections]);

  const guidelineJsonLd = useMemo(() => {
    return {
      "@context": "https://schema.org",
      "@type": "HowTo",
      name: guide.jsonLd.name,
      description: guide.jsonLd.description,
      step: guide.jsonLd.steps.map((step, index) => ({
        "@type": "HowToStep",
        position: index + 1,
        name: step.name,
        text: step.text,
      })),
    };
  }, [guide]);

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(guidelineJsonLd) }}
      />

      <TitleBar />

      <div className="max-w-6xl mx-auto px-6 py-8">
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
          {t.guideline.backToHome}
        </Link>

        <div className="lg:flex lg:items-start lg:gap-12">
          <aside className="hidden lg:block w-64 shrink-0 sticky top-24">
            <p
              className="text-[11px] uppercase tracking-[0.16em] mb-4"
              style={{ color: "var(--text-tertiary)" }}
            >
              {t.guideline.toc}
            </p>
            <nav>
              <ul className="space-y-2">
                {guide.sections.map((section) => {
                  const isActive = activeSection === section.id;
                  return (
                    <li key={section.id}>
                      <a
                        href={`#${section.id}`}
                        className="text-sm transition-colors duration-200"
                        style={{
                          color: isActive
                            ? "var(--text-primary)"
                            : "var(--text-secondary)",
                        }}
                      >
                        {section.title}
                      </a>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </aside>

          <main className="flex-1 min-w-0">
            <h1
              className="text-2xl font-bold tracking-tight mb-2"
              style={{
                color: "var(--text-primary)",
                letterSpacing: "-0.03em",
              }}
              translate="no"
            >
              {guide.title}
            </h1>

            <p
              className="text-xs mb-8"
              style={{ color: "var(--text-tertiary)" }}
            >
              {guide.subtitle}
            </p>

            {guide.sections.map((section) => (
              <section
                key={section.id}
                id={section.id}
                className="scroll-mt-24 mb-12"
              >
                <h2
                  className="text-lg font-bold tracking-tight mb-4 pb-2"
                  style={{
                    color: "var(--text-primary)",
                    letterSpacing: "-0.02em",
                    borderBottom: "1px solid var(--border)",
                  }}
                >
                  {section.title}
                </h2>
                {section.blocks.map((block, index) =>
                  renderBlock(block, `${section.id}-${index}`)
                )}
              </section>
            ))}

            <hr className="my-12" style={{ borderColor: "var(--border)" }} />

            <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
              {t.guideline.footerNote.split("{githubLink}")[0]}
              <a
                href="https://github.com/GavinCnod/agnes-api-usage-analysis/issues"
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-2 transition-colors duration-200"
                style={{ color: "var(--text-secondary)" }}
              >
                GitHub Issues
              </a>
              {t.guideline.footerNote.split("{githubLink}")[1]}
            </p>
          </main>
        </div>
      </div>

      <FooterBar />
    </div>
  );
}
