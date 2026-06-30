# Agnes 多模态用量分析 Spec

## Why
最新真实 Agnes 导出 CSV 已同时包含 `api_call`、`image`、`video` 三类记录，`Consumption Quantity` 不再统一是 Token 格式。当前应用仍以“Token 优先”的单一文本计费模型为中心，导致图片/视频记录在解析、排序、展示、告警和文案层面被弱化或误判。

这次改造不再追求用单一默认主指标覆盖所有模态，而是把原先由 Token 独占的主展示位升级为三个并列的一等公民维度：文本 Token、图片数量、视频时长。这样更符合业务用户在真实 Agnes 数据上的理解方式。

## What Changes
- 将 CSV 解析模型从“仅支持 `input/output token`”升级为“按 `Type` 识别多模态数量”
- 为聚合结果增加图片数、视频时长、分类型请求数等一等公民指标
- 将原来所有以 Token 为唯一主展示位的位置改造成“文本 Token / 图片数量 / 视频时长”三维并列展示
- 为 `Overview`、`Trends`、`Keys`、`Projects` 提供多指标展示与排序能力，覆盖请求数、文本 Token、图片数、视频秒数、费用
- 在 `KPICards`、各 Tab Hero、大数字区域、分享卡中统一采用三维并列语义，避免单一默认主指标压制其他类型
- 修正 `ProjectView` 未分类项目的过滤逻辑，避免纯图片/视频项目因 `totalTokens=0` 被隐藏
- 优化 Warning 语义，将真实多模态数量格式与异常坏数据区分开
- 更新分享卡口径选择逻辑，避免主页面与分享页面对同一数据集的主展示语义不一致
- 更新中英文文案、SEO、指南和落地页描述，移除“默认主口径是 Token”的产品承诺
- 补充真实多模态数据测试，覆盖图片/视频数量解析、三维主展示、排序和分享行为
- **BREAKING** 解析结果与聚合结构将新增多模态字段，依赖旧 `totalTokens` 单口径假设的内部实现需要同步调整

## Impact
- Affected specs: CSV 解析、数据聚合、首页总览、趋势分析、Key 排行、项目分组、分享卡、国际化文案、SEO 文案、测试基线
- Affected code: `src/lib/parser.ts`、`src/lib/types.ts`、`src/lib/DataContext.tsx`、`src/components/KPICards.tsx`、`src/components/OverviewView.tsx`、`src/components/TrendsView.tsx`、`src/components/KeyView.tsx`、`src/components/ProjectView.tsx`、`src/lib/shareCardData.ts`、`src/components/ShareCard.tsx`、`src/components/ShareModal.tsx`、`src/i18n/translations.ts`、`src/lib/schema.ts`、`src/components/LandingPage.tsx`、`src/components/GuidelinePage.tsx`、`src/__tests__/*`

## Locked Product Boundaries
- 输入范围保持为单个 Agnes usage CSV，不扩展为 ZIP、双文件配对或多文件分析
- 统计口径继续保持 `Consumption Status=success`，非成功记录仅作为 Warning 汇总说明
- 仪表盘信息架构继续限制为 `overview`、`projects`、`keys`、`trends` 四个 tab，不恢复 cache 相关页面
- 现有公共外链与站点默认值继续保持不变：
  - GitHub：`https://github.com/GavinCnod/agnes-api-usage-analysis`
  - Site URL fallback：`https://agnes-usage.xyz`

## Current Implementation Status
- 当前仓库已落地多模态解析与聚合结构，`parser.ts`、`types.ts`、`DataContext.tsx` 以及模型筛选后的汇总链路已包含图片数量、视频时长和分类型请求等字段
- 当前仓库已落地首页与四个核心分析视图的三维并列展示，`KPICards.tsx`、`OverviewView.tsx`、`TrendsView.tsx`、`KeyView.tsx`、`ProjectView.tsx` 已按“文本 Token / 图片数量 / 视频时长”重构主展示语义
- 当前仓库已落地分享口径和产品文案同步，`shareCardData.ts`、`translations.ts`、`schema.ts`、`LandingPage.tsx`、`GuidelinePage.tsx` 已与多模态方案对齐
- 当前自动化测试已覆盖 `parser`、`DataContext`、`Overview`、`Trends`、`Key`、`Project` 与 `shareCardData` 的核心行为；`ShareCard.tsx` / `ShareModal.tsx` 的渲染级行为测试仍待补齐
- 当前仓库已提供真实 CSV 样本 `sampleData/2026-06-28 10_45_38.csv` 等文件，可用于后续手工上传验收；手工验收记录仍待补充到任务结果中

