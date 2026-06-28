# Agnes AI Usage Analysis 执行计划

## Summary

* 目标：将当前仓库从 DeepSeek API Usage Analytics Dashboard 彻底收敛为 Agnes AI Usage Analysis，并以 Agnes 单 CSV usage 导出为唯一输入来源。

* 当前判断：仓库已经完成了第一阶段的数据层迁移，后续工作的重点不再是“从零设计”，而是“清理遗留 DeepSeek 语义、完成页面与文档替换、删除死代码、补齐测试并验证构建”。

* 本轮按已确认决策执行：

  * 改造范围：全量替换。

  * 上传方式：只支持单个 Agnes CSV。

  * 统计口径：仅统计 `Consumption Status=success`。

  * 缓存能力：移除 `Cache` tab 与所有缓存相关指标。

  * 静态资源：先改文案，保留现有 logo、OG 图、landing 装饰图和 guideline 截图资源。

  * 外链与默认域名：本轮先保留现有仓库链接与默认站点 URL，不做替换。

  * 版本记录：本轮 Agnes 迁移记为 `0.1.0`，展示层按现有风格写作 `v0.1.0`。

## Current State Analysis

### 已完成的迁移

* `sampleData/2026-06-28 10_45_38.csv`

  * 已确认 Agnes 输入为单个 CSV。

  * 当前字段为：

    * `Type`

    * `Secret Key Name`

    * `Consumption Model`

    * `Consumption Amount(cents)`

    * `Consumption Quantity`

    * `Consumption Time`

    * `Consumption Status`

* `src/lib/types.ts`

  * 已从 DeepSeek 双文件模型切换到 Agnes 单 CSV 模型。

  * 当前主结构已围绕 `AgnesUsageRow`、`DailyUsage.totalCost`、`KeyStats.requestCount`、`summary.totalRequests` 等新字段组织。

* `src/lib/parser.ts`

  * 已存在 `parseAgnesData(csvText)`。

  * 已实现 Agnes 表头校验、`success` 过滤、`Consumption Quantity` 解析、按 `(date, model, apiKeyName)` 聚合，以及 warning 输出。

* `src/lib/DataContext.tsx`

  * 已将 `loadFiles(...)` 收敛为 `loadFile(csvText, fileName)`。

  * 已切换到 Agnes 解析链路与新 summary 字段。

* `src/lib/upload.ts`

  * 已新增 Agnes 单文件上传辅助模块。

* `src/components/DropZone.tsx`

  * 已改为单文件 `.csv` 上传。

  * 已增加多文件与非 CSV 显式报错。

* `src/components/Dashboard.tsx`

  * 已改为 `overview / projects / keys / trends` 四个 tab。

  * 已移除 `CacheView` 的入口引用。

* `src/components/KPICards.tsx`、`src/components/KeyView.tsx`、`src/components/ProjectView.tsx`、`src/components/TrendsView.tsx`

  * 已基本切到 Agnes 新聚合字段。

* `src/lib/shareCardData.ts`、`src/components/ShareCard.tsx`、`src/components/ShareModal.tsx`

  * 已开始去除 cache 分支，分享卡结构已部分 Agnes 化。

* `src/app/layout.tsx`、`src/lib/schema.ts`、`src/app/guideline/page.tsx`、`src/app/privacy/page.tsx`、`src/app/terms/page.tsx`、`src/app/changelog/page.tsx`

  * metadata 和 schema 已有一部分 Agnes 文案替换。

### 仍然存在的主要遗留问题

#### 1. DeepSeek 品牌与链接仍残留在多个页面和文档

* `src/components/TitleBar.tsx`

  * GitHub 链接仍指向旧 DeepSeek 仓库。

* `src/components/FooterBar.tsx`

  * 常量 `GITHUB_URL` 仍指向旧 DeepSeek 仓库。

* `src/components/LandingPage.tsx`、`src/components/LandingContent.tsx`

  * 仍有旧仓库链接与旧叙事残留。

* `src/components/ShareCard.tsx`

  * 底部生成标记仍写 `deepseek-usage.xyz`。

