/**
 * Agnes usage CSV 解析模块。
 *
 * 该模块负责：
 * 1. 校验 Agnes 单 CSV 的表头；
 * 2. 仅保留 success 状态记录；
 * 3. 按 `Type` 解析文本 Token、图片数量、视频时长；
 * 4. 聚合出 Dashboard 所需的日维度、Key 维度和 summary 数据。
 */

import Papa from "papaparse";
import type {
  AgnesUsageRow,
  AgnesUsageType,
  DailyUsage,
  KeyStats,
  ParseResult,
  ParseWarning,
  ParseError,
  UsageMetrics,
  UsageQuantityKind,
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

const IMAGE_QUANTITY_RE = /^(\d+(?:\.\d+)?)\s+images?$/i;
const VIDEO_QUANTITY_RE = /^(\d+(?:\.\d+)?)\s+seconds?$/i;

interface ParsedTokenQuantity {
  inputTokens: number;
  outputTokens: number;
  hasInput: boolean;
  hasOutput: boolean;
}

interface ParsedQuantityMetrics {
  quantityKind: UsageQuantityKind;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  imageCount: number;
  videoSeconds: number;
}

/**
 * 创建空白的多模态指标对象。
 */
function createEmptyUsageMetrics(): UsageMetrics {
  return {
    requestCount: 0,
    textRequestCount: 0,
    imageRequestCount: 0,
    videoRequestCount: 0,
    unknownTypeRequestCount: 0,
    inputTokens: 0,
    outputTokens: 0,
    totalTokens: 0,
    imageCount: 0,
    videoSeconds: 0,
  };
}

/**
 * 创建空白的数量解析结果。
 */
function createEmptyQuantityMetrics(): ParsedQuantityMetrics {
  return {
    quantityKind: "unknown",
    inputTokens: 0,
    outputTokens: 0,
    totalTokens: 0,
    imageCount: 0,
    videoSeconds: 0,
  };
}

/**
 * 将 Agnes 原始 Type 规整为当前支持的已知类型。
 */
function normalizeUsageType(type: string): AgnesUsageType {
  const normalized = type.trim().toLowerCase().replace(/[\s-]+/g, "_");
  if (normalized === "api_call") return "api_call";
  if (normalized === "image") return "image";
  if (normalized === "video") return "video";
  return "unknown";
}

/**
 * 将类型转换为默认期望的数量口径。
 */
function getExpectedQuantityKind(type: AgnesUsageType): UsageQuantityKind {
  if (type === "api_call") return "tokens";
  if (type === "image") return "images";
  if (type === "video") return "video_seconds";
  return "unknown";
}

/**
 * 将数量口径转换为中文描述。
 */
function getQuantityKindLabel(kind: UsageQuantityKind): string {
  if (kind === "tokens") return "文本 Token";
  if (kind === "images") return "图片数量";
  if (kind === "video_seconds") return "视频时长";
  return "未知数量";
}

/**
 * 提取 token 口径的 input/output 数值。
 */
function parseTokenQuantity(quantity: string): ParsedTokenQuantity {
  const inputMatch = quantity.match(/(?:^|[\/,\s])input:(\d+(?:\.\d+)?)/i);
  const outputMatch = quantity.match(/(?:^|[\/,\s])output:(\d+(?:\.\d+)?)/i);

  return {
    inputTokens: inputMatch ? Math.round(parseFloat(inputMatch[1])) : 0,
    outputTokens: outputMatch ? Math.round(parseFloat(outputMatch[1])) : 0,
    hasInput: Boolean(inputMatch),
    hasOutput: Boolean(outputMatch),
  };
}

/**
 * 提取图片数量。
 */
function parseImageQuantity(quantity: string): number | null {
  const match = quantity.match(IMAGE_QUANTITY_RE);
  if (!match) return null;
  return parseFloat(match[1]);
}

/**
 * 提取视频时长（秒）。
 */
function parseVideoQuantity(quantity: string): number | null {
  const match = quantity.match(VIDEO_QUANTITY_RE);
  if (!match) return null;
  return parseFloat(match[1]);
}

/**
 * 构造 token 类型的数量结果。
 */
function createTokenQuantityMetrics(parsed: ParsedTokenQuantity): ParsedQuantityMetrics {
  return {
    quantityKind: "tokens",
    inputTokens: parsed.inputTokens,
    outputTokens: parsed.outputTokens,
    totalTokens: parsed.inputTokens + parsed.outputTokens,
    imageCount: 0,
    videoSeconds: 0,
  };
}

/**
 * 构造图片类型的数量结果。
 */
function createImageQuantityMetrics(imageCount: number): ParsedQuantityMetrics {
  return {
    quantityKind: "images",
    inputTokens: 0,
    outputTokens: 0,
    totalTokens: 0,
    imageCount,
    videoSeconds: 0,
  };
}

/**
 * 构造视频类型的数量结果。
 */
function createVideoQuantityMetrics(videoSeconds: number): ParsedQuantityMetrics {
  return {
    quantityKind: "video_seconds",
    inputTokens: 0,
    outputTokens: 0,
    totalTokens: 0,
    imageCount: 0,
    videoSeconds,
  };
}

/**
 * 按 Type 解析 Agnes 的多模态数量串。
 *
 * 已知支持：
 * - `api_call` -> `input:123/output:45`
 * - `image` -> `1 images`
 * - `video` -> `15.0 seconds`
 */
function parseQuantityByType(
  type: string,
  quantity: string,
  row: number,
  warnings: ParseWarning[]
): ParsedQuantityMetrics {
  const normalizedType = normalizeUsageType(type);
  const expectedKind = getExpectedQuantityKind(normalizedType);
  const parsedTokens = parseTokenQuantity(quantity);
  const imageCount = parseImageQuantity(quantity);
  const videoSeconds = parseVideoQuantity(quantity);

  if (normalizedType === "api_call") {
    if (parsedTokens.hasInput && parsedTokens.hasOutput) {
      return createTokenQuantityMetrics(parsedTokens);
    }

    if (parsedTokens.hasInput || parsedTokens.hasOutput) {
      warnings.push({
        type: "partial_quantity_data",
        row,
        usageType: type,
        quantity,
        expectedKind,
        parsedKind: "tokens",
        message: `第 ${row} 行的文本 Token 数量不完整，已按可解析部分继续统计。原值：${quantity}`,
      });
      return createTokenQuantityMetrics(parsedTokens);
    }

    if (imageCount !== null) {
      warnings.push({
        type: "schema_drift",
        row,
        usageType: type,
        quantity,
        expectedKind,
        parsedKind: "images",
        message: `第 ${row} 行的 Type=${type} 预期为文本 Token，但数量格式更像图片数量，已按图片数量继续统计。原值：${quantity}`,
      });
      return createImageQuantityMetrics(imageCount);
    }

    if (videoSeconds !== null) {
      warnings.push({
        type: "schema_drift",
        row,
        usageType: type,
        quantity,
        expectedKind,
        parsedKind: "video_seconds",
        message: `第 ${row} 行的 Type=${type} 预期为文本 Token，但数量格式更像视频时长，已按视频时长继续统计。原值：${quantity}`,
      });
      return createVideoQuantityMetrics(videoSeconds);
    }

    warnings.push({
      type: "schema_drift",
      row,
      usageType: type,
      quantity,
      expectedKind,
      parsedKind: "unknown",
      message: `第 ${row} 行的文本 Token 数量格式无法识别，请检查 Agnes 导出格式是否变化。原值：${quantity}`,
    });
    return createEmptyQuantityMetrics();
  }

  if (normalizedType === "image") {
    if (imageCount !== null) {
      return createImageQuantityMetrics(imageCount);
    }

    if (parsedTokens.hasInput || parsedTokens.hasOutput) {
      warnings.push({
        type: "schema_drift",
        row,
        usageType: type,
        quantity,
        expectedKind,
        parsedKind: "tokens",
        message: `第 ${row} 行的 Type=${type} 预期为图片数量，但数量格式更像文本 Token，已按文本 Token 继续统计。原值：${quantity}`,
      });
      return createTokenQuantityMetrics(parsedTokens);
    }

    if (videoSeconds !== null) {
      warnings.push({
        type: "schema_drift",
        row,
        usageType: type,
        quantity,
        expectedKind,
        parsedKind: "video_seconds",
        message: `第 ${row} 行的 Type=${type} 预期为图片数量，但数量格式更像视频时长，已按视频时长继续统计。原值：${quantity}`,
      });
      return createVideoQuantityMetrics(videoSeconds);
    }

    warnings.push({
      type: "schema_drift",
      row,
      usageType: type,
      quantity,
      expectedKind,
      parsedKind: "unknown",
      message: `第 ${row} 行的图片数量格式无法识别，请检查 Agnes 导出格式是否变化。原值：${quantity}`,
    });
    return createEmptyQuantityMetrics();
  }

  if (normalizedType === "video") {
    if (videoSeconds !== null) {
      return createVideoQuantityMetrics(videoSeconds);
    }

    if (parsedTokens.hasInput || parsedTokens.hasOutput) {
      warnings.push({
        type: "schema_drift",
        row,
        usageType: type,
        quantity,
        expectedKind,
        parsedKind: "tokens",
        message: `第 ${row} 行的 Type=${type} 预期为视频时长，但数量格式更像文本 Token，已按文本 Token 继续统计。原值：${quantity}`,
      });
      return createTokenQuantityMetrics(parsedTokens);
    }

    if (imageCount !== null) {
      warnings.push({
        type: "schema_drift",
        row,
        usageType: type,
        quantity,
        expectedKind,
        parsedKind: "images",
        message: `第 ${row} 行的 Type=${type} 预期为视频时长，但数量格式更像图片数量，已按图片数量继续统计。原值：${quantity}`,
      });
      return createImageQuantityMetrics(imageCount);
    }

    warnings.push({
      type: "schema_drift",
      row,
      usageType: type,
      quantity,
      expectedKind,
      parsedKind: "unknown",
      message: `第 ${row} 行的视频时长格式无法识别，请检查 Agnes 导出格式是否变化。原值：${quantity}`,
    });
    return createEmptyQuantityMetrics();
  }

  if (parsedTokens.hasInput || parsedTokens.hasOutput) {
    warnings.push({
      type: "schema_drift",
      row,
      usageType: type,
      quantity,
      expectedKind: "unknown",
      parsedKind: "tokens",
      message: `第 ${row} 行出现未识别的 Type=${type}，但数量格式呈现为 ${getQuantityKindLabel("tokens")}，已按该口径继续统计。原值：${quantity}`,
    });
    return createTokenQuantityMetrics(parsedTokens);
  }

  if (imageCount !== null) {
    warnings.push({
      type: "schema_drift",
      row,
      usageType: type,
      quantity,
      expectedKind: "unknown",
      parsedKind: "images",
      message: `第 ${row} 行出现未识别的 Type=${type}，但数量格式呈现为 ${getQuantityKindLabel("images")}，已按该口径继续统计。原值：${quantity}`,
    });
    return createImageQuantityMetrics(imageCount);
  }

  if (videoSeconds !== null) {
    warnings.push({
      type: "schema_drift",
      row,
      usageType: type,
      quantity,
      expectedKind: "unknown",
      parsedKind: "video_seconds",
      message: `第 ${row} 行出现未识别的 Type=${type}，但数量格式呈现为 ${getQuantityKindLabel("video_seconds")}，已按该口径继续统计。原值：${quantity}`,
    });
    return createVideoQuantityMetrics(videoSeconds);
  }

  warnings.push({
    type: "schema_drift",
    row,
    usageType: type,
    quantity,
    expectedKind: "unknown",
    parsedKind: "unknown",
    message: `第 ${row} 行的 Type=${type} 与数量格式均未识别，仅保留请求数与费用统计。原值：${quantity}`,
  });
  return createEmptyQuantityMetrics();
}

/**
 * 将单行结果累加到聚合指标中。
 */
function accumulateRowMetrics(
  target: UsageMetrics,
  row: Pick<
    AgnesUsageRow,
    "normalizedType" | "inputTokens" | "outputTokens" | "totalTokens" | "imageCount" | "videoSeconds"
  >
): void {
  target.requestCount += 1;
  if (row.normalizedType === "api_call") target.textRequestCount += 1;
  else if (row.normalizedType === "image") target.imageRequestCount += 1;
  else if (row.normalizedType === "video") target.videoRequestCount += 1;
  else target.unknownTypeRequestCount += 1;

  target.inputTokens += row.inputTokens;
  target.outputTokens += row.outputTokens;
  target.totalTokens += row.totalTokens;
  target.imageCount += row.imageCount;
  target.videoSeconds += row.videoSeconds;
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

    const rawType = raw["Type"]?.trim() ?? "";
    const quantity = raw["Consumption Quantity"]?.trim() ?? "";
    const normalizedType = normalizeUsageType(rawType);
    const quantityMetrics = parseQuantityByType(rawType, quantity, row, warnings);

    rows.push({
      type: rawType,
      normalizedType,
      secretKeyName: raw["Secret Key Name"]?.trim() ?? "",
      model: raw["Consumption Model"]?.trim() ?? "",
      quantity,
      quantityKind: quantityMetrics.quantityKind,
      amountCents,
      inputTokens: quantityMetrics.inputTokens,
      outputTokens: quantityMetrics.outputTokens,
      totalTokens: quantityMetrics.totalTokens,
      imageCount: quantityMetrics.imageCount,
      videoSeconds: quantityMetrics.videoSeconds,
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
        ...createEmptyUsageMetrics(),
        totalCost: 0,
      };
      map.set(key, entry);
    }

    accumulateRowMetrics(entry, row);
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
      existing.requestCount += item.requestCount;
      existing.textRequestCount += item.textRequestCount;
      existing.imageRequestCount += item.imageRequestCount;
      existing.videoRequestCount += item.videoRequestCount;
      existing.unknownTypeRequestCount += item.unknownTypeRequestCount;
      existing.inputTokens += item.inputTokens;
      existing.outputTokens += item.outputTokens;
      existing.totalTokens += item.totalTokens;
      existing.imageCount += item.imageCount;
      existing.videoSeconds += item.videoSeconds;
      existing.totalCost += item.totalCost;
      continue;
    }

    map.set(item.apiKeyName, {
      apiKeyName: item.apiKeyName,
      requestCount: item.requestCount,
      textRequestCount: item.textRequestCount,
      imageRequestCount: item.imageRequestCount,
      videoRequestCount: item.videoRequestCount,
      unknownTypeRequestCount: item.unknownTypeRequestCount,
      inputTokens: item.inputTokens,
      outputTokens: item.outputTokens,
      totalTokens: item.totalTokens,
      imageCount: item.imageCount,
      videoSeconds: item.videoSeconds,
      totalCost: item.totalCost,
    });
  }

  return [...map.values()].sort((a, b) => b.totalCost - a.totalCost);
}

