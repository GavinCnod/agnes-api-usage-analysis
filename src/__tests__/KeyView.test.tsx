/**
 * KeyView 组件测试文件
 *
 * 覆盖多模态 Hero、默认 Token 排序，以及切换图片排序后的联动行为，
 * 避免后续调整表格展示逻辑时引入回归。
 */

import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import KeyView from "@/components/KeyView";
import type { ParseResult } from "@/lib/types";
import type { ReactNode } from "react";

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
  formatCostFull: (value: number) => `cost-full:${value}`,
  formatTokensFull: (value: number) => `tokens-full:${value}`,
  formatCompactNumber: (value: number) => `compact:${value}`,
  formatCountFull: (value: number) => `count-full:${value}`,
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
    children: ReactNode;
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
        textRequestCount: 2,
        imageRequestCount: 1,
        videoRequestCount: 0,
        unknownTypeRequestCount: 0,
        inputTokens: 30,
        outputTokens: 20,
        totalTokens: 50,
        imageCount: 8,
        videoSeconds: 15,
        totalCost: 10,
      },
      {
        date: "2026-06-28",
        model: "agnes-2.0-pro",
        apiKeyName: "Key B",
        requestCount: 2,
        textRequestCount: 2,
        imageRequestCount: 0,
        videoRequestCount: 0,
        unknownTypeRequestCount: 0,
        inputTokens: 60,
        outputTokens: 40,
        totalTokens: 100,
        imageCount: 1,
        videoSeconds: 0,
        totalCost: 5,
      },
      {
        date: "2026-06-28",
        model: "agnes-2.0-pro",
        apiKeyName: "Key C",
        requestCount: 10,
        textRequestCount: 1,
        imageRequestCount: 1,
        videoRequestCount: 1,
        unknownTypeRequestCount: 0,
        inputTokens: 45,
        outputTokens: 30,
        totalTokens: 75,
        imageCount: 5,
        videoSeconds: 120,
        totalCost: 20,
      },
    ],
    keys: [
      {
        apiKeyName: "Key A",
        requestCount: 3,
        textRequestCount: 2,
        imageRequestCount: 1,
        videoRequestCount: 0,
        unknownTypeRequestCount: 0,
        totalTokens: 50,
        inputTokens: 30,
        outputTokens: 20,
        imageCount: 8,
        videoSeconds: 15,
        totalCost: 10,
      },
      {
        apiKeyName: "Key B",
        requestCount: 2,
        textRequestCount: 2,
        imageRequestCount: 0,
        videoRequestCount: 0,
        unknownTypeRequestCount: 0,
        totalTokens: 100,
        inputTokens: 60,
        outputTokens: 40,
        imageCount: 1,
        videoSeconds: 0,
        totalCost: 5,
      },
      {
        apiKeyName: "Key C",
        requestCount: 10,
        textRequestCount: 1,
        imageRequestCount: 1,
        videoRequestCount: 1,
        unknownTypeRequestCount: 0,
        totalTokens: 75,
        inputTokens: 45,
        outputTokens: 30,
        imageCount: 5,
        videoSeconds: 120,
        totalCost: 20,
      },
    ],
    summary: {
      requestCount: 15,
      textRequestCount: 5,
      imageRequestCount: 2,
      videoRequestCount: 1,
      unknownTypeRequestCount: 0,
      inputTokens: 135,
      outputTokens: 90,
      totalTokens: 225,
      imageCount: 14,
      videoSeconds: 135,
      totalCost: 35,
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
  it("shows three hero metrics, defaults to token sorting, and syncs image sorting", () => {
    mockUseData.mockReturnValue({
      filteredResult: createResult(),
    } as ReturnType<typeof useData>);
    mockUseTranslation.mockReturnValue({
      locale: "en",
      setLocale: vi.fn(),
      t: {
        empty: { keys: "No API keys found in the data." },
        kpi: { activeKeys: "Active Keys" },
        metrics: {
          textTokens: "Text Tokens",
          images: "Images",
          videoSeconds: "Video Seconds",
          requests: "Requests",
          cost: "Cost",
        },
        keys: {
          title: "Per-Key Breakdown",
          apiKeyName: "Secret Key Name",
          tokens: "Tokens",
          images: "Images",
          videoSeconds: "Video Seconds",
          cost: "Cost",
          requests: "Requests",
          heroSubtitle: "{keys} key(s) · {models} model(s)",
          heroEyebrow: "By Key",
          sortBy: "Sort By",
          progressBy: "Bars scaled by {metric}",
        },
      },
    } as ReturnType<typeof useTranslation>);
    mockUseTheme.mockReturnValue({
      theme: "light",
      toggleTheme: vi.fn(),
    });

    render(<KeyView />);

    expect(getRenderedKeyOrder()).toEqual(["Key B", "Key C", "Key A"]);
    expect(screen.getAllByText("Text Tokens").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Images").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Video Seconds").length).toBeGreaterThan(0);
    expect(screen.getByTestId("copy-Key A")).toHaveAttribute("data-value", "10");
    expect(screen.getByTestId("copy-Key B")).toHaveAttribute("data-value", "5");
    expect(screen.getByTestId("copy-Key C")).toHaveAttribute("data-value", "20");

    fireEvent.click(screen.getAllByRole("button", { name: "Images" })[0]);

    expect(getRenderedKeyOrder()).toEqual(["Key A", "Key C", "Key B"]);
    expect(screen.getByText("Bars scaled by Images")).toBeInTheDocument();
  });
});
