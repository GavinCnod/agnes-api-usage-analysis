# Agnes AI Usage Analysis 改造实施计划

## Summary

本仓库已经完成 Agnes 迁移的主体骨架：`sampleData` 已提供 Agnes 单 CSV 样例，`src/lib/parser.ts` / `src/lib/DataContext.tsx` / `src/components/Dashboard.tsx` 已切到 Agnes 单文件、`success` 状态统计和四个核心标签页（`overview` / `projects` / `keys` / `trends`）。

当前剩余工作不再是“重新设计”，而是完成一次收口式迁移：

1. 清理仍残留的 DeepSeek / ZIP / Cache / 双文件叙事。
2. 删除已失效的代码与依赖。
3. 将测试、README、LLM 文档、SEO 说明同步到 Agnes 版本。
4. 做一次完整诊断、测试和构建验证，确认迁移真正闭环。

本计划按“最少决策、直接落地”的原则编写，执行时不再引入新产品分支。

## Current State Analysis

### 已经完成的 Agnes 化

* `sampleData/2026-06-28 10_45_38.csv`

  * 已确认 Agnes 导出为单 CSV。

  * 当前表头为：

    * `Type`

    * `Secret Key Name`

    * `Consumption Model`

    * `Consumption Amount(cents)`

    * `Consumption Quantity`

    * `Consumption Time`

    * `Consumption Status`

* `src/lib/parser.ts`

  * 已实现 Agnes 单 CSV 校验与解析。

  * 已实现 `Consumption Quantity` 的 `input/output` 拆分。

  * 已实现仅统计 `Consumption Status=success`。

  * 已按“分 -> 元”累计 `Consumption Amount(cents)`。

* `src/lib/DataContext.tsx`

  * 已将入口改为 `loadFile(csvText, fileName)`。

  * 已接入 `parseAgnesData()`。

* `src/components/Dashboard.tsx`

  * 已移除 Cache tab，仅保留 Agnes 所需 4 个 tab。

* `src/lib/upload.ts`

  * 已建立单文件 CSV 上传辅助层，供 `DropZone.tsx` / `Dashboard.tsx` 共用。

* `src/components/GuidelinePage.tsx`

  * 已重写为 Agnes 手册结构。

* `src/components/ChangelogPage.tsx`

  * 已重写为 Agnes 起始版本 `v0.1.0`。

* `src/components/ChangelogContent.tsx`

  * 已同步 Agnes `<noscript>` 摘要。

* `src/components/PrivacyPage.tsx` / `src/components/TermsPage.tsx`

  * JSON-LD 产品名已切到 Agnes。

* `src/lib/schema.ts`

  * 应用版本已改为 `0.1.0`。

* `package.json`

  * `version` 已改为 `0.1.0`。

* `src/components/DropZone.tsx`

  * 已改为只接受单个 CSV，且非 CSV 不再静默返回。

### 仍然存在的残留与风险

#### 1. 死代码和旧依赖仍在仓库中

* `src/components/CacheView.tsx`

  * 仍然保留完整旧 Cache 实现，且继续引用 `t.cache.*` 与旧 summary 字段。

* `src/lib/concatFiles.ts`

  * 仍然保留 DeepSeek 双文件配对、ZIP 解压和 `JSZip` 依赖逻辑。

* `package.json`

  * 仍然保留 `jszip` 依赖。

* `package.json`

  * 包名仍为 `ds-usage-analysis`，与 Agnes 项目命名不一致。

#### 2. 测试仍大量绑定旧 DeepSeek 数据模型

* `src/__tests__/DataContext.test.tsx`

  * 仍 mock `parseDeepSeekData`。

  * 仍使用 `loadFiles(...)`、缓存字段、旧 summary 结构。

* `src/__tests__/DropZone.test.tsx`

  * 仍 mock `concatFiles` / ZIP 提取。

  * 用例目标与现有 `DropZone.tsx` 实现已不一致。

* `src/__tests__/schema.test.ts`

  * 断言仍在检查 `DeepSeek` 与旧 GitHub 地址。

* 当前缺少 Agnes parser 的专门回归测试文件。

#### 3. README / LLM 文档几乎仍是旧产品说明

* `README.md`

  * 仍以 DeepSeek 双文件、ZIP、多月、Cache 为主叙事。

* `README_zh.md`

  * 同样仍是旧产品说明。

* `public/llms.txt`

  * 仍写 DeepSeek、ZIP、多月、v0.5.x 历史。

* `public/llms-full.txt`

  * 仍是完整 DeepSeek 版本内容。

#### 4. i18n 与少量展示链路仍有旧残留

