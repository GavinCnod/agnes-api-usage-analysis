# Agnes AI Usage Analysis 改造计划

## Summary

- 目标：将当前基于 DeepSeek 双 CSV 账单模型的静态前端仪表盘，改造成面向 Agnes AI 单 CSV usage 导出的分析仪表盘。
- 本次范围：按你的选择执行“全量替换”，即同时覆盖解析链路、Dashboard 指标、上传体验、主要页面文案、SEO 元数据、分享卡文案与说明文档。
- 已确认的产品决策：
  - 上传方式：先只支持单个 Agnes CSV。
  - 统计口径：仅统计 `Consumption Status=success` 的记录。
  - 缓存能力：移除 `Cache` tab，并清理缓存相关 KPI、分享卡与文案。
  - 静态资源：先改文案，现有 logo、OG 图、landing 装饰图、指南截图暂时保留。

## Current State Analysis

### 1. 数据模型与解析链路完全绑定 DeepSeek 双文件

- `src/lib/parser.ts`
  - 当前入口为 `parseDeepSeekData(amountCSVText, costCSVText)`。
  - 当前要求两类文件：`amount` 明细 + `cost` 汇总。
  - 当前会先 pivot `type` 字段，再按 `(date, model)` 将 cost 按 token 比例分摊到 key。
- `src/lib/types.ts`
  - 当前核心字段围绕 DeepSeek 结构：`request_count`、`output_tokens`、`input_cache_hit_tokens`、`input_cache_miss_tokens`、`cost` 分摊结果等。
  - `ParseResult.summary` 与 `KeyStats` 内含缓存命中相关字段。
- `src/lib/DataContext.tsx`
  - `loadFiles(amountCSV, costCSV, fileName)` 接口与 `parseDeepSeekData()` 强耦合。

### 2. 上传流程完全假设“双文件或 ZIP”

- `src/components/DropZone.tsx`
  - UI 文案和交互都在引导上传多个月份、`amount-*.csv + cost-*.csv`、或 ZIP。
  - 内部动态引入 `concatMonthlyCSVs()` 和 `extractZipCsvs()`。
- `src/components/Dashboard.tsx`
  - 重新上传逻辑与 `DropZone` 一致，也依赖 `concatFiles.ts`。
- `src/lib/concatFiles.ts`
  - 核心职责是按月配对 `amount-*` / `cost-*` 文件并拼接。
  - 对 Agnes 的单文件、无命名规则模式不再适用。

### 3. 视图与统计项普遍依赖缓存字段

- `src/components/Dashboard.tsx`
  - 当前 tabs 为 `overview / projects / keys / cache / trends`。
- `src/components/KPICards.tsx`
  - 当前四个 KPI 为 `Total Cost / Total Tokens / Cache Hit Rate / Active API Keys`。
- `src/components/CacheView.tsx`
  - 整个页面依赖 `inputCacheHitTokens` / `inputCacheMissTokens`。
- `src/components/KeyView.tsx`
  - 表格包含 `Cache Hit` 列。
- `src/components/ProjectView.tsx`
  - 项目聚合与表格包含缓存 token 和缓存命中率。
- `src/components/TrendsView.tsx`
  - 指标切换包含 `cacheHitRate`。
- `src/lib/shareCardData.ts`、`src/components/ShareCard.tsx`、`src/components/ShareModal.tsx`
  - 分享卡数据结构与展示包含 `cache` tab 和缓存指标。

### 4. 文案、SEO、说明页与品牌仍是 DeepSeek

- `src/i18n/translations.ts`
  - 大量核心文案仍直接写明 DeepSeek、双 CSV、缓存分析。
- `src/app/layout.tsx`
  - metadata、keywords、OpenGraph alt、默认站点 URL 都是 DeepSeek。
- `src/lib/schema.ts`
  - JSON-LD 的 `SoftwareApplication`、`FAQPage`、`BreadcrumbList`、`Organization` 都是 DeepSeek 语义。
