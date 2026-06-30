# Tasks

- [x] Task 1: 固化真实数据画像与目标展示语义
  - [x] 用最新真实 CSV 明确记录当前存在的 `api_call`、`image`、`video` 三类类型，以及对应的 `Consumption Quantity` 格式
  - [x] 明确“文本 Token / 图片数量 / 视频时长”作为原 Token 主展示位的三维并列替代方案
  - [x] 明确请求数、费用、活跃 Key、项目数在新方案中的辅助角色边界

- [x] Task 2: 设计并落档多模态解析与聚合模型
  - [x] 扩展 `parser.ts` / `types.ts` 的目标结构，定义数量类型、图片数、视频时长、分类型请求数等字段
  - [x] 定义合法数量格式、部分缺失格式、未知格式的区分策略与 Warning 语义
  - [x] 明确 `DataContext` 和模型筛选后的聚合结果如何保留多模态字段

- [x] Task 3: 设计 KPI 与总览的三维并列展示改造
  - [x] 重新定义 `KPICards.tsx` 的卡片顺序，确保文本 Token、图片数量、视频时长在首屏并列可见
  - [x] 重新定义 `OverviewView.tsx` 的 Hero 结构，使原单一大数字区域改为三维并列主展示
  - [x] 说明在纯文本、纯图片视频、混合数据三种场景下首页三维展示应如何表现

- [x] Task 4: 设计各 Tab Hero 与多指标比较方案
  - [x] 定义 `TrendsView.tsx` 的 Hero 三维并列展示、趋势图辅助指标及全部切换项
  - [x] 定义 `KeyView.tsx` 的 Hero 三维并列展示、排序基准、进度条基准与表头联动
  - [x] 定义 `ProjectView.tsx` 的 Hero 三维并列展示、排序基准、进度条基准、未分类显示条件与表头联动
  - [x] 记录纯图片/视频项目和 Key 在新方案下不得被弱化或隐藏

- [x] Task 5: 设计分享卡与页面三维主展示一致性方案
  - [x] 重新定义 `shareCardData.ts` 的主展示结构，使文本 Token、图片数量、视频时长并列输出
  - [x] 定义 `ShareCard.tsx` 与 `ShareModal.tsx` 在多模态数据集中的三维 Hero、图表和排行展示
  - [x] 明确分享页与主页面必须使用同一套三维主展示规则与辅助排序规则

- [x] Task 6: 设计文案、SEO 与指南改造清单
  - [x] 逐项列出 `translations.ts` 中所有需从“Token 优先”改为“文本 Token / 图片数量 / 视频时长并列展示”的文案分组
  - [x] 列出 `schema.ts`、`LandingPage.tsx`、`GuidelinePage.tsx` 等需要同步调整的描述
  - [x] 明确保留哪些既有产品决策不变，例如单 CSV、四个 tab、success-only、现有外链与域名 fallback

- [x] Task 7: 设计测试与验证清单
  - [x] 列出 parser 需要新增的图片/视频/未知数量格式测试
  - [x] 列出 KPI、Overview、Trends、Key、Project、Share 的三维并列展示行为测试
  - [x] 明确手工验收应覆盖的真实 CSV 场景，以及需要执行的 `npm test`、`npm run build`

- [x] Task 8: 补齐方案文档边界与状态表达
  - [x] 在 `spec.md` 中显式写明单 CSV、success-only、仅四个 tab、GitHub 外链与站点域名 fallback 保持不变
  - [x] 将 `tasks.md` 中实施进度说明与设计任务分离，避免“本轮只做方案设计”与“已完成实现”混写

- [x] Task 9: 补齐 Share 验证与真实 CSV 手工验收
  - [x] 为 `ShareCard.tsx` / `ShareModal.tsx` 补充三维 Hero 与辅助指标切换的渲染级测试
  - [x] 提供可用于手工上传验收的真实多模态 CSV 样本，并记录需覆盖的文本 / 图片 / 视频混合场景
  - [x] 基于真实 CSV 执行一次手工上传检查并记录结果

# Task Dependencies
- Task 2 依赖 Task 1 的真实数据画像与默认口径结论
- Task 3、Task 4、Task 5 依赖 Task 2 的多模态数据结构定义
- Task 6 依赖 Task 3、Task 4、Task 5 的页面口径结论
- Task 7 依赖 Task 2 至 Task 6 的最终方案

# Current Implementation Status
- 已用真实多模态 CSV 明确当前数据画像：`sampleData/2026-06-30 09_40_27.csv` 中同时存在 `api_call`、`image`、`video` 三类记录，数量格式分别覆盖 `input/output`、`images`、`seconds`
- 当前仓库已完成多模态解析、聚合字段与模型筛选链路改造，`parser.ts`、`types.ts`、`DataContext.tsx` 已具备文本、图片、视频三类核心指标
- 当前仓库已完成首页、`Overview`、`Trends`、`Keys`、`Projects` 与分享数据口径的三维并列展示改造，主展示语义不再以单一 Token 为中心
- 当前仓库已完成文案、SEO、落地页与指南页同步，且继续保留单 CSV、四个 tab、success-only、现有外链与域名 fallback
- 当前仓库已包含真实 CSV 样本 `sampleData/2026-06-28 10_45_38.csv`、`sampleData/2026-06-28 10_45_55.csv`、`sampleData/2026-06-30 09_40_27.csv`
- 已完成自动化验证：`npm test`、`npm run build` 全部通过
- 已完成手工上传验收：上传 `sampleData/2026-06-30 09_40_27.csv` 后，页面正确进入分析态，仅显示 4 个 tab，`Overview`、`By Custom Projects`、`By Key`、`Trends` 均正常渲染，分享弹窗可正常打开并展示 `Text Tokens / Images / Video Seconds` 三维核心指标

# Remaining Validation Gaps
- 当前自动化测试已覆盖 `parser`、`KPICards`、`OverviewView`、`TrendsView`、`KeyView`、`ProjectView`、`DataContext`、`shareCardData`、`ShareCard.tsx` 和 `ShareModal.tsx`
- 当前主要实现与验证项均已闭环；若继续推进，后续工作将转为体验抛光或产品文案微调