* `src/i18n/translations.ts`

  * `tabs.cache` 仍存在。

  * `cache` 文案组仍存在。

  * 某些 FAQ / 文案虽然 Agnes 化，但仍有部分历史命名痕迹。

* `src/components/ShareModal.tsx`

  * 注释仍写“二维码指向 agnes-usage.xyz”。

  * `STORAGE_SHARE_NAME = "ds-share-name"`。

* `src/components/ShareCard.tsx`

  * 底部仍展示 `agnes-usage.xyz`。

#### 5. SEO / 静态资源仍有需要校准的点

* `src/app/layout.tsx`

  * OpenGraph / Twitter 图片引用 `/og-image.png`。

* `public/`

  * 实际文件为 `og_image.png`。

  * 这是一个真实资源路径不一致问题，需在实现阶段校准。

* `src/app/layout.tsx` / `src/app/guideline/page.tsx` / `src/app/privacy/page.tsx` / `src/app/terms/page.tsx` / `src/app/changelog/page.tsx` / `src/app/sitemap.ts` / `src/app/robots.ts` / `src/lib/schema.ts`

  * 默认域名 fallback 仍为 `https://agnes-usage.xyz`。

  * 这是当前已确认“暂时保留”的产品决策，不改域名语义，只做一致性校对。

#### 6. 规则文档本身已与现状不一致

* `AGENTS.md`

  * 仍完整描述 DeepSeek 双文件架构、Cache 页面、ZIP 支持、`concatFiles.ts` 等。

  * 后续若不更新，会持续误导未来协作与自动化工具。

## Assumptions & Decisions

以下决策已锁定，执行阶段不再反复确认：

* 产品改造范围：全量替换为 Agnes AI usage analysis。

* 上传模型：单个 Agnes usage CSV 文件，不做 ZIP 解压，不做双文件配对，不做多文件分析。

* 统计口径：只统计 `Consumption Status=success`。

* 视图范围：保留 `overview`、`projects`、`keys`、`trends`；移除 cache 视图。

* 视觉策略：先改文案和逻辑，截图资源可暂时复用。

* 外链策略：GitHub 仓库地址、默认域名 fallback、分享卡二维码域名暂时保留，不在本次迁移里替换为新地址。

* 版本号策略：统一记为 `0.1.0`。

* 本地持久化兼容性：`ShareModal.tsx` 中旧的 `ds-share-name` localStorage key 默认继续保留，以避免无必要地清空已有本地值；仅更新用户可见文案与注释。

* 环境策略：开发验证在 Windows 执行，但代码改动避免写入明显依赖单一平台的逻辑。

## Proposed Changes

### 阶段 1：清理失效代码与依赖

#### `src/components/CacheView.tsx`

* 处理：删除文件。

* 原因：

  * 当前 `Dashboard.tsx` 已不再引用该页面。

  * 文件仍依赖旧缓存数据结构，继续保留只会增加误导和维护成本。

#### `src/lib/concatFiles.ts`

* 处理：删除文件。

* 原因：

  * Agnes 版本已切为单 CSV。

  * 现有上传链路使用的是 `src/lib/upload.ts`，`concatFiles.ts` 已无业务价值。

#### `package.json`

* 处理：

  * 删除 `jszip` 依赖。

  * 将 `"name": "ds-usage-analysis"` 改为 Agnes 对应包名，例如 `"agnes-usage-analysis"`。

* 原因：

  * 依赖应与真实运行时保持一致。

  * 包名是仓库级命名残留，应一并收敛。

#### `package-lock.json`

* 处理：同步更新锁文件，移除 `jszip`。

* 原因：保证依赖树与 `package.json` 一致。

### 阶段 2：收敛 UI 文案、i18n 与分享展示

#### `src/i18n/translations.ts`

* 处理：

  * 删除未使用的 `tabs.cache`。

  * 删除 `cache` 文案组。

  * 校对 `projects`、`dropzone`、`landing`、`guideline`、`changelog`、`privacy`、`terms`、`share` 等分组文案。

  * 确保文案全部围绕 Agnes 单 CSV、success-only、无 cache tab 的新模型。

* 原因：

  * 当前有明显未使用旧 key。

  * 清理后可降低误用旧翻译键的风险，并改善类型提示质量。

#### `src/components/ShareModal.tsx`

* 处理：

  * 更新文件注释与用户可见说明为 Agnes 语义。

  * 保留二维码目标域名 `https://agnes-usage.xyz`。

  * 保留 `STORAGE_SHARE_NAME = "ds-share-name"` 以兼容已有 localStorage。

* 原因：

  * 用户要求保留外链和域名，但不需要继续保留 DeepSeek 风格的说明注释。

#### `src/components/ShareCard.tsx`