- `src/components/LandingPage.tsx`、`src/components/LandingContent.tsx`
  - Hero、How it works、FAQ、About 都在描述 DeepSeek 双 CSV 流程。
- `src/components/GuidelinePage.tsx`
  - 现有指南是 DeepSeek 下载与使用流程，截图文件名也明显为 DeepSeek 版本。
- `src/components/PrivacyPage.tsx`、`src/components/TermsPage.tsx`、`src/components/ChangelogPage.tsx`
  - 法律页、更新日志页和相关 `page.tsx` metadata 也包含 DeepSeek 产品名与描述。
- `README.md`、`README_zh.md`、`public/llms.txt`、`public/llms-full.txt`
  - 对外说明文档也还是 DeepSeek 版本。

### 5. 样例 CSV 已揭示 Agnes 新事实

- `sampleData/2026-06-28 10_45_38.csv`
  - Agnes 当前导出为单个 CSV。
  - 头部字段为：
    - `Type`
    - `Secret Key Name`
    - `Consumption Model`
    - `Consumption Amount(cents)`
    - `Consumption Quantity`
    - `Consumption Time`
    - `Consumption Status`
  - 明细行形态表现为单次调用粒度，`Consumption Quantity` 类似 `input:142064/output:85`。
  - 当前样例全部为 `success`，且金额样例值为 `0.0`。

## Proposed Changes

### A. 解析层改造

#### `src/lib/types.ts`

- 重构类型为 Agnes 单 CSV 模型，删除 DeepSeek 专属的双文件与缓存字段。
- 新的数据结构建议：
  - 新增 Agnes 原始行类型，例如 `AgnesUsageRow`。
  - `DailyUsage` 保留仪表盘所需的聚合字段，但收敛为：
    - `date`
    - `model`
    - `apiKeyName`
    - `requestCount`
    - `inputTokens`
    - `outputTokens`
    - `totalTokens`
    - `totalCost`
    - 可选 `statusBreakdown` 仅在未来需要筛选时再加；本次先不落地。
  - `KeyStats` 与 `ParseResult.summary` 中移除：
    - `inputCacheHitTokens`
    - `inputCacheMissTokens`
    - `cacheHitRate`
- `ParseWarning` 精简为 Agnes 仍可能发生的情况，例如：
  - `schema_drift`
  - `partial_quantity_data`
  - `unknown_status`

#### `src/lib/parser.ts`

- 将主入口改为单文件解析，例如 `parseAgnesData(csvText)`。
- 解析规则固定如下，避免执行阶段再做口径决策：
  - 以 Papa Parse 读取单个 CSV。
  - 校验 Agnes 所需列是否全部存在。
  - 仅保留 `Consumption Status=success` 的记录。
  - 将 `Consumption Time` 解析为日粒度 `date`，用于日趋势。
  - 将 `Secret Key Name` 映射为当前仪表盘中的 key 名称来源。
  - 将 `Consumption Model` 映射为模型维度。
  - 将 `Consumption Quantity` 解析为 `input` / `output` token。
  - 将无法解析数量串的行记为 warning，并按可解析部分继续汇总，而不是整文件失败。
  - 将 `Consumption Amount(cents)` 视为“分”，统一换算到当前 UI 货币单位（元 / `¥`）后参与聚合。
- 聚合策略：
  - 直接按明细聚合，不再做 cost 分摊。
  - 日维度 key 使用 `(date, model, apiKeyName)`。
  - `requestCount` 按成功行数累计。
  - `totalTokens = inputTokens + outputTokens`。
  - summary 输出：
    - `totalCost`
    - `totalTokens`
    - `totalRequests`
    - `activeKeys`
    - `dateRange`
    - `models`
- 删除或内联不再需要的 DeepSeek 专用函数：
  - `parseAmountCSV`
  - `parseCostCSV`
  - `pivotAmountRows`
  - `joinCosts`

#### `src/lib/DataContext.tsx`

