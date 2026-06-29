/**
 * KeyView 组件测试文件
 *
 * 覆盖默认 Token 排序，以及费用复制按钮保留这两个核心行为，
 * 避免后续调整表格展示逻辑时引入回归。
 */

import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import KeyView from "@/components/KeyView";
import type { ParseResult } from "@/lib/types";

vi.mock("@/lib/DataContext", () => ({
  useData: vi.fn(),
}));

vi.mock("@/i18n", () => ({
  useTranslation: vi.fn(),
}));

vi.mock("@/lib/ThemeContext", () => ({
  useTheme: vi.fn(),
}));

vi.mock("@/lib/format", () => ({
  formatCost: (value: number) => `cost:${value}`,
  formatTokens: (value: number) => `tokens:${value}`,
}));

vi.mock("@/components/CopyButton", () => ({
  default: ({
    value,
    name,
    children,
    className,
  }: {
    value: number;
    name: string;
    children: React.ReactNode;
    className?: string;
  }) => (
    <button type="button" data-testid={`copy-${name}`} data-value={String(value)} className={className}>
      {children}
    </button>
  ),
}));

import { useData } from "@/lib/DataContext";
import { useTranslation } from "@/i18n";
import { useTheme } from "@/lib/ThemeContext";

const mockUseData = vi.mocked(useData);
const mockUseTranslation = vi.mocked(useTranslation);
const mockUseTheme = vi.mocked(useTheme);

/**
 * 构造 KeyView 的最小 Agnes 结果样例。
 */
function createResult(): ParseResult {
  return {
    daily: [
      {
        date: "2026-06-28",
        model: "agnes-2.0-flash",
        apiKeyName: "Key A",
        requestCount: 3,
        inputTokens: 30,
        outputTokens: 20,
        totalTokens: 50,
        totalCost: 10,
      },
      {
        date: "2026-06-28",
        model: "agnes-2.0-pro",
        apiKeyName: "Key B",
        requestCount: 2,
        inputTokens: 60,
        outputTokens: 40,
        totalTokens: 100,
        totalCost: 5,
      },
      {
        date: "2026-06-28",
        model: "agnes-2.0-pro",
        apiKeyName: "Key C",
        requestCount: 10,
        inputTokens: 45,
        outputTokens: 30,
        totalTokens: 75,
        totalCost: 20,
      },
    ],
    keys: [
      {
        apiKeyName: "Key A",
        totalTokens: 50,
        inputTokens: 30,
        outputTokens: 20,
        totalCost: 10,
        requestCount: 3,
      },
      {
        apiKeyName: "Key B",
        totalTokens: 100,
        inputTokens: 60,
        outputTokens: 40,
        totalCost: 5,
        requestCount: 2,
      },
      {
        apiKeyName: "Key C",
        totalTokens: 75,
        inputTokens: 45,
        outputTokens: 30,
        totalCost: 20,
        requestCount: 10,
      },
    ],
    summary: {
      totalCost: 35,
      totalTokens: 225,
      totalRequests: 15,
      activeKeys: 3,
      dateRange: { start: "2026-06-28", end: "2026-06-28" },
      models: ["agnes-2.0-flash", "agnes-2.0-pro"],
    },
    warnings: [],
  };
}

/**
 * 读取当前表格中的 Key 名称顺序。
 */
function getRenderedKeyOrder(): string[] {
  const rows = screen.getAllByRole("row").slice(1);
  return rows.map((row) => {
    const cells = within(row).getAllByRole("cell");
    return cells[0].textContent ?? "";
  });
}

describe("KeyView", () => {
  it("defaults to totalTokens sorting and keeps cost copy buttons", () => {
    mockUseData.mockReturnValue({
      filteredResult: createResult(),
    } as ReturnType<typeof useData>);
    mockUseTranslation.mockReturnValue({
      locale: "en",
      setLocale: vi.fn(),
      t: {
        empty: { keys: "No API keys found in the data." },
        kpi: { activeKeys: "Active Keys" },
        keys: {
          title: "Per-Key Breakdown",
          apiKeyName: "Secret Key Name",
          tokens: "Tokens",
          cost: "Cost",
          requests: "Requests",
          heroSubtitle: "{keys} key(s) · {models} model(s)",
        },
      },
    } as ReturnType<typeof useTranslation>);
    mockUseTheme.mockReturnValue({
      theme: "light",
      toggleTheme: vi.fn(),
    });

    render(<KeyView />);

    expect(getRenderedKeyOrder()).toEqual(["Key B", "Key C", "Key A"]);
    expect(screen.getByTestId("copy-Key A")).toHaveAttribute("data-value", "10");
    expect(screen.getByTestId("copy-Key B")).toHaveAttribute("data-value", "5");
    expect(screen.getByTestId("copy-Key C")).toHaveAttribute("data-value", "20");
  });
});