## ADDED Requirements
### Requirement: 多模态数量解析
系统 SHALL 根据 `Type` 与 `Consumption Quantity` 的组合格式解析 Agnes 导出的多模态数量，而不是仅识别文本 Token。

#### Scenario: 解析文本调用
- **WHEN** 一行记录的 `Type=api_call` 且 `Consumption Quantity` 为 `input:123/output:45`
- **THEN** 系统解析出 `inputTokens=123`、`outputTokens=45`、`totalTokens=168`
- **THEN** 该记录不产生格式异常 Warning

#### Scenario: 解析图片调用
- **WHEN** 一行记录的 `Type=image` 且 `Consumption Quantity` 为 `1 images`
- **THEN** 系统解析出图片数量为 `1`
- **THEN** 该记录的 Token 字段保持为 `0`
- **THEN** 该记录不被标记为“数量字段不完整”

#### Scenario: 解析视频调用
- **WHEN** 一行记录的 `Type=video` 且 `Consumption Quantity` 为 `15.0 seconds`
- **THEN** 系统解析出视频时长为 `15`
- **THEN** 该记录的 Token 字段保持为 `0`
- **THEN** 该记录不被标记为“数量字段不完整”

#### Scenario: 遇到未知数量格式
- **WHEN** 一行记录的 `Type` 已知但 `Consumption Quantity` 不符合对应格式
- **THEN** 系统继续保留该记录的请求数与费用
- **THEN** 系统产生能区分“格式漂移”与“部分 Token 数据缺失”的 Warning

### Requirement: 多模态聚合指标
系统 SHALL 在日维度、Key 维度、项目维度和总览维度提供可直接使用的多模态指标。

#### Scenario: 汇总多种类型记录
- **WHEN** 数据集同时包含文本、图片和视频记录
- **THEN** 聚合结果至少包含 `totalRequests`、`totalTokens`、`imageCount`、`videoSeconds`、`totalCost`
- **THEN** 文本、图片、视频请求数可分别被统计

#### Scenario: 过滤模型后重新聚合
- **WHEN** 用户切换模型筛选
- **THEN** 过滤后的 `summary`、`keys`、`projects` 继续保留多模态指标
- **THEN** 各指标不会因为模型筛选而丢失类型信息

### Requirement: 三维并列主展示
系统 SHALL 在原来由 Token 独占的主展示位中，并列展示文本 Token、图片数量、视频时长三个核心业务维度，而不是只保留单一默认主指标。

#### Scenario: 打开首页 KPI
- **WHEN** 用户上传包含文本、图片和视频的真实 Agnes CSV
- **THEN** `KPICards` 中能并列看到文本 Token、图片数量、视频时长
- **THEN** 这些指标与请求数、费用等辅助指标的层级关系在设计上被明确说明

#### Scenario: 打开任一 Tab 的 Hero 区域
- **WHEN** 用户进入 `Overview`、`Projects`、`Keys` 或 `Trends`
- **THEN** 原本用于显示单个 Token 大数字的位置改为三维并列大数字或等价的并列主展示组件
- **THEN** 用户无需切换指标即可看到文本、图片、视频三类核心产出

#### Scenario: 查看分享卡
- **WHEN** 用户生成分享卡
- **THEN** 分享卡的主展示区域并列呈现文本 Token、图片数量、视频时长
- **THEN** 分享卡不再因为默认主指标选择而隐藏某一模态

### Requirement: 多指标比较与排序
系统 SHALL 允许核心分析页按多种指标查看与排序，而不是固定按 Token 比较。

#### Scenario: 查看 Key 排行
- **WHEN** 用户打开 `Keys`
- **THEN** 页面可按请求数、费用、文本 Token、图片数、视频秒数切换排序基准
- **THEN** 表格排序、进度条基准和 Hero 说明保持一致