- 将 `loadFiles(amountCSV, costCSV, fileName)` 收敛为单文件接口，例如 `loadFile(csvText, fileName)`。
- 将内部解析函数改为 `parseAgnesData()`。
- `filterResult()` 基于 Agnes 新 summary 字段重算聚合值：
  - `totalCost`
  - `totalTokens`
  - `totalRequests`
  - `activeKeys`
  - `dateRange`
  - `models`

### B. 上传层改造

#### `src/components/DropZone.tsx`

- 将上传提示改为 Agnes 单文件 CSV 流程。
- `accept` 收敛为 `.csv`。
- 交互层面只接受一个 CSV；如果用户一次选中多个文件，直接给出明确错误提示，而不是静默取第一个。
- 保留 50 MB 单文件上限，但文案改成 Agnes 语义。
- 去掉对 `concatMonthlyCSVs()` / `extractZipCsvs()` 的依赖，直接读取单文件文本并调用新的 `loadFile()`。

#### `src/components/Dashboard.tsx`

- 重新上传按钮沿用单文件逻辑，删除多文件 / ZIP 流程。
- 删除 `Cache` tab，tabs 收敛为：
  - `overview`
  - `projects`
  - `keys`
  - `trends`
- 更新文件说明区的标签表达，使其更适合 Agnes 单文件上传。

#### `src/lib/concatFiles.ts`

- 本文件的“按月配对 DeepSeek 双 CSV”职责已失效。
- 执行时建议：
  - 删除该模块。
  - 新建一个更贴切的轻量文件，例如 `src/lib/upload.ts`，仅保留 `MAX_UPLOAD_SIZE_BYTES` 与单文件读取辅助逻辑。
- 这样可以避免 Agnes 项目中继续保留误导性命名 `concatFiles`。

### C. Dashboard 指标与视图改造

#### `src/components/KPICards.tsx`

- KPI 改为四项：
  - `Total Cost`
  - `Total Tokens`
  - `Total Requests`
  - `Active Keys`
- 删除缓存命中率与 “saved tokens” 副文案。

#### `src/components/OverviewView.tsx`

- 保留“总费用 Hero + 每日费用柱状图 + 按 Key 费用环图”的结构。
- 所有数值直接来自 Agnes 聚合后的 `totalCost`，不再依赖分摊成本。
- 如果未来 Agnes 真实付费数据出现非零值，当前结构可直接复用。

#### `src/components/KeyView.tsx`

- 表格列调整为：
  - `Secret Key Name`
  - `Tokens`
  - `Cost`
  - `Requests`
- 删除 `Cache Hit` 列和对应颜色逻辑。
- Hero 副文案仍保留 `keys + models` 统计。

#### `src/components/ProjectView.tsx`

- 项目分组能力保留，因为 Agnes 也有 `Secret Key Name`。
- 聚合口径改为基于 Agnes 的：
  - `totalTokens`
  - `totalCost`
  - `requestCount`
- 删除项目级缓存 token 与缓存命中率。
- 表格列同步删除缓存列。
- 排序仍按 `totalCost`。

#### `src/components/TrendsView.tsx`

- 指标切换收敛为：
  - `cost`
  - `tokens`
  - `requests`
- 删除 `cacheHitRate` 指标及其 hero / yAxis / tooltip 逻辑。

#### `src/components/CacheView.tsx`

- 从 Dashboard 中彻底移除该页面的入口。
- 执行时建议直接删除文件，避免保留死代码。

### D. 分享卡与导出能力改造

#### `src/lib/shareCardData.ts`

- `ShareTab` 去掉 `cache`。
- `OverviewShareData` 去掉 `cacheHitRate` 字段，补充 `totalRequests`。
- `KeyShareData` / `ProjectShareData` 保留，使用 Agnes 新字段。
- `TrendsShareData` 的默认 metric 改为 Agnes 支持的指标之一。

#### `src/components/ShareButton.tsx`

- 仅做 label / tab 枚举同步，无需大改结构。

#### `src/components/ShareModal.tsx`

