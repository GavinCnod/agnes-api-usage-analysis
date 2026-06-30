/**
 * Agnes 多模态解析类型定义模块。
 *
 * 统一描述 CSV 原始行、聚合结果、Warning 与错误结构，
 * 供 parser、DataContext 与展示层共享。
 */

/** Agnes 已知的用量类型。 */
export type AgnesUsageType = "api_call" | "image" | "video" | "unknown";

/** 当前行解析出的数量口径。 */
export type UsageQuantityKind = "tokens" | "images" | "video_seconds" | "unknown";

/**
 * 多模态聚合指标。
 *
 * 文本、图片、视频三个维度并列存在，避免继续把 Token 视为唯一主指标。
 */
export interface UsageMetrics {
  requestCount: number;
  textRequestCount: number;
  imageRequestCount: number;
  videoRequestCount: number;
  unknownTypeRequestCount: number;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  imageCount: number;
  videoSeconds: number;
}

/**
 * Agnes 原始 usage CSV 行。
 *
 * 当前 Agnes 导出为单个 CSV 文件，每一行代表一次调用明细。
 */
export interface AgnesUsageRow {
  type: string;
  normalizedType: AgnesUsageType;
  secretKeyName: string;
  model: string;
  quantity: string;
  quantityKind: UsageQuantityKind;
  /** 原始费用列，按列名视作“分” */
  amountCents: number;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  imageCount: number;
  videoSeconds: number;
  consumptionTime: string;
  status: string;
}

/** Agnes 日级聚合数据：按日期 + 模型 + Secret Key Name 汇总 */
export interface DailyUsage extends UsageMetrics {
  date: string;
  model: string;
  apiKeyName: string;
  /** 聚合后的费用，单位为元 */
  totalCost: number;
}

/** 单个 Secret Key 在整个时间范围内的聚合统计 */
export interface KeyStats extends UsageMetrics {
  apiKeyName: string;
  totalCost: number;
}

/** 总览区可直接消费的聚合摘要。 */
export interface UsageSummary extends UsageMetrics {
  totalCost: number;
  totalRequests: number;
  activeKeys: number;
  dateRange: { start: string; end: string } | null;
  models: string[];
}

/** 顶层解析结果 */
export interface ParseResult {
  daily: DailyUsage[];
  keys: KeyStats[];
  summary: UsageSummary;
  /** Warnings generated during parsing (non-fatal) */
  warnings: ParseWarning[];
}

/** 非致命解析告警。 */
export interface ParseWarning {
  type: "partial_quantity_data" | "schema_drift" | "unknown_status";
  message: string;
  row?: number;
  usageType?: string;
  quantity?: string;
  expectedKind?: UsageQuantityKind;
  parsedKind?: UsageQuantityKind;
}

/** Possible error from parsing */
export interface ParseError {
  type: "missing_columns" | "malformed_row" | "empty_file" | "incomplete_upload";
  message: string;
  /** Row number for malformed_row */
  row?: number;
  /** Column name for malformed_row */
  column?: string;
}