* `src/components/ShareModal.tsx`

  * 注释与二维码目标地址仍是 `https://deepseek-usage.xyz`。

* `src/components/PrivacyPage.tsx`、`src/components/TermsPage.tsx`、`src/components/ChangelogPage.tsx`

  * JSON-LD、正文或链接仍残留 DeepSeek 品牌与历史描述。

* `README.md`、`README_zh.md`、`public/llms.txt`、`public/llms-full.txt`

  * 仍是以 DeepSeek 为主体的公开说明。

#### 2. 长文档页面仍然高度绑定 DeepSeek 工作流

* `src/components/GuidelinePage.tsx`

  * 仍包含大段 DeepSeek 操作手册正文、DeepSeek 下载入口说明、旧分享卡说明和旧 issue 链接。

  * 这是本轮文案替换成本最高、最需要整体重写的文件。

* `src/components/ChangelogPage.tsx`

  * 当前 changelog 基本是 DeepSeek 时代历史，且包含 cache/ZIP/double CSV 等旧功能描述。

  * 需要改成 Agnes 项目的版本历史起点，并新增 `v0.1.0` Agnes 迁移版本。

#### 3. 死代码与旧测试尚未清理

* `src/components/CacheView.tsx`

  * 虽然已不再被 `Dashboard` 引用，但文件还在。

* `src/lib/concatFiles.ts`

  * 已不再适配 Agnes 单文件流程，但文件仍在。

* `src/__tests__/DropZone.test.tsx`

  * 仍 mock `@/lib/concatFiles` 与旧 `loadFiles` 逻辑。

* `src/__tests__/DataContext.test.tsx`

  * 仍围绕 `parseDeepSeekData` 和双文件接口编写。

* `src/__tests__/schema.test.ts`

  * 仍断言 DeepSeek 域名与旧文案。

* 缺少 Agnes 解析器的专门测试文件。

#### 4. 默认站点 URL 仍为旧域名，但本轮不替换

* `src/app/layout.tsx`

* `src/app/robots.ts`

* `src/app/sitemap.ts`

* `src/app/guideline/page.tsx`

* `src/app/privacy/page.tsx`

* `src/app/terms/page.tsx`

* `src/app/changelog/page.tsx`

* `src/lib/schema.ts`

说明：

* 这些文件中的默认 URL 仍为 `https://deepseek-usage.xyz`。

* 按本轮决策，这些链接和默认域名先保留，不作为本轮改造目标。

* 但所有“产品名、功能描述、FAQ 叙事、表单说明、分享文案”仍需切到 Agnes 语义，避免用户在产品层面看到错误流程说明。

## Proposed Changes

### A. 数据层与上传链路收尾

#### `src/lib/parser.ts`

* 目标：保留现有 Agnes 解析入口，但做一次执行前复查与边界补强。

* 具体改动：

  * 复核 `parseQuantity()` 对异常串、仅有 input 或仅有 output 的 warning 逻辑。

  * 复核 `toUsageDate()` 的日期归一策略在跨时区环境下是否稳定。

  * 复核空文件、缺列、金额字段异常、非 `success` 状态全量忽略时的返回结果是否符合 UI 预期。

* 原因：核心模型已迁移完成，但需要通过测试锁定当前行为，避免后续页面改造时引入回归。

#### `src/lib/DataContext.tsx`

* 目标：确认 `filterResult()` 与 `loadFile()` 的接口稳定。

* 具体改动：

  * 保持单文件接口不再回退到旧命名。

  * 确认 model filter 下 `summary.models` 保持未过滤全集这一约定。

  * 与测试文件同步接口变更。

#### `src/components/DropZone.tsx`

* 目标：把剩余文案与错误提示彻底 Agnes 化。

* 具体改动：

  * 确认 drag-and-drop、点击上传、文件过大、多文件、非 CSV、读取失败等分支都使用 Agnes 文案。

  * 保留 50MB 限制，不恢复 ZIP 或多文件逻辑。

#### `src/components/Dashboard.tsx`

* 目标：让重新上传链路、tab 结构、页面提示完全与单 CSV 流程一致。

