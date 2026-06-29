# Tasks

- [x] Task 1: 重构首页总览为“用量优先”
  - [x] 将 `OverviewView.tsx` 的 Hero 主数值从总费用改为总 Token
  - [x] 将首页第一张主图从“每日费用”改为“每日 Token”
  - [x] 保留费用相关展示，但下移为次级 KPI 或次级图表
  - [x] 同步检查 `KPICards.tsx` 中首位 KPI 的优先级与标签顺序

- [x] Task 2: 调整趋势页默认指标为 Token
  - [x] 将 `TrendsView.tsx` 默认 `metric` 从 `cost` 改为 `tokens`
  - [x] 确认 Hero、tooltip、y 轴格式和切换按钮在 Token 默认态下表现正确
  - [x] 保留“费用 / Token / 请求”切换，并确认切回费用后展示正常

- [x] Task 3: 将 Key 页默认比较口径切换为 Token
  - [x] 将 `KeyView.tsx` 默认排序从 `totalCost` 改为 `totalTokens`
  - [x] 将进度条宽度基准从 `maxCost` 改为当前选中指标，默认使用 `totalTokens`
  - [x] 至少提供“费用 / Token / 请求”切换中的一种可执行方案，并在 UI 上明确当前基准
  - [x] 保留费用列复制能力，不删除现有费用字段

- [x] Task 4: 将 Project 页默认比较口径切换为 Token
  - [x] 将 `ProjectView.tsx` 默认排序从 `totalCost` 改为 `totalTokens`
  - [x] 将进度条宽度基准从 `maxCost` 改为当前选中指标，默认使用 `totalTokens`
  - [x] 至少提供“费用 / Token / 请求”切换中的一种可执行方案，并在 UI 上明确当前基准
  - [x] 保留费用列复制能力，不删除现有费用字段

- [x] Task 5: 为分享卡实现零费用回退策略
  - [x] 在 `shareCardData.ts` 中增加“全部费用为 0”的检测与回退口径选择
  - [x] 在 `ShareCard.tsx` 中让 Overview/Trends 支持按 Token 或请求渲染 Hero 与图表
  - [x] 在 `ShareCard.tsx` 中让 Projects/Keys 在零费用场景按 Token 生成图表，不再过滤 `totalCost <= 0`
  - [x] 检查 `ShareModal.tsx` 中的标签与预览摘要，避免仍固定显示费用口径

- [x] Task 6: 更新产品文案与 SEO 定位
  - [x] 更新 `translations.ts` 中首页、总览、趋势、Key、分享、FAQ 的中英文文案
  - [x] 更新 `layout.tsx` 的 metadata description、keywords、OG alt 等费用优先表述
  - [x] 更新 `schema.ts` 的 SoftwareApplication、FAQ、Organization JSON-LD 文案
  - [x] 确保文案定位变为“用量分析优先，费用为辅助维度”

- [x] Task 7: 验证核心场景
  - [x] 使用正常有费用数据的 CSV 验证首页、趋势、Key、Project、分享卡仍可显示费用
  - [x] 使用“全部费用为 0 但 Token/请求存在”的 CSV 验证零费用回退策略
  - [x] 运行 `npm test`
  - [x] 运行 `npm run build`

# Task Dependencies
- Task 2 依赖 Task 1 的首页口径调整结论，但可并行实现
- Task 3 与 Task 4 可并行
- Task 5 依赖 Task 1、Task 2、Task 3、Task 4 中的最终指标口径命名
- Task 6 与 Task 1、Task 2 可并行推进，但应在 Task 5 前统一文案口径
- Task 7 依赖 Task 1 至 Task 6 全部完成
