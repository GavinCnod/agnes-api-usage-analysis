/**
 * Agnes usage CSV 解析模块。
 *
 * 该模块负责：
 * 1. 校验 Agnes 单 CSV 的表头；
 * 2. 仅保留 success 状态记录；
 * 3. 解析 `Consumption Quantity` 中的 input/output token；
 * 4. 聚合出 Dashboard 所需的日维度、Key 维度和 summary 数据。
 */

import Papa from "papaparse";
import type {
  AgnesUsageRow,
  DailyUsage,
  KeyStats,
  ParseResult,
  ParseWarning,
  ParseError,
} from "./types";

const REQUIRED_COLUMNS = [
  "Type",
  "Secret Key Name",
  "Consumption Model",
  "Consumption Amount(cents)",
  "Consumption Quantity",
  "Consumption Time",
  "Consumption Status",
] as const;

/**
 * 从 Agnes 的数量串中提取 input/output token。
 *
 * 支持形如 `input:123/output:45` 的格式。
 */
function parseQuantity(
  quantity: string,
  row: number,
  warnings: ParseWarning[]
): { inputTokens: number; outputTokens: number } {
  const inputMatch = quantity.match(/(?:^|[\/,\s])input:(\d+)/i);
  const outputMatch = quantity.match(/(?:^|[\/,\s])output:(\d+)/i);
  const inputTokens = inputMatch ? parseInt(inputMatch[1], 10) : 0;
  const outputTokens = outputMatch ? parseInt(outputMatch[1], 10) : 0;

  if (!inputMatch || !outputMatch) {
    warnings.push({
      type: "partial_quantity_data",
      message: `第 ${row} 行的 Consumption Quantity 格式不完整，已按可解析部分继续统计。原值：${quantity}`,
    });
  }

  return { inputTokens, outputTokens };
}

/**
 * 将 Agnes 的时间字段规整为日粒度字符串。
 */
function toUsageDate(value: string, row: number): string | { error: ParseError } {
  const trimmed = value.trim();
  const dateMatch = trimmed.match(/^(\d{4}-\d{2}-\d{2})/);
  if (dateMatch) {
    return dateMatch[1];
  }

  const date = new Date(trimmed);
  if (Number.isNaN(date.getTime())) {
    return {
      error: {
        type: "malformed_row",
        message: `第 ${row} 行的 Consumption Time 无法解析：${value}`,
        row,
        column: "Consumption Time",
      },
    };
  }

  return date.toISOString().slice(0, 10);
}

/**
 * 解析 Agnes 单 CSV 为原始行数组。
 */
function parseAgnesRows(text: string): { rows: AgnesUsageRow[]; warnings: ParseWarning[] } | { error: ParseError } {
  const result = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.trim(),
  });

  if (result.errors.length > 0 && result.data.length === 0) {
    return {
      error: {
        type: "malformed_row",
        message: `CSV parse error at row ${result.errors[0].row}: ${result.errors[0].message}`,
        row: result.errors[0].row ?? undefined,
      },
    };
  }

  if (result.data.length === 0) {
    return { error: { type: "empty_file", message: "Agnes usage CSV has headers but no data rows." } };
  }

  const headers = result.meta.fields ?? [];
  for (const column of REQUIRED_COLUMNS) {
    if (!headers.includes(column)) {
      return {
        error: {
          type: "missing_columns",
          message: `Agnes usage CSV missing required column: "${column}". Found: ${headers.join(", ")}`,
        },
      };
    }
  }

  const warnings: ParseWarning[] = [];
  const rows: AgnesUsageRow[] = [];
  const ignoredStatuses = new Map<string, number>();

  for (let index = 0; index < result.data.length; index++) {
    const raw = result.data[index];
    const row = index + 2;
    const status = raw["Consumption Status"]?.trim() ?? "";

    if (status.toLowerCase() !== "success") {
      ignoredStatuses.set(status || "(empty)", (ignoredStatuses.get(status || "(empty)") ?? 0) + 1);
      continue;
    }

    const amountRaw = raw["Consumption Amount(cents)"]?.trim() ?? "";
    const amountCents = parseFloat(amountRaw);
    if (Number.isNaN(amountCents)) {
      return {
        error: {
          type: "malformed_row",
          message: `第 ${row} 行的 Consumption Amount(cents) 无法解析：${amountRaw}`,
          row,
          column: "Consumption Amount(cents)",
        },
      };
    }

    const quantity = raw["Consumption Quantity"]?.trim() ?? "";
    const { inputTokens, outputTokens } = parseQuantity(quantity, row, warnings);

    rows.push({
      type: raw["Type"]?.trim() ?? "",
      secretKeyName: raw["Secret Key Name"]?.trim() ?? "",
      model: raw["Consumption Model"]?.trim() ?? "",
      amountCents,
      inputTokens,
      outputTokens,
      consumptionTime: raw["Consumption Time"]?.trim() ?? "",
      status,
    });
  }

  if (ignoredStatuses.size > 0) {
    const detail = [...ignoredStatuses.entries()]
      .map(([status, count]) => `${status}: ${count}`)
      .join(", ");
    warnings.push({
      type: "unknown_status",
      message: `已忽略非 success 状态记录：${detail}`,
    });
  }

  return { rows, warnings };
}