* 具体改动：

  * 保持四个 tab，不回引 cache 分支。

  * 确认重传错误横幅与文件说明区不再出现双文件语义。

### B. 仪表盘视图与分享能力收尾

#### `src/components/KPICards.tsx`

* 目标：确认四个 KPI 固化为 `Cost / Tokens / Requests / Active Keys`。

* 具体改动：

  * 清理所有缓存副文案与缓存格式化调用。

#### `src/components/OverviewView.tsx`

* 目标：确认概览视图仅依赖 Agnes 新字段。

* 具体改动：

  * 统一从 `totalCost`、`totalTokens` 派生展示值。

  * 保留当前布局，不做额外设计改版。

#### `src/components/KeyView.tsx`

* 目标：维持 `Secret Key Name / Tokens / Cost / Requests` 表格模型。

* 具体改动：

  * 清理任何遗留 `cacheHitRate` 颜色逻辑或列定义。

#### `src/components/ProjectView.tsx`

* 目标：保留项目分组能力，但使其与 Agnes 聚合字段一致。

* 具体改动：

  * 聚合字段只保留 `totalTokens`、`totalCost`、`requestCount`。

  * 删除任何缓存相关列与说明。

#### `src/components/TrendsView.tsx`

* 目标：将趋势切换固定为 Agnes 支持的 `cost / tokens / requests`。

* 具体改动：

  * 删除 cache 指标的残余常量、tooltip、hero 文案和格式化逻辑。

#### `src/lib/shareCardData.ts`

* 目标：完成分享卡数据层的 Agnes 收口。

* 具体改动：

  * `ShareTab` 仅保留 `overview / projects / keys / trends`。

  * `OverviewShareData` 明确以 `totalRequests` 替代旧 cache 指标。

  * 所有 extraction 函数只依赖 Agnes 的 `totalCost / totalTokens / requestCount`。

#### `src/components/ShareModal.tsx`

* 目标：完成分享弹窗品牌与描述的切换。

* 具体改动：

  * 移除 cache 相关文案和分支。

  * 保留二维码指向旧域名，但文案与文件名统一 Agnes 化。

#### `src/components/ShareCard.tsx`

* 目标：保证卡片正文与底部标记不再声称这是 DeepSeek 工具。

* 具体改动：

  * 替换底部生成说明中的产品名称。

  * 保留旧域名展示与二维码指向，但上层文案统一改为 Agnes。

### C. 页面内容、法律页与说明页整体替换

#### `src/i18n/translations.ts`

* 目标：作为全站文字源头，完成 Agnes 语义统一。

* 具体改动：

  * 重点清理分组：

    * `app`

    * `tabs`

    * `dropzone`

    * `kpi`

    * `overview`

    * `trends`

    * `keys`

    * `projects`

    * `share`

    * `landing`

    * `guideline`

    * `privacy`

    * `terms`

    * `changelog`

    * `footer`

    * `meta`

  * 删除或停用仅服务于 cache/ZIP/double CSV 的旧翻译键。

#### `src/components/LandingPage.tsx`

* 目标：将首页预上传叙事完整改成 Agnes 单 CSV 分析器。

* 具体改动：

  * Hero、How It Works、FAQ、About 全面改写。

  * 明确说明本工具读取 Agnes usage CSV，且只在本地浏览器处理。

  * 保留现有视觉资源，不重新绘制插图。

#### `src/components/LandingContent.tsx`

* 目标：让 `<noscript>` SEO 回退内容与 LandingPage 同步。

* 具体改动：

  * 同步 How It Works、FAQ、About 的 Agnes 版文字。

  * 保留外链不变，但避免出现错误的双文件工作流描述。

#### `src/components/GuidelinePage.tsx`

* 目标：把这份长手册整体重写为 Agnes 版，而不是局部替词。