/**
 * 计算总览摘要，供 parser 与 DataContext 复用。
 */
export function computeSummary(
  daily: DailyUsage[],
  keys: KeyStats[],
  models: string[]
): ParseResult["summary"] {
  const metrics = createEmptyUsageMetrics();
  let totalCost = 0;

  for (const item of daily) {
    metrics.requestCount += item.requestCount;
    metrics.textRequestCount += item.textRequestCount;
    metrics.imageRequestCount += item.imageRequestCount;
    metrics.videoRequestCount += item.videoRequestCount;
    metrics.unknownTypeRequestCount += item.unknownTypeRequestCount;
    metrics.inputTokens += item.inputTokens;
    metrics.outputTokens += item.outputTokens;
    metrics.totalTokens += item.totalTokens;
    metrics.imageCount += item.imageCount;
    metrics.videoSeconds += item.videoSeconds;
    totalCost += item.totalCost;
  }

  const dates = [...new Set(daily.map((item) => item.date))].sort();

  return {
    ...metrics,
    totalCost,
    totalRequests: metrics.requestCount,
    activeKeys: keys.length,
    dateRange: dates.length > 0 ? { start: dates[0], end: dates[dates.length - 1] } : null,
    models,
  };
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
  const models = [...new Set(daily.map((item) => item.model))].sort();

  return {
    daily,
    keys,
    summary: computeSummary(daily, keys, models),
    warnings: parsedRows.warnings,
  };
}