/**
 * 将 Agnes 原始行聚合为日维度数据。
 */
function buildDailyUsage(rows: AgnesUsageRow[]): { daily: DailyUsage[] } | { error: ParseError } {
  const map = new Map<string, DailyUsage>();

  for (let index = 0; index < rows.length; index++) {
    const row = rows[index];
    const usageDate = toUsageDate(row.consumptionTime, index + 2);
    if (typeof usageDate !== "string") {
      return usageDate;
    }

    const key = `${usageDate}|${row.model}|${row.secretKeyName}`;
    let entry = map.get(key);
    if (!entry) {
      entry = {
        date: usageDate,
        model: row.model,
        apiKeyName: row.secretKeyName,
        requestCount: 0,
        inputTokens: 0,
        outputTokens: 0,
        totalTokens: 0,
        totalCost: 0,
      };
      map.set(key, entry);
    }

    entry.requestCount += 1;
    entry.inputTokens += row.inputTokens;
    entry.outputTokens += row.outputTokens;
    entry.totalTokens += row.inputTokens + row.outputTokens;
    entry.totalCost += row.amountCents / 100;
  }

  return {
    daily: [...map.values()].sort(
      (a, b) => a.date.localeCompare(b.date) || a.apiKeyName.localeCompare(b.apiKeyName)
    ),
  };
}

/**
 * 计算 Secret Key 维度的聚合统计。
 */
export function computeKeyStats(daily: DailyUsage[]): KeyStats[] {
  const map = new Map<string, KeyStats>();

  for (const item of daily) {
    const existing = map.get(item.apiKeyName);
    if (existing) {
      existing.totalTokens += item.totalTokens;
      existing.inputTokens += item.inputTokens;
      existing.outputTokens += item.outputTokens;
      existing.totalCost += item.totalCost;
      existing.requestCount += item.requestCount;
      continue;
    }

    map.set(item.apiKeyName, {
      apiKeyName: item.apiKeyName,
      totalTokens: item.totalTokens,
      inputTokens: item.inputTokens,
      outputTokens: item.outputTokens,
      totalCost: item.totalCost,
      requestCount: item.requestCount,
    });
  }

  return [...map.values()].sort((a, b) => b.totalCost - a.totalCost);
}

/**
 * 解析 Agnes 单个 usage CSV 文本。
 */
export function parseAgnesData(csvText: string): ParseResult | { error: ParseError } {
  const parsedRows = parseAgnesRows(csvText);
  if ("error" in parsedRows) {
    return parsedRows;
  }

  const builtDaily = buildDailyUsage(parsedRows.rows);
  if ("error" in builtDaily) {
    return builtDaily;
  }

  const daily = builtDaily.daily;
  const keys = computeKeyStats(daily);
  const totalCost = keys.reduce((sum, item) => sum + item.totalCost, 0);
  const totalTokens = keys.reduce((sum, item) => sum + item.totalTokens, 0);
  const totalRequests = keys.reduce((sum, item) => sum + item.requestCount, 0);
  const dates = [...new Set(daily.map((item) => item.date))].sort();
  const models = [...new Set(daily.map((item) => item.model))].sort();

  return {
    daily,
    keys,
    summary: {
      totalCost,
      totalTokens,
      totalRequests,
      activeKeys: keys.length,
      dateRange: dates.length > 0 ? { start: dates[0], end: dates[dates.length - 1] } : null,
      models,
    },
    warnings: parsedRows.warnings,
  };
}
