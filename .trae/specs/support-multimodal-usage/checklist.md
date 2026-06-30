# Checklist

- [x] Spec 明确记录最新真实 CSV 同时包含 `api_call`、`image`、`video` 三类记录及其数量格式
- [x] Spec 明确说明当前 `parser.ts` 仅按 Token 解析会导致图片/视频记录被记为 `0 token`
- [x] Spec 明确说明当前 Warning 会把合法图片/视频数量格式误判为异常
- [x] Spec 明确列出 `types.ts` / `parser.ts` / `DataContext.tsx` 的多模态字段改造方向
- [x] Spec 明确要求把原先 Token 主展示位改为“文本 Token / 图片数量 / 视频时长”三维并列展示
- [x] Spec 明确列出 `KPICards.tsx` 需要并列展示文本 Token、图片数量、视频时长
- [x] Spec 明确列出 `OverviewView.tsx` 的 Hero 与主图区域不应再固定以单一 Token 为中心
- [x] Spec 明确列出 `TrendsView.tsx` 的 Hero 需要采用三维并列展示，趋势图再承载辅助指标切换
- [x] Spec 明确列出 `KeyView.tsx` 不能再固定按 `totalTokens` 排序
- [x] Spec 明确列出 `ProjectView.tsx` 不能再固定按 `totalTokens` 排序
- [x] Spec 明确列出 `ProjectView.tsx` 未分类项目不能因 `totalTokens=0` 被隐藏
- [x] Spec 明确列出 `KeyView.tsx`、`ProjectView.tsx`、`TrendsView.tsx` 各 Tab 大数字区域需要采用三维并列展示
- [x] Spec 明确列出 `shareCardData.ts` / `ShareCard.tsx` / `ShareModal.tsx` 需要采用相同的三维主展示语义
- [x] Spec 明确列出 `translations.ts`、`schema.ts`、`LandingPage.tsx`、`GuidelinePage.tsx` 等文案更新范围
- [x] Spec 明确保留当前产品边界：单 CSV、success-only、仅四个 tab、外链与域名 fallback 不变
- [x] Tasks 覆盖数据模型、解析、总览、趋势、Key、Project、分享、文案、SEO、测试与验证
- [x] Tasks 明确区分当前已落地实现、剩余验证缺口与后续待办，不再混用“仅设计不实现”的过时表述