* 具体改动：

  * 保留现有解析器、目录结构、截图占位机制和页面布局。

  * 重写中文与英文手册正文，使其覆盖：

    * Agnes usage CSV 下载/导出前提

    * 上传单个 CSV 的流程

    * Overview / Projects / Keys / Trends 的阅读方式

    * model filter 的使用方法

    * share card 的 Agnes 说明

    * FAQ 中关于单文件、状态过滤、零金额、项目分组的解释

  * 删除或改写所有关于 DeepSeek 平台、双文件配对、ZIP、cache tab 的文字。

  * 保留现有截图文件名与资源引用，只调整描述，避免图片资源替换扩散范围。

#### `src/components/PrivacyPage.tsx`

* 目标：让隐私页从产品层面改成 Agnes 版。

* 具体改动：

  * 替换 WebPage JSON-LD 的产品名与描述。

  * 调整正文中的文件类型描述为 Agnes usage CSV。

  * 保留现有 GitHub 链接和站点 URL。

#### `src/components/TermsPage.tsx`

* 目标：让条款页不再声称产品与 DeepSeek 绑定。

* 具体改动：

  * 替换 WebPage JSON-LD 的产品名与描述。

  * 将“不隶属于 DeepSeek”改写为 Agnes 语义的中性表述。

  * 保留当前外链不变。

#### `src/components/ChangelogPage.tsx`

* 目标：把 changelog 改成 Agnes 项目的版本历史入口。

* 具体改动：

  * 在顶部新增 `v0.1.0` 版本条目，明确记录：

    * 数据模型从 DeepSeek 双 CSV 迁移到 Agnes 单 CSV

    * 上传流程改为单文件

    * Dashboard 移除 Cache

    * 解析只统计 success

    * 文案、SEO、说明页切换到 Agnes

  * 清理与 Agnes 当前产品定位冲突的历史描述，尤其是明显会误导用户的 cache/ZIP/double CSV 叙述。

  * 保留页面结构与分类展示样式。

#### `src/components/PrivacyContent.tsx`、`src/components/TermsContent.tsx`、`src/components/ChangelogContent.tsx`

* 目标：同步 `<noscript>` SEO 回退内容。

* 具体改动：

  * 让这些内容与对应页面新的 Agnes 文案一致，避免爬虫抓取到旧 DeepSeek 描述。

#### `src/components/TitleBar.tsx`、`src/components/FooterBar.tsx`

* 目标：完成界面层品牌收口。

* 具体改动：

  * 标题、提示文本、产品名使用 Agnes 文案。

  * GitHub 链接按当前决策先保留，不调整地址本身。

### D. SEO、Schema 与公开文档同步

#### `src/app/layout.tsx`

* 目标：保留站点结构不变，但使 metadata 文案统一 Agnes 化。

* 具体改动：

  * 标题、描述、关键字、OG/Twitter 文案全部围绕 Agnes。

  * 默认站点 URL fallback 先保持原值，不在本轮替换。

#### `src/lib/schema.ts`

* 目标：让 JSON-LD 的应用定义与 FAQ 反映 Agnes 单 CSV 产品。

* 具体改动：

  * `SoftwareApplication` 改为 Agnes AI Usage Analysis。

  * FAQ 改成 Agnes 单 CSV、success 过滤、本地处理、项目分组等内容。

  * `Organization`、`BreadcrumbList` 的名称使用 Agnes 文案。

  * URL 字段先保留当前域名。

#### `src/app/guideline/page.tsx`、`src/app/privacy/page.tsx`、`src/app/terms/page.tsx`、`src/app/changelog/page.tsx`

* 目标：同步各子页 metadata。

* 具体改动：

  * 文案改 Agnes。

  * 默认域名 fallback 保留。

#### `README.md`、`README_zh.md`

* 目标：让仓库首页说明反映 Agnes 当前能力。

* 具体改动：

  * 改产品介绍、输入格式、功能列表、FAQ、技术说明。

  * 明确现阶段不支持 ZIP 和多文件。

  * 说明只统计 `success`。

#### `public/llms.txt`、`public/llms-full.txt`

* 目标：让给 LLM 的公开说明与站点事实一致。

* 具体改动：

  * 将用途、上传格式、页面结构、隐私说明、FAQ 改为 Agnes 版。

### E. 删除死代码与更新测试

#### 删除文件