- 删除缓存 tab 的数据分支与文案。
- 文案中所有 DeepSeek 品牌与缓存措辞替换为 Agnes。

#### `src/components/ShareCard.tsx`

- 删除 cache 卡片渲染分支。
- 更新各卡片中的品牌文案、底部生成标记、标题、副标题与说明文案为 Agnes。

### E. 国际化与页面内容改造

#### `src/i18n/translations.ts`

- 统一替换 DeepSeek 品牌文案为 Agnes。
- 上传说明改为 Agnes 单 CSV 流程。
- 删除缓存相关 key，或在执行时完成所有消费者替换后清理掉对应翻译组。
- 重点更新这些组：
  - `app`
  - `tabs`
  - `dropzone`
  - `kpi`
  - `overview`
  - `trends`
  - `keys`
  - `projects`
  - `share`
  - `landing`
  - `guideline`
  - `privacy`
  - `terms`
  - `changelog`
  - `meta`
  - `footer`

#### `src/components/LandingPage.tsx` 与 `src/components/LandingContent.tsx`

- 将叙事从“上传 DeepSeek 双 CSV”改成“上传 Agnes usage CSV”。
- FAQ / How it works / About 中删除缓存与双文件依赖描述。
- 保留当前结构和现有装饰图资源，但文案需明确说明这是 Agnes 版工具。

#### `src/components/GuidelinePage.tsx`

- 该文件体量大，是本次“全量替换”里内容改造成本最高的部分。
- 执行策略固定为：
  - 保留页面结构与截图占位机制。
  - 文案全面改成 Agnes 下载与使用步骤。
  - 因你已明确“先改文案保留图”，现有 DeepSeek 截图暂不替换资源文件，只调整描述文字，避免页面继续错误声称要下载 `amount/cost` 双 CSV。

#### `src/components/PrivacyPage.tsx`、`src/components/TermsPage.tsx`、`src/components/ChangelogPage.tsx`

- 将产品名、数据来源描述、上传流程、品牌归属从 DeepSeek 改为 Agnes。
- `Privacy` 页要把“本地处理的文件类型”改为 Agnes usage CSV。
- `Terms` 页中的“不隶属于 DeepSeek”改成 Agnes 对应表述。
- `Changelog` 页新增一条 Agnes 改造版本记录。

#### `src/components/PrivacyContent.tsx`、`src/components/TermsContent.tsx`、`src/components/ChangelogContent.tsx`

- 同步更新对应的 `<noscript>` SEO 文案，确保爬虫抓到的是 Agnes 版本说明，而非旧 DeepSeek 内容。

#### `src/components/TitleBar.tsx`、`src/components/FooterBar.tsx`

- 标题、页脚版权说明、对外链接文案中的产品名改为 Agnes 版本。
- 若存在 DeepSeek GitHub 仓库直链描述，也一起替换为当前仓库 Agnes 语义描述。

### F. SEO、Schema 与公开文档改造

#### `src/app/layout.tsx`

- 更新：
  - `title`
  - `description`
  - `siteName`
  - OpenGraph alt
  - keywords
  - 默认 `SITE_URL` 文案说明
- 保留现有站点 URL 与图片路径，直到后续静态资源替换阶段再调整。

#### `src/lib/schema.ts`

- 将 `SoftwareApplication` / `FAQPage` / `BreadcrumbList` / `Organization` 改成 Agnes 描述。
- FAQ 必须与 Agnes 单 CSV 流程一致，删除对 `amount/cost` 双文件与缓存的描述。
- `sameAs`、logo 路径、产品名保持与当前仓库对外信息一致；图片路径先沿用旧资源文件名，但描述文案改为 Agnes。

#### `src/app/guideline/page.tsx`、`src/app/privacy/page.tsx`、`src/app/terms/page.tsx`、`src/app/changelog/page.tsx`

- 各页面独立 metadata 改为 Agnes 产品描述。

#### `src/app/robots.ts`、`src/app/sitemap.ts`