* 处理：

  * 保留底部展示的域名为 `agnes-usage.xyz`。

  * 校对同页其它 Agnes 文案、注释与标签，避免出现旧产品名。

* 原因：

  * 外链保留是产品边界。

  * 展示层仍需要完成品牌语义收敛。

#### `src/components/LandingPage.tsx`

* 处理：

  * 审核并清理落地页中仍残留的 DeepSeek / ZIP / 多文件 / Cache 语义。

  * 保留旧 GitHub 外链地址。

* 原因：Landing 是用户最先接触的入口，必须与 Agnes 使用方式完全一致。

#### `src/components/LandingContent.tsx`

* 处理：

  * 同步修正文案，使 `<noscript>` 回退内容与可视化 Landing 保持一致。

  * 保留旧 GitHub 外链地址。

* 原因：避免 SEO 内容和实际页面表达不一致。

#### `src/components/TitleBar.tsx` / `src/components/FooterBar.tsx`

* 处理：

  * 复查品牌文案、tooltip、版本展示。

  * 保留 GitHub 外链。

  * 确认 `FooterBar.tsx` 的 `APP_VERSION` 与 `package.json` 一致。

* 原因：顶部和页脚是全站复用组件，任何残留都会出现在所有页面。

#### `src/components/PrivacyPage.tsx` / `src/components/TermsPage.tsx` / `src/components/ChangelogPage.tsx` / `src/components/GuidelinePage.tsx`

* 处理：

  * 继续人工校对是否仍有 DeepSeek 语义残留。

  * 保留站点 URL / GitHub 外链 fallback。

* 原因：

  * 这些页面已做过主体迁移，但仍需最后一轮一致性扫描。

### 阶段 3：同步 SEO、公开文档与规则文档

#### `src/app/layout.tsx`

* 处理：

  * 校验站点标题、描述、OG/Twitter 文案是否与 Agnes 版本一致。

  * 修正 OpenGraph/Twitter 图片路径与真实静态资源名称不一致问题：

    * 二选一执行方案固定为“代码跟资源对齐”。

    * 优先将代码引用改为实际存在的 `og_image.png`，除非执行时选择改资源文件名并同步全部引用。

* 原因：

  * 当前存在真实文件名不匹配，可能导致 OG 预览图失效。

#### `src/app/guideline/page.tsx` / `src/app/privacy/page.tsx` / `src/app/terms/page.tsx` / `src/app/changelog/page.tsx`

* 处理：

  * 校验标题、描述、canonical、OpenGraph、Twitter 文案，确保与 Agnes 页面正文一致。

  * 保留默认域名 fallback `https://agnes-usage.xyz`。

* 原因：这些页面是独立 SEO 入口，必须与正文和 schema 同步。

#### `src/app/robots.ts` / `src/app/sitemap.ts` / `src/lib/schema.ts`

* 处理：

  * 维持默认域名 fallback 不变。

  * 校准 sitemap / schema / robots 的 Agnes 文案、版本信息与站点结构。

  * 核对 FAQ schema 中 “By Custom Projects” 等旧命名，必要时统一为当前 UI 命名。

* 原因：

  * 这些是爬虫与分享入口的单一事实源。

#### `README.md`

* 处理：

  * 改写为 Agnes 英文版 README。

  * 删除 ZIP、多月、双文件、Cache、DeepSeek 历史版本叙述。

  * 更新特性列表、CSV 格式、技术栈、项目结构、版本说明、开发方式。

  * 文档中明确：

    * 输入是单个 Agnes CSV

    * 只统计 success

    * 当前视图只有 4 个 tab

    * 旧域名 / 外链暂时保留

* 原因：当前 README 与真实产品差异过大，属于高风险误导。

#### `README_zh.md`

* 处理：与英文 README 同步完成中文 Agnes 化改写。

* 原因：中文是主要协作语言，必须同步。

#### `public/llms.txt` / `public/llms-full.txt`

* 处理：

  * 改写为 Agnes 版 LLM 说明。

  * 删除 DeepSeek、ZIP、多月、v0.5.x 历史。

  * 将内容与当前页面结构、FAQ、法律页、更新日志保持一致。

* 原因：

  * 这两份文件当前几乎完全属于旧产品描述。

#### `AGENTS.md`

* 处理：

  * 将项目说明、架构树、关键技术点、CSV 格式、常见任务指南同步到 Agnes 当前实现。

  * 移除 `CacheView.tsx` / `concatFiles.ts` / ZIP / 双文件说明。

  * 保留“默认域名 fallback 暂时为 agnes-usage.xyz”的当前事实。

* 原因：

  * 这是工作区强规则文件，若不更新，后续任何代理/协作者都会继续被旧架构误导。

### 阶段 4：补齐 Agnes 测试

#### `src/__tests__/DataContext.test.tsx`

