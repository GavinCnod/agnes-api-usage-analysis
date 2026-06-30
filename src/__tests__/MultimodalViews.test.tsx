/**
 * 多模态首页与趋势视图测试文件。
 *
 * 覆盖 KPI、Overview、Trends 在三维 Hero 与指标切换上的核心行为，
 * 避免视觉改造后回退为单一 Token 展示。
 */

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import KPICards from "@/components/KPICards";
import OverviewView from "@/components/OverviewView";
import TrendsView from "@/components/TrendsView";
import type { ParseResult } from "@/lib/types";

vi.mock("echarts-for-react", () => ({
  default: ({ option, ...rest }: { option: unknown }) => (
    <div data-testid="echarts" data-option={JSON.stringify(option)} {...rest} />
  ),
}));

vi.mock("@/lib/DataContext", () => ({
  useData: vi.fn(),
}));

vi.mock("@/i18n", () => ({
  useTranslation: vi.fn(),
}));

vi.mock("@/lib/ThemeContext", () => ({
  useTheme: vi.fn(),
}));

import { useData } from "@/lib/DataContext";
import { useTranslation } from "@/i18n";
import { useTheme } from "@/lib/ThemeContext";

const mockUseData = vi.mocked(useData);
const mockUseTranslation = vi.mocked(useTranslation);
const mockUseTheme = vi.mocked(useTheme);

/**
 * 构造首页/趋势视图共用的最小多模态结果样例。
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
        inputTokens: 60,
        outputTokens: 40,
        totalTokens: 100,
        imageCount: 4,
        videoSeconds: 0,
        totalCost: 8,
      },
      {
        date: "2026-06-29",
        model: "agnes-2.0-pro",
        apiKeyName: "Key B",
        requestCount: 2,
        textRequestCount: 0,
        imageRequestCount: 1,
        videoRequestCount: 1,
        unknownTypeRequestCount: 0,
        inputTokens: 0,
        outputTokens: 0,
        totalTokens: 0,
        imageCount: 2,
        videoSeconds: 45,
        totalCost: 12,
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
        inputTokens: 60,
        outputTokens: 40,
        totalTokens: 100,
        imageCount: 4,
        videoSeconds: 0,
        totalCost: 8,
      },
      {
        apiKeyName: "Key B",
        requestCount: 2,
        textRequestCount: 0,
        imageRequestCount: 1,
        videoRequestCount: 1,
        unknownTypeRequestCount: 0,
        inputTokens: 0,
        outputTokens: 0,
        totalTokens: 0,
        imageCount: 2,
        videoSeconds: 45,
        totalCost: 12,
      },
    ],
    summary: {
      requestCount: 5,
      textRequestCount: 2,
      imageRequestCount: 2,
      videoRequestCount: 1,
      unknownTypeRequestCount: 0,
      inputTokens: 60,
      outputTokens: 40,
      totalTokens: 100,
      imageCount: 6,
      videoSeconds: 45,
      totalCost: 20,
      totalRequests: 5,
      activeKeys: 2,
      dateRange: { start: "2026-06-28", end: "2026-06-29" },
      models: ["agnes-2.0-flash", "agnes-2.0-pro"],
    },
    warnings: [],
  };
}

/**
 * 配置三类视图共用的上下文 Mock。
 */
function setupCommonMocks() {
  const result = createResult();

  mockUseData.mockReturnValue({
    result,
    filteredResult: result,
  } as ReturnType<typeof useData>);
  mockUseTranslation.mockReturnValue({
    locale: "en",
    setLocale: vi.fn(),
    t: {
      kpi: {
        totalCost: "Total Cost",
        totalRequests: "Total Requests",
        activeKeys: "Active Keys",
        totalTextTokens: "Total Text Tokens",
        generatedImages: "Generated Images",
        generatedVideoSeconds: "Video Length (s)",
        requestsPerKey: "{count} active key(s)",
        models: "{count} model(s)",
      },
      metrics: {
        textTokens: "Text Tokens",
        tabTextTokens: "Total Text Tokens",
        images: "Images",
        tabImages: "Generated Images",
        videoSeconds: "Video Seconds",
        tabVideoSeconds: "Video Length (s)",
        requests: "Requests",
        cost: "Cost",
      },
      overview: {
        heroSubtitle: "{start} - {end}",
        chartMetricLabel: "Chart Metric",
        dailyCoreMetrics: "Daily Core Metrics (Relative Comparison)",
        coreMetricsByKey: "Core Metrics by API Key (Relative Comparison)",
        normalizedHint: "Relative comparison view · Hover to inspect actual values",
      },
      trends: {
        heroSubtitle: "Over {days} days",
        coreMetricsTrend: "Core Metrics Trend (Relative Comparison)",
        normalizedHint: "Relative comparison across scales · Hover to inspect actual values",
      },
      empty: {
        overview: "No data",
        trends: "No trends",
      },
    },
  } as ReturnType<typeof useTranslation>);
  mockUseTheme.mockReturnValue({
    theme: "light",
    toggleTheme: vi.fn(),
  });
}

describe("Multimodal dashboard views", () => {
  it("renders KPI cards with three leading hero metrics", () => {
    setupCommonMocks();

    render(<KPICards />);

    expect(screen.getAllByText("Total Text Tokens").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Generated Images").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Video Length (s)").length).toBeGreaterThan(0);
    expect(screen.getByText("Total Requests")).toBeInTheDocument();
    expect(screen.getByText("Total Cost")).toBeInTheDocument();
  });

  it("keeps overview hero fixed and renders dual relative-comparison charts", () => {
    setupCommonMocks();

    render(<OverviewView />);

    expect(screen.getAllByText("Text Tokens").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Images").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Video Seconds").length).toBeGreaterThan(0);
    expect(screen.getByText("Relative comparison view · Hover to inspect actual values")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Daily Core Metrics (Relative Comparison)" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Core Metrics by API Key (Relative Comparison)" })).toBeInTheDocument();

    const charts = screen.getAllByTestId("echarts");
    const dailyOption = JSON.parse(charts[0].getAttribute("data-option") ?? "{}");

    expect(dailyOption.xAxis.data).toEqual(["2026-06-28", "2026-06-29"]);
    expect(dailyOption.series.map((item: { name: string }) => item.name)).toEqual([
      "Total Text Tokens",
      "Generated Images",
      "Video Length (s)",
    ]);
  });

  it("keeps trends hero fixed and renders a single relative-comparison trend chart", () => {
    setupCommonMocks();

    render(<TrendsView />);

    expect(screen.getAllByText("Text Tokens").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Images").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Video Seconds").length).toBeGreaterThan(0);
    expect(screen.getByText("Relative comparison across scales · Hover to inspect actual values")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Core Metrics Trend (Relative Comparison)" })).toBeInTheDocument();

    const option = JSON.parse(screen.getByTestId("echarts").getAttribute("data-option") ?? "{}");
    expect(option.xAxis.data).toEqual(["2026-06-28", "2026-06-29"]);
    expect(option.series.map((item: { name: string }) => item.name)).toEqual([
      "Total Text Tokens",
      "Generated Images",
      "Video Length (s)",
    ]);
  });
});
