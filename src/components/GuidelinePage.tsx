"use client";

/**
 * 文件说明：
 * Agnes 操作手册页，提供与当前产品行为一致的中英双语文字指南。
 *
 * 当前版本的目标：
 * 1. 保留目录侧栏 + 正文内容区的结构；
 * 2. 手册内容与最新 Agnes 单 CSV 产品逻辑保持同步；
 * 3. 暂时移除所有截图与图片引用，仅保留文字说明；
 * 4. 支持基于滚动位置的目录高亮与 JSON-LD 结构化数据。
 */

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "@/i18n";
import TitleBar from "./TitleBar";
import FooterBar from "./FooterBar";

/**
 * 内容块类型。
 */
type GuideBlock =
  | { type: "p"; text: string }
  | { type: "note"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "ol"; items: string[] }
  | { type: "table"; headers: string[]; rows: string[][] };

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
            "Agnes AI Usage Analysis 是一个纯浏览器端运行的 Agnes 用量分析工具。您只需上传单个 Agnes 用量 CSV，即可并列查看文本 Token、图片数量、视频时长，并继续分析请求数、费用、按 Key 明细、按自定义项目聚合和每日趋势。",
        },
        {
          type: "ul",
          items: [
            "三项核心指标始终并列展示：文本 Token 总量、生成图片数量、生成视频总长度（秒）",
            "Overview 与 Trends 已改为“相对对比”视图，用同一张图比较多种量纲，并可悬浮查看真实数值",
            "费用统一按美元（$）展示，来源于 `Consumption Amount(cents)` 的分值换算",
            "By Key 与按自定义项目视图支持按文本、图片、视频、费用、请求数排序，费用值支持一键复制",
            "分享功能支持四个标签页，并会随当前语言与主题自动切换卡片内容",
            "所有 CSV 解析、统计与图表渲染都在浏览器本地完成，不上传原始数据",
          ],
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
            "导出单个用量 CSV 文件。",
            "确认 CSV 至少包含 Type、Secret Key Name、Consumption Model、Consumption Amount(cents)、Consumption Quantity、Consumption Time、Consumption Status 这些列。",
            "将 CSV 拖拽到首页上传区域，或点击上传区域手动选择文件。",
            "等待解析完成，页面会自动从落地页切换到仪表盘。",
          ],
        },
        {
          type: "note",
          text:
            "当前版本只支持单个 CSV 文件，且单文件不能超过 50 MB；不需要 ZIP 解压，也不需要 amount / cost 双文件配对。只统计 `Consumption Status=success` 的记录，仪表盘固定为四个标签页：总览、按自定义项目、按 Key、趋势。",
        },
        {
          type: "table",
          headers: ["统计口径", "说明"],
          rows: [
            ["状态过滤", "仅统计 `Consumption Status=success` 的记录"],
            ["文本数量解析", "从 `input:xxx/output:yyy` 中提取输入与输出 token"],
            ["多模态数量解析", "支持 `images:n` 与 `video_seconds:n`，分别统计图片数量与视频时长"],
            ["费用口径", "`Consumption Amount(cents)` 按分解释，展示时换算为美元（$）"],
            ["缓存字段", "Agnes CSV 当前不提供缓存字段，因此没有 Cache 标签页"],
          ],
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
          type: "p",
          text:
            "上传前的首页当前按“上传区 → 使用方式 → 常见问题 → 关于我们”的顺序组织内容，已移除早期落地页里额外的三维主展示区块。上传成功后，页面会切换到仪表盘，顶部操作栏左侧显示当前文件名和日期范围，右侧提供“加载其他文件”和“清除”按钮。",
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
            ["文本 Token 总量", "所有文本 success 记录的 input + output 累计值"],
            ["生成图片数量", "所有 image success 记录的生成图片数"],
            ["生成视频总长度（秒）", "所有 video success 记录的生成秒数"],
            ["总请求数", "success 记录条数"],
            ["总费用", "所有 success 记录换算后的美元费用总和"],
            ["活跃 Key 数", "出现在结果中的 Secret Key 数量"],
          ],
        },
        {
          type: "table",
          headers: ["标签页", "说明"],
          rows: [
            ["总览", "固定展示三项核心指标，并在下方显示“每日核心指标（相对对比）”和“各 Key 核心指标对比（相对对比）”"],
            ["按自定义项目", "固定展示三项核心指标，并查看项目级多模态聚合表与项目配置入口"],
            ["按 Key", "固定展示三项核心指标，并查看 Secret Key 维度的多指标明细表"],
            ["趋势", "固定展示三项核心指标，并在下方显示“核心指标趋势（相对对比）”折线图"],
          ],
        },
        {
          type: "p",
          text:
            "当 CSV 中包含多个模型时，标签栏下方会出现模型筛选器。您可以切换到“全部模型”或单个模型视角查看三项核心指标及其对应的图表、表格与排行。",
        },
        {
          type: "note",
          text:
            "当前三维 Hero 已改为更克制的居中排版：不再显示 eyebrow，小字说明统一放在三项指标下方一行展示。",
        },
      ],
    },
    {
      id: toAnchorId("五、各视图与项目配置"),
      title: "五、各视图与项目配置",
      blocks: [
        {
          type: "ul",
          items: [
            "总览：顶部 Hero 始终并列展示三项核心指标；下方两张图都使用“相对对比”模式，不再切换单一核心指标视角。",
            "按 Key：支持按文本 Token、图片数量、视频时长、费用、请求数排序；表头与顶部排序按钮联动，右侧进度条跟随当前排序指标变化。",
            "按自定义项目：支持将多个 Secret Key 聚合为业务项目；未分配的 Key 会归入“未分类”。",
            "趋势：顶部 Hero 固定展示三项核心指标；下方使用一张三线合并趋势图展示不同量纲的相对变化，不再回到旧版单指标趋势页。",
          ],
        },
        {
          type: "ol",
          items: [
            "切换到“按自定义项目”标签页，点击右上角 `配置`。",
            "新增项目名称，或删除不需要的项目。",
            "将 Key 从“未分配 Key”区域拖拽到目标项目，或通过每个未分配 Key 右侧的下拉菜单分配。",
            "点击 `保存` 后，项目配置会持久化到当前浏览器的本地存储。",
          ],
        },
        {
          type: "note",
          text:
            "按 Key 与按自定义项目的费用列都支持点击复制，便于在汇报、沟通或二次整理时直接复用数值。",
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
            "填写署名（必填），可选填写附言。",
            "在弹窗中预览卡片效果；系统会等待图表准备完成后再允许导出。",
            "复制到剪贴板，或下载 PNG 文件。",
          ],
        },
        {
          type: "ul",
          items: [
            "当前支持总览、按自定义项目、按 Key、趋势四个标签页。",
            "分享卡会根据当前语言和主题切换文案与样式，卡片上的核心指标会跟随当前筛选结果实时更新。",
            "总览与趋势分享图会展示“相对对比”相关说明，并补充峰值、最低值或日均等静态标注，便于离开悬浮交互后继续阅读。",
            "二维码当前仍指向站点现有域名，这是现阶段保留的外部链接设置。",
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
            ["Type", "记录类型，决定按文本 / 图片 / 视频等方式统计"],
            ["Secret Key Name", "Key 维度展示名称，也是项目分组的基础字段"],
            ["Consumption Model", "模型筛选与模型统计来源"],
            ["Consumption Amount(cents)", "费用字段，按分换算为美元"],
            ["Consumption Quantity", "解析文本 token、图片数量、视频时长"],
            ["Consumption Time", "归一为日维度趋势"],
            ["Consumption Status", "仅 success 会参与统计"],
          ],
        },
        {
          type: "ul",
          items: [
            "常见文本 Quantity 示例：`input:142064/output:85`",
            "常见图片 Quantity 示例：`images:3`",
            "常见视频 Quantity 示例：`video_seconds:180`",
            "如果某一行只解析出部分数量，系统会继续统计可解析部分，并给出 warning。",
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
            ["项目配置", "保存在当前浏览器的本地存储中"],
          ],
        },
        {
          type: "table",
          headers: ["问题", "可能原因", "建议"],
          rows: [
            ["上传后无反应", "不是 CSV 文件", "确认上传的是 Agnes 用量 CSV"],
            ["显示文件过大", "文件超过 50 MB", "检查是否误选了其他大文件"],
            ["提示缺列", "不是标准 Agnes 导出", "重新从 Agnes 控制台导出"],
            ["某个核心指标为 0", "当前 CSV、模型筛选或日期范围没有该模态记录", "先核对是否存在文本、图片或视频调用"],
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
        "完整的 Agnes AI Usage Analysis 操作指南。学习如何导出 Agnes 用量 CSV、上传单个文件，理解三项核心指标并列展示、相对对比图表、按自定义项目分组，以及总览、按 Key 和趋势视图。",
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
          text: "即刻并列查看文本 Token、图片数量、视频时长，再结合请求数、费用、按自定义项目与按 Key 明细，以及每日趋势完成分析；所有数据都在浏览器本地处理。",
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
            "Agnes AI Usage Analysis is a browser-side analytics tool for Agnes usage exports. Upload one Agnes usage CSV and you can immediately inspect text tokens, image counts, video seconds, requests, cost, key-level breakdowns, custom project grouping, and daily trends.",
        },
        {
          type: "ul",
          items: [
            "The three core metrics always stay side by side: Total Text Tokens, Generated Images, and Video Length (s)",
            "Overview and Trends now use Relative Comparison charts so different units can be compared together while hover still shows real values",
            "Cost is shown in US dollars ($), converted from `Consumption Amount(cents)`",
            "By Key and By Custom Projects support sorting by text, image, video, cost, and requests, and cost values can be copied in one click",
            "Share cards support all four tabs and automatically follow the current locale and theme",
            "All CSV parsing, aggregation, and chart rendering stay in the browser and never upload your raw file",
          ],
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
            "Export a single usage CSV file.",
            "Make sure the CSV includes Type, Secret Key Name, Consumption Model, Consumption Amount(cents), Consumption Quantity, Consumption Time, and Consumption Status.",
            "Drag the CSV into the homepage uploader, or click the uploader to choose the file manually.",
            "Wait for parsing to finish. The page automatically switches from the landing page into dashboard mode.",
          ],
        },
        {
          type: "note",
          text:
            "The current version supports one CSV file only, with a 50 MB limit per file. No ZIP extraction and no amount/cost file pairing are required. Only rows with `Consumption Status=success` are counted, and the dashboard stays fixed to four tabs: Overview, By Custom Projects, By Key, and Trends.",
        },
        {
          type: "table",
          headers: ["Counting Rule", "Description"],
          rows: [
            ["Status filter", "Only rows with `Consumption Status=success` are counted"],
            ["Text quantity parsing", "Input and output tokens are extracted from `input:xxx/output:yyy`"],
            ["Multimodal quantity parsing", "`images:n` and `video_seconds:n` are supported for image count and video duration"],
            ["Cost handling", "`Consumption Amount(cents)` is treated as cents and converted to US dollars ($)"],
            ["Cache fields", "Agnes CSV currently does not expose cache fields, so there is no Cache tab"],
          ],
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
          type: "p",
          text:
            "Before upload, the landing page now follows the sequence Upload Area → How It Works → FAQ → About, and the earlier extra three-metric showcase block has been removed. After a CSV is parsed successfully, the page switches into dashboard mode. The action bar shows the current filename and date range, plus actions for loading another file or clearing the result.",
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
            ["Total Text Tokens", "Combined input + output tokens from counted text rows"],
            ["Generated Images", "Generated images from counted image rows"],
            ["Video Length (s)", "Generated duration from counted video rows"],
            ["Total Requests", "Number of counted success rows"],
            ["Total Cost", "Sum of all counted success rows in USD"],
            ["Active Keys", "Number of Secret Keys in the result"],
          ],
        },
        {
          type: "table",
          headers: ["Tab", "Description"],
          rows: [
            ["Overview", "Shows the fixed three-metric hero plus Daily Core Metrics and Core Metrics by API Key in Relative Comparison mode"],
            ["By Custom Projects", "Shows the fixed three-metric hero plus project-level multimodal aggregation and project setup entry"],
            ["By Key", "Shows the fixed three-metric hero plus the key-level multi-metric detail table"],
            ["Trends", "Shows the fixed three-metric hero plus the Core Metrics Trend Relative Comparison line chart"],
          ],
        },
        {
          type: "p",
          text:
            "When the CSV contains multiple models, a model filter appears below the tab bar. You can switch between All Models and a single model to inspect the same core metrics, tables, and comparisons from a narrower scope.",
        },
        {
          type: "note",
          text:
            "The three-metric hero now uses a more restrained centered layout: there is no eyebrow label anymore, and auxiliary notes sit on one line below the metric grid.",
        },
      ],
    },
    {
      id: toAnchorId("5. Views And Project Setup"),
      title: "5. Views And Project Setup",
      blocks: [
        {
          type: "ul",
          items: [
            "Overview: the hero always keeps the three core metrics visible together, and both charts below now stay in Relative Comparison mode instead of switching through one core metric at a time.",
            "By Key: supports sorting by text tokens, image counts, video seconds, cost, and requests; the table header, top sorting pills, and progress bars all stay linked to the same active metric.",
            "By Custom Projects: lets you aggregate multiple Secret Keys into business projects, while any remaining keys fall back to Uncategorized.",
            "Trends: keeps the hero fixed and uses one combined three-line chart to compare relative changes across units, instead of returning to the older single-metric trend flow.",
          ],
        },
        {
          type: "ol",
          items: [
            "Open the By Custom Projects tab and click `Configure`.",
            "Add project names or remove projects you no longer need.",
            "Drag keys from the Unassigned Keys area into a target project, or assign them through the dropdown next to each unassigned key.",
            "Click `Save` to persist the project configuration into local browser storage.",
          ],
        },
        {
          type: "note",
          text:
            "The cost column in both By Key and By Custom Projects can be clicked to copy the displayed value, which is convenient for reporting and follow-up analysis.",
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
            "Enter a signature name (required) and optionally add a short message.",
            "Review the live preview inside the modal. Export actions stay disabled until the charts are ready.",
            "Copy the image to clipboard or download a PNG file.",
          ],
        },
        {
          type: "ul",
          items: [
            "The current version supports Overview, By Custom Projects, By Key, and Trends.",
            "Share cards follow the current locale and theme, and the hero metrics on the card update with the active filtered result.",
            "Overview and Trends share cards include Relative Comparison context plus static annotations such as peak, lowest, or daily average so the image still reads clearly outside hover interactions.",
            "The QR code still points to the existing site domain. This external link remains intentionally preserved for now.",
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
            ["Type", "Record type used to classify text, image, video, and related rows"],
            ["Secret Key Name", "Display name for key-level views and the basis for project grouping"],
            ["Consumption Model", "Source for model filtering and model stats"],
            ["Consumption Amount(cents)", "Cost field converted from cents into USD"],
            ["Consumption Quantity", "Parsed into text tokens, image counts, and video duration"],
            ["Consumption Time", "Normalized into daily trends"],
            ["Consumption Status", "Only success rows are counted"],
          ],
        },
        {
          type: "ul",
          items: [
            "Typical text quantity value: `input:142064/output:85`",
            "Typical image quantity value: `images:3`",
            "Typical video quantity value: `video_seconds:180`",
            "If only part of a quantity string can be parsed, the valid part is still counted and a warning is emitted.",
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
            ["Project config", "Stored in the current browser's local storage"],
          ],
        },
        {
          type: "table",
          headers: ["Problem", "Possible Cause", "Suggestion"],
          rows: [
            ["Nothing happens after upload", "Not a CSV file", "Upload an Agnes usage CSV"],
            ["File too large", "File exceeds 50 MB", "Check whether you selected the wrong file"],
            ["Missing column error", "Not a standard Agnes export", "Re-export from the Agnes console"],
            ["One core metric is 0", "The current CSV, model filter, or date range has no records for that modality", "Verify whether text, image, or video calls exist in the selected scope"],
            ["Cost is 0", "The source export also shows 0", "Verify the original Agnes data"],
            ["Missing dates in trends", "No success calls happened on that day", "This is normal"],
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
        "Complete user guide for Agnes AI Usage Analysis. Learn how to export an Agnes usage CSV, upload a single file, understand the three side-by-side core metrics, Relative Comparison charts, custom project grouping, and the overview, key, and trends views.",
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
          text: "Inspect text tokens, image counts, and video seconds side by side, then compare requests, cost, custom project and key breakdowns, plus daily trends. All processing stays in the browser.",
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

    return null;
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