* 处理：

  * 改为 mock `parseAgnesData`。

  * 改为测试 `loadFile(csvText, fileName)`。

  * 使用 Agnes 新 `ParseResult` 结构：

    * `daily`

    * `keys`

    * `summary.totalCost`

    * `summary.totalTokens`

    * `summary.totalRequests`

    * `summary.activeKeys`

    * `summary.dateRange`

    * `summary.models`

  * 验证 `loading`、成功路径、error 路径、同步 throw 路径。

* 原因：当前测试已完全失配。

#### `src/__tests__/DropZone.test.tsx`

* 处理：

  * 彻底改写，改为围绕 `src/lib/upload.ts` 与当前 `DropZone.tsx` 实现测试：

    * 渲染标题

    * 非 CSV 提示

    * 多文件提示

    * 文件过大提示

    * `readCsvFile()` 抛错时展示 processing error

    * 再次点击时清空局部错误状态

* 原因：当前测试仍围绕 `concatFiles` / ZIP，已不具备价值。

#### `src/__tests__/schema.test.ts`

* 处理：

  * 断言改为 Agnes 名称。

  * 断言 `sameAs` 为当前保留的 GitHub 地址。

  * 断言 breadcrumb 首页名称为 Agnes 标题。

  * 保留对默认域名 fallback `agnes-usage.xyz` 的断言。

* 原因：这是当前已确认的真实行为。

#### `src/__tests__/parser.test.ts`

* 处理：新增 Agnes parser 回归测试，覆盖至少以下场景：

  * 正常解析单 CSV。

  * 仅统计 `success` 状态。

  * `Consumption Quantity` 缺失一侧时生成 warning 并继续统计。

  * 缺少必需列时报 `missing_columns`。

  * `Consumption Amount(cents)` 非法时报 `malformed_row`。

  * 空文件时报 `empty_file`。

  * `Consumption Time` 非法时报 `malformed_row`。

* 原因：

  * Parser 是迁移核心，当前缺乏直接回归测试。

### 阶段 5：诊断与验证

#### 代码诊断

* 对本次修改文件执行 `GetDiagnostics`。

* 重点检查：

  * `translations.ts` 删除旧 key 后是否有类型引用报错。

  * 删除 `CacheView.tsx` / `concatFiles.ts` 后是否仍有残余 import。

#### 自动化验证

* 运行 `npm test`。

* 运行 `npm run build`。

* 如依赖已变更，再确保 lockfile 与安装结果一致。

#### 人工验收

* 用 `sampleData/2026-06-28 10_45_38.csv` 完成一次上传闭环检查。

* 核对页面行为：

  * Landing 只提示单 CSV 上传。

  * 仪表盘只有 4 个 tab。

  * Overview / By Project / By Key / Trends 均能显示数据。

  * 非 CSV / 多文件 / 超大文件会出现明确提示。

  * 分享弹窗文案是 Agnes 语义，二维码域名仍为保留地址。

  * Guideline / Privacy / Terms / Changelog / README / llms 文档语义一致。

* 核对 SEO 静态资源：

  * `og_image` 路径已与代码一致。

  * sitemap / schema / page metadata 未出现 Agnes / DeepSeek 混杂描述。

## Verification Steps

实现阶段按以下顺序执行验证，避免返工：

1. 删除死代码与依赖后，先跑一次类型/诊断检查，确认没有悬空引用。
2. 更新 `translations.ts` 后，再次检查所有受影响组件。
3. 完成测试迁移后运行 `npm test`。
4. 完成 README / llms / AGENTS 文档改写后，跑 `npm run build`。
5. 用 `sampleData/2026-06-28 10_45_38.csv` 做一次端到端手工上传验证。

## 执行顺序

为降低改动耦合，实施顺序固定如下：

1. 删除 `CacheView.tsx` / `concatFiles.ts`，同步 `package.json` / `package-lock.json`。
2. 清理 `translations.ts` 和受影响组件。
3. 收口 Landing / Share / SEO / 文档页面残留。
4. 重写测试并新增 `parser.test.ts`。
5. 改写 README / `llms.txt` / `llms-full.txt` / `AGENTS.md`。
6. 运行 diagnostics、测试、构建与手工样例验证。

## 完成标准

满足以下条件即视为 Agnes 迁移完成：

* 用户从页面和文档层面看不到 DeepSeek 双文件 / ZIP / Cache 的过期指引。

* 代码中不再保留无引用的 Cache / ZIP 逻辑。

* 所有现有测试通过，且 parser 有 Agnes 专项回归测试。

* 构建通过，SEO / 分享静态资源路径正确。

* README、`llms.txt`、`AGENTS.md` 与实际产品行为一致。

