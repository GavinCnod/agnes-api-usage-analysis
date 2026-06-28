/**
 * Agnes 原始 usage CSV 行。
 *
 * 当前 Agnes 导出为单个 CSV 文件，每一行代表一次调用明细。
 */
export interface AgnesUsageRow {
  type: string;
  secretKeyName: string;
  model: string;
  /** 原始费用列，按列名视作“分” */
  amountCents: number;
  inputTokens: number;
  outputTokens: number;
  consumptionTime: string;
  status: string;
}

/** Agnes 日级聚合数据：按日期 + 模型 + Secret Key Name 汇总 */
export interface DailyUsage {
  date: string;
  model: string;
  apiKeyName: string;
  requestCount: number;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  /** 聚合后的费用，单位为元 */
  totalCost: number;
}

/** 单个 Secret Key 在整个时间范围内的聚合统计 */
export interface KeyStats {
  apiKeyName: string;
  totalTokens: number;
  inputTokens: number;
  outputTokens: number;
  totalCost: number;
  requestCount: number;
}

/** 顶层解析结果 */
export interface ParseResult {
  daily: DailyUsage[];
  keys: KeyStats[];
  summary: {
    totalCost: number;
    totalTokens: number;
    totalRequests: number;
    activeKeys: number;
    dateRange: { start: string; end: string } | null;
    models: string[];
  };
  /** Warnings generated during parsing (non-fatal) */
  warnings: ParseWarning[];
}

export interface ParseWarning {
  type: "partial_quantity_data" | "schema_drift" | "unknown_status";
  message: string;
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