- 通常结构可保持不变，但如果描述性注释或测试快照里写了 DeepSeek，也要同步更正。

#### `README.md`、`README_zh.md`

- 更新产品说明、CSV 格式说明、功能列表、上传流程、缓存说明、FAQ、项目结构注释。
- 将输入格式改为 Agnes 单 CSV，并记录当前限制：先仅支持单文件。

#### `public/llms.txt`、`public/llms-full.txt`

- 将站点给 LLM 的公开说明同步切换到 Agnes 语义。

### G. 测试与回归保障

#### 新增测试

- 新增 `src/__tests__/parser.test.ts`
  - 使用 `sampleData/2026-06-28 10_45_38.csv` 或等价 fixture 覆盖：
    - Agnes 表头识别
    - `success` 过滤
    - `Consumption Quantity` 解析
    - 日维度聚合
    - `summary` 正确性
    - 错误列名 / 空文件 / 异常数量串 warning

#### 修改现有测试

- `src/__tests__/DataContext.test.tsx`
  - mock 接口从 `parseDeepSeekData` / `loadFiles(amount,cost,...)` 切换为 Agnes 单文件接口。
- `src/__tests__/DropZone.test.tsx`
  - 更新 UI 断言，去掉 `amount-*.csv + cost-*.csv` 和 ZIP 假设。
  - 增加“用户选择多个文件时给出错误”的断言。
- `src/__tests__/schema.test.ts`
  - 更新 JSON-LD 产品名、FAQ 文案预期。
- `src/__tests__/sitemap.test.ts`
  - 若测试对 title/description/route metadata 有字符串断言，同步改为 Agnes。

## Assumptions & Decisions

- 费用单位决策：按列名将 `Consumption Amount(cents)` 视为“分”，执行时统一换算为当前 UI 使用的 `¥` 元单位。
- 上传范围决策：当前阶段只支持单个 CSV，不实现多文件拼接、按月合并、ZIP 解压。
- 状态决策：仅统计 `success` 记录；非 `success` 记录先忽略，不进入汇总。
- 缓存决策：Agnes 当前无缓存字段，因此本次彻底移除缓存视图与缓存指标，而不是保留占位。
- 静态资源决策：只改文案，不改现有图片资源文件；因此执行时不得把旧图继续解释为 DeepSeek 下载步骤，而要用 Agnes 文案兜住语义。
- 兼容性决策：保留当前 Next.js 16 + React 19 + 静态导出架构，不引入服务端或数据库。
- 项目分组决策：继续按 `Secret Key Name` 进行项目归组，不引入新的项目识别字段。
- 版本记录决策：执行时应在 changelog 中新增 Agnes 改造版本记录，并同步涉及版本展示的位置。

## Verification Steps

### 自动验证

- 运行针对性测试：
  - `vitest` 中的 parser / DataContext / DropZone / schema / sitemap 相关测试。
- 执行一次生产构建，确认：
  - 类型通过
  - metadata 生成无错误
  - 静态导出仍可用

### 手动验证

- 用 `sampleData/2026-06-28 10_45_38.csv` 上传并确认：
  - 能成功进入 Dashboard。
  - 顶部文件名与日期范围正确。
  - KPI 为费用 / tokens / requests / active keys。
  - 不再出现 `Cache` tab。
  - `Overview`、`By Key`、`By Project`、`Trends` 均能展示 Agnes 数据。
  - `Trends` 仅支持 Agnes 现有指标。
  - 语言切换后 Agnes 文案一致。
  - Landing、Guideline、Privacy、Terms、Changelog 页面不再提及 DeepSeek 双 CSV 流程。

### 边界验证

- 上传空 CSV：应出现可理解错误。
- 上传缺列 CSV：应提示 schema 不匹配。
- 上传包含非 `success` 记录的 CSV：应仅统计成功记录。
- 上传 `Consumption Quantity` 异常格式记录：应产生 warning 或稳健降级，而非整页崩溃。
