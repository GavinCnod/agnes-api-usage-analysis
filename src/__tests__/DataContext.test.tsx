import type { ReactNode } from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { DataProvider, useData } from "@/lib/DataContext";
import type { ParseResult } from "@/lib/types";

vi.mock("@/lib/parser", () => ({
  parseAgnesData: vi.fn(),
  computeKeyStats: vi.fn(() => []),
}));

import { parseAgnesData } from "@/lib/parser";

const mockParseAgnesData = parseAgnesData as ReturnType<typeof vi.fn>;

/**
 * 构造 Agnes 解析结果样例。
 */
function createParseResult(): ParseResult {
  return {
    daily: [
      {
        date: "2026-06-28",
        model: "agnes-2.0-flash",
        apiKeyName: "For-CC-by-Gavin",
        requestCount: 2,
        inputTokens: 30,
        outputTokens: 12,
        totalTokens: 42,
        totalCost: 1.5,
      },
    ],
    keys: [
      {
        apiKeyName: "For-CC-by-Gavin",
        totalTokens: 42,
        inputTokens: 30,
        outputTokens: 12,
        totalCost: 1.5,
        requestCount: 2,
      },
    ],
    summary: {
      totalCost: 1.5,
      totalTokens: 42,
      totalRequests: 2,
      activeKeys: 1,
      dateRange: { start: "2026-06-28", end: "2026-06-28" },
      models: ["agnes-2.0-flash"],
    },
    warnings: [],
  };
}

describe("DataContext", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockParseAgnesData.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  /**
   * 为 hook 测试提供 DataProvider 包裹器。
   */
  function wrapper({ children }: { children: ReactNode }) {
    return <DataProvider>{children}</DataProvider>;
  }

  it("sets loading to true when loadFile is called", () => {
    mockParseAgnesData.mockReturnValue(createParseResult());

    const { result } = renderHook(() => useData(), { wrapper });

    act(() => {
      result.current.loadFile("csv-content", "agnes.csv");
    });

    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it("stores parse result after timer flush", () => {
    mockParseAgnesData.mockReturnValue(createParseResult());

    const { result } = renderHook(() => useData(), { wrapper });

    act(() => {
      result.current.loadFile("csv-content", "agnes.csv");
    });

    act(() => {
      vi.runAllTimers();
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.fileName).toBe("agnes.csv");
    expect(result.current.result?.summary.totalCost).toBe(1.5);
    expect(result.current.result?.summary.totalRequests).toBe(2);
    expect(result.current.result?.summary.models).toEqual(["agnes-2.0-flash"]);
  });

  it("stores parser error when parseAgnesData returns an error", () => {
    const parseError = { type: "empty_file" as const, message: "Agnes usage CSV has headers but no data rows." };
    mockParseAgnesData.mockReturnValue({ error: parseError });

    const { result } = renderHook(() => useData(), { wrapper });

    act(() => {
      result.current.loadFile("", "empty.csv");
    });

    act(() => {
      vi.runAllTimers();
    });

    expect(result.current.result).toBeNull();
    expect(result.current.error).toEqual(parseError);
    expect(result.current.loading).toBe(false);
  });

  it("catches synchronous parser throws and exposes malformed_row", () => {
    mockParseAgnesData.mockImplementation(() => {
      throw new Error("Unexpected parser crash");
    });

    const { result } = renderHook(() => useData(), { wrapper });

    act(() => {
      result.current.loadFile("bad-csv", "bad.csv");
    });

    act(() => {
      vi.runAllTimers();
    });

    expect(result.current.result).toBeNull();
    expect(result.current.error).toEqual({
      type: "malformed_row",
      message: "Unexpected parser crash",
    });
    expect(result.current.loading).toBe(false);
  });
});