#### Scenario: 查看项目排行
- **WHEN** 用户打开 `Projects`
- **THEN** 页面可按请求数、费用、文本 Token、图片数、视频秒数切换排序基准
- **THEN** 未分类项目只要存在任一有效活动指标就应显示

### Requirement: 口径一致的分享卡
系统 SHALL 让分享卡与主页面使用一致的三维并列展示规则和辅助排序规则，避免同一数据集出现口径冲突。

#### Scenario: 数据集为混合模态
- **WHEN** 页面主展示区并列呈现文本 Token、图片数量、视频时长
- **THEN** 分享卡保留相同的三维并列主展示
- **THEN** 分享卡中的图表和排行可继续使用辅助排序指标，但不会把三维主展示压缩回单一 Token

### Requirement: 多模态产品文案
系统 SHALL 用中性、多模态的语言描述应用能力，而不是承诺“默认优先分析 Token”。

#### Scenario: 用户阅读落地页与指南
- **WHEN** 用户查看首页副标题、功能说明、指南页与 SEO 描述
- **THEN** 页面文案说明应用支持文本、图片、视频等多模态 Agnes 用量分析
- **THEN** 文案不再把 Token 作为全局默认主口径

## MODIFIED Requirements
### Requirement: Agnes CSV 解析
系统 SHALL 继续只接受单个 Agnes usage CSV，并仅统计 `Consumption Status=success` 的记录；同时，`Consumption Quantity` 的解释规则从单一 Token 格式扩展为基于 `Type` 的多模态解析。

#### Scenario: success-only 统计
- **WHEN** CSV 中混有成功与非成功记录
- **THEN** 只有 `success` 行进入后续多模态聚合
- **THEN** 非成功记录仍以 Warning 形式被汇总说明

### Requirement: 概览页展示
系统 SHALL 将 `Overview` 从“Token Hero + 每日 Token + 各 Key Token 分布”修改为“三维并列 Hero + 可解释的多模态图表”。

#### Scenario: 含图片/视频记录的数据集
- **WHEN** 用户打开 `Overview`
- **THEN** 页面不会因图片/视频记录 `totalTokens=0` 而表现为“几乎无用量”
- **THEN** 页面能在 Hero 区直接体现文本 Token、图片数量、视频时长

### Requirement: Tab Hero 并列展示
系统 SHALL 在各个分析 Tab 的大数字显示区域统一使用三维并列展示语义。

#### Scenario: 查看 Keys Tab
- **WHEN** 用户打开 `Keys`
- **THEN** Hero 区不只显示单个活跃 Key 或单个 Token 数值
- **THEN** Hero 区应并列展示文本 Token、图片数量、视频时长，并可额外补充活跃 Key 等上下文信息

#### Scenario: 查看 Projects Tab
- **WHEN** 用户打开 `Projects`
- **THEN** Hero 区不只显示项目数
- **THEN** Hero 区应并列展示文本 Token、图片数量、视频时长，并可额外补充项目数等上下文信息

#### Scenario: 查看 Trends Tab
- **WHEN** 用户打开 `Trends`
- **THEN** Hero 区不只显示某一个当前选中指标
- **THEN** Hero 区应固定并列展示文本 Token、图片数量、视频时长，趋势图区域再承载可切换的辅助指标

### Requirement: Warning 语义
系统 SHALL 区分“合法的非 Token 数量格式”和“异常的数量格式”，避免真实图片/视频记录被当作坏数据告警。

#### Scenario: 真实图片/视频 CSV
- **WHEN** CSV 中出现 `1 images` 或 `15.0 seconds`
- **THEN** 不产生 `partial_quantity_data` 误报
- **THEN** Warning 总数与文案仅反映真实异常

## REMOVED Requirements
### Requirement: Token 作为唯一主展示位
**Reason**: Agnes 真实导出已包含图片与视频生成，业务用户需要并列理解文本、图片、视频三类产出，继续固定以 Token 为唯一主展示位会造成语义失真、排序偏差和产品文案误导。
**Migration**: 将原先 Token 独占的主展示位迁移为“文本 Token / 图片数量 / 视频时长”三维并列展示；请求数、费用与其它排序指标作为辅助维度保留。
