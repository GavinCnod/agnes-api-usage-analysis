# Agnes AI 用量分析仪表盘 by Gavin & Mindrose Team

<p align="center">
  <img src="public/agnes-usage-logo.png" alt="Logo" width="128" />
</p>

一款纯浏览器端的 Agnes AI 多模态用量分析仪表盘。上传单个 Agnes 用量 CSV，即可在本地浏览器中即时查看文本 Token、图片数量、视频时长、费用、请求量、按 Key/项目分组统计与趋势。无需服务器、无需上传、无需注册。

> [English version](README.md)

## 姊妹项目

如果你也在分析 DeepSeek API 的调用与成本，可以继续查看同一产品矩阵下的配套开源项目：

- GitHub： [DeepSeek API Usage Analyzer Repo](https://github.com/GavinCnod/deepseek-api-usage-analysis)
- 网站：[DeepSeek API Usage Analyzer](https://deepseek-usage.xyz)

## 使用方式

1. 从 Agnes AI 导出用量 CSV。
2. 将该 CSV 上传到仪表盘。
3. 查看总览、按项目、按 Key 和趋势四个视图。
4. 所有数据都只在浏览器本地处理。

## 当前范围

- **单文件输入**：Agnes 当前导出为单个用量 CSV，不需要 ZIP 解压，也不需要 amount/cost 双文件配对。
- **只统计 success**：仅纳入 `Consumption Status=success` 的记录。
- **四个核心标签页**：`总览`、`按项目`、`按 Key`、`趋势`，每个视图均同时展示三个对等核心指标（Token / 图片 / 视频）。
- **模型筛选**：当 CSV 中存在两个及以上模型时，可对所有视图按模型过滤。
- **多指标排序**：可对项目/Key 表格按 Token、图片数、视频时长、请求量或费用进行排序。
- **自定义项目分组**：可将 Secret Key 本地分组到自定义项目中。
- **分享卡片**：可为每个仪表盘视图生成带多模态标注的 1200×630 分享图片。
- **隐私优先**：所有解析与渲染都在浏览器本地完成。
- **浅色 / 深色主题**：图表、布局和分享卡均支持主题联动。
- **中英双语**：页面和说明文档均支持中英文。

## CSV 格式

当前解析器要求 Agnes 用量 CSV 至少包含以下列：

| 列名 | 含义 |
| --- | --- |
| `Type` | 记录类型（`api_call` / `image` / `video`） |
| `Secret Key Name` | 仪表盘中展示的 Secret Key 名称 |
| `Consumption Model` | 模型名称 |
| `Consumption Amount(cents)` | Agnes 导出中的原始费用值 |
| `Consumption Quantity` | 文本 Token（`input:123/output:45`）、图片数量（`images:3`）或视频时长（`video_seconds:180`） |
| `Consumption Time` | 调用时间 |
| `Consumption Status` | 记录状态，仅统计 `success` |

## 关键行为

- `Consumption Quantity` 根据行类型解析为文本 Token (`input:123/output:45`)、图片数量 (`images:3`) 或视频秒数 (`video_seconds:180`)。
- `Type` 列会被分类归纳为 `api_call`、`image`、`video` 或 `unknown`。
- 每个数据分组同时聚合三个对等核心指标：Token 总量、图片数量、视频时长。
- `Consumption Amount(cents)` 会通过除以 `100` 聚合为当前展示使用的费用数值。
- 非 `success` 状态的记录会被忽略，并以 warning 形式提示。
- 空文件、缺列、金额格式错误、时间字段非法等情况会直接报解析错误。

## 本地开发

```bash
npm install
npm run dev
npm test
npm run build
```

## 技术栈

- Next.js 16 App Router + 静态导出
- React 19
- TypeScript 5
- Tailwind CSS v4
- Papa Parse
- ECharts 6 + `echarts-for-react`
- html2canvas
- qrcode
- Vitest + Testing Library

## 版本说明

- `v0.1.1` — 围绕三维核心指标继续打磨，`Overview` / `Trends` 改为相对对比图，分享卡补充静态最高/最低标注，统一 KPI 文案，简化 Hero 布局，集成 DeepSeek 姊妹项目模块实现 UTM 追踪的跨站链接，移除旧版指南截图改为纯文字版用户手册，并同步更新所有面向发布的文档。
- `v0.1.0`：将产品从早期 DeepSeek 用量分析项目迁移为 Agnes 单 CSV 工作流，移除 Cache 时代语义，并按 Agnes 分析体验重写界面、SEO 与文档。

## 项目说明

- 当前应用版本为 `0.1.1`。
- 站点默认 URL fallback 已经改为 `https://agnes-usage.xyz`。
- 对外 GitHub 链接已经改为 `https://github.com/GavinCnod/agnes-api-usage-analysis`。 
- 这些外部地址是当前阶段刻意保留的边界，不在本轮 Agnes 迁移里替换。