* `src/components/CacheView.tsx`

  * 目标：彻底移除不再使用的 cache 页面实现。

* `src/lib/concatFiles.ts`

  * 目标：移除 Agnes 项目中误导性的旧双文件拼接逻辑。

#### `src/__tests__/DataContext.test.tsx`

* 目标：切换到 Agnes 单文件接口。

* 具体改动：

  * mock `parseAgnesData` 而不是 `parseDeepSeekData`。

  * 调整 `loadFiles(...)` 断言为 `loadFile(...)`。

  * 更新测试 fixture 字段，移除 `apiKey`、cache token、旧 `cost` 字段结构。

#### `src/__tests__/DropZone.test.tsx`

* 目标：让上传测试符合 Agnes 单文件模型。

* 具体改动：

  * 删除 `concatFiles` mock。

  * 改为 mock `readCsvFile` 或 `loadFile`。

  * 增加多文件报错、非 CSV 报错、单文件成功上传断言。

#### `src/__tests__/schema.test.ts`

* 目标：同步 Agnes JSON-LD 预期。

* 具体改动：

  * 断言产品名、FAQ 内容、应用描述改为 Agnes。

  * 因本轮保留默认域名，URL 断言可继续接受旧域名。

#### 新增 `src/__tests__/parser.test.ts`

* 目标：为 Agnes 解析器建立最关键的回归保护。

* 具体改动：

  * 覆盖：

    * 正常 Agnes CSV 解析

    * `success` 过滤

    * `Consumption Quantity` 解析

    * `summary.totalRequests` 与 `summary.totalTokens`

    * 缺列报错

    * 空文件报错

    * 异常数量串 warning

#### `src/__tests__/sitemap.test.ts`

* 目标：确认 sitemap 结构不回归。

* 具体改动：

  * 如有标题/描述相关预期，改为 Agnes 版本。

## Assumptions & Decisions

* 输入源唯一决策：本轮只支持 Agnes usage 单 CSV。

* 状态过滤决策：仅统计 `success`，其余状态忽略并以 warning 方式提示。

* 费用口径决策：`Consumption Amount(cents)` 按“分”解释，进入 UI 前换算为元。

* 视图范围决策：正式移除 `Cache` 页，不保留占位 tab。

* 品牌资源决策：保留旧 logo、OG 图、landing 图和 guideline 截图资源文件，不在本轮替换图片。

* 外链与域名决策：保留当前 GitHub 链接与默认站点 URL，不在本轮替换地址本身。

* 项目分组决策：继续使用 `Secret Key Name` 作为项目归组基础。

* 版本决策：本轮 Agnes 迁移记录为 `v0.1.0`。

* 架构决策：维持现有 Next.js 16 + React 19 + 静态导出架构，不引入服务端。

## Verification Steps

### 自动验证

* 运行测试：

  * `parser.test.ts`

  * `DataContext.test.tsx`

  * `DropZone.test.tsx`

  * `schema.test.ts`

  * `sitemap.test.ts`

* 执行一次生产构建，确认：

  * TypeScript 通过

  * metadata / schema 无报错

  * 静态导出仍可完成

### 手动验证

* 使用 `sampleData/2026-06-28 10_45_38.csv` 验证：

  * 单文件上传成功

  * Dashboard 可进入

  * 顶部显示文件名与日期范围

  * KPI 为 `Cost / Tokens / Requests / Active Keys`

  * 只显示 `Overview / Projects / Keys / Trends`

  * model filter 可正常工作

  * Share 弹窗与分享卡不再出现 cache 语义

### 页面与内容验证

* Landing、Guideline、Privacy、Terms、Changelog 页面不再描述 DeepSeek 双 CSV/ZIP/cache 工作流。

* README 与 `llms.txt` 说明与站点行为一致。

* 中文与英文切换后均保持 Agnes 语义一致。

### 边界验证

* 上传空 CSV：给出明确错误。

* 上传缺列 CSV：给出 schema 错误。

* 上传异常 `Consumption Quantity` 行：产生 warning，但页面不崩溃。

* 上传包含非 `success` 状态的 CSV：只统计成功记录。

