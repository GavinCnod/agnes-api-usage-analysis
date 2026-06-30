/**
 * ProjectView 组件测试文件。
 *
 * 覆盖纯图片未分类项目可见，以及切换排序指标后项目顺序联动，
 * 避免多模态改造后再次把非 Token 项目隐藏。
 */

import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import ProjectView from "@/components/ProjectView";
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

vi.mock("@/lib/ProjectConfigContext", () => ({
  UNCATEGORIZED: "__uncategorized__",
  useProjectConfig: vi.fn(),
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
  }: {
    value: number;
    name: string;
    children: ReactNode;
  }) => (
    <button type="button" data-testid={`copy-${name}`} data-value={String(value)}>
      {children}
    </button>
  ),
}));

import { useData } from "@/lib/DataContext";
import { useTranslation } from "@/i18n";
import { useTheme } from "@/lib/ThemeContext";
import { useProjectConfig } from "@/lib/ProjectConfigContext";

const mockUseData = vi.mocked(useData);
const mockUseTranslation = vi.mocked(useTranslation);
const mockUseTheme = vi.mocked(useTheme);
const mockUseProjectConfig = vi.mocked(useProjectConfig);

/**
 * 构造 ProjectView 的最小多模态结果样例。
 */
function createResult(): ParseResult {
  return {
    daily: [
      {
        date: "2026-06-28",
        model: "agnes-2.0-flash",
        apiKeyName: "Key A",
        requestCount: 3,
        textRequestCount: 3,
        imageRequestCount: 0,
        videoRequestCount: 0,
        unknownTypeRequestCount: 0,
        inputTokens: 60,
        outputTokens: 40,
        totalTokens: 100,
        imageCount: 1,
        videoSeconds: 0,
        totalCost: 12,
      },
      {
        date: "2026-06-28",
        model: "agnes-2.0-flash",
        apiKeyName: "Key B",
        requestCount: 4,
        textRequestCount: 0,
        imageRequestCount: 4,
        videoRequestCount: 0,
        unknownTypeRequestCount: 0,
        inputTokens: 0,
        outputTokens: 0,
        totalTokens: 0,
        imageCount: 6,
        videoSeconds: 0,
        totalCost: 3,
      },
      {
        date: "2026-06-28",
        model: "agnes-2.0-pro",
        apiKeyName: "Key C",
        requestCount: 2,
        textRequestCount: 1,
        imageRequestCount: 1,
        videoRequestCount: 0,
        unknownTypeRequestCount: 0,
        inputTokens: 5,
        outputTokens: 5,
        totalTokens: 10,
        imageCount: 8,
        videoSeconds: 0,
        totalCost: 7,
      },
    ],
    keys: [],
    summary: {
      requestCount: 9,
      textRequestCount: 4,
      imageRequestCount: 5,
      videoRequestCount: 0,
      unknownTypeRequestCount: 0,
      inputTokens: 65,
      outputTokens: 45,
      totalTokens: 110,
      imageCount: 15,
      videoSeconds: 0,
      totalCost: 22,
      totalRequests: 9,
      activeKeys: 3,
      dateRange: { start: "2026-06-28", end: "2026-06-28" },
      models: ["agnes-2.0-flash", "agnes-2.0-pro"],
    },
    warnings: [],
  };
}

/**
 * 读取当前项目表格中的项目顺序。
 */
function getRenderedProjectOrder(): string[] {
  const rows = screen.getAllByRole("row").slice(1);
  return rows.map((row) => within(row).getAllByRole("cell")[0].textContent ?? "");
}

describe("ProjectView", () => {
  it("keeps uncategorized multimodal projects visible and syncs image sorting", () => {
    mockUseData.mockReturnValue({
      filteredResult: createResult(),
    } as ReturnType<typeof useData>);
    mockUseTranslation.mockReturnValue({
      locale: "en",
      setLocale: vi.fn(),
      t: {
        empty: { projects: "No data yet." },
        metrics: {
          textTokens: "Text Tokens",
          images: "Images",
          videoSeconds: "Video Seconds",
          requests: "Requests",
          cost: "Cost",
        },
        keys: {
          heroSubtitle: "{keys} key(s) · {models} model(s)",
          tokens: "Tokens",
          images: "Images",
          videoSeconds: "Video Seconds",
          cost: "Cost",
          requests: "Requests",
        },
        projects: {
          uncategorized: "Uncategorized",
          heroEyebrow: "By Project",
          sortBy: "Sort By",
          progressBy: "Bars scaled by {metric}",
          sectionTitle: "By Project",
          columnProject: "Project",
          configure: "Configure",
          emptyHint: "Configure custom project groups",
          modalTitle: "Config",
          projectName: "Project Name",
          addProject: "Add Project",
          removeProject: "Remove",
          save: "Save",
          cancel: "Cancel",
          heroProjects: "Projects",
          dragHint: "Drag keys",
          unassignedKeys: "Unassigned Keys",
          projectKeys: "Project Keys",
          dropHere: "Drop here",
          duplicateName: "Duplicate",
          unsavedChanges: "Unsaved",
          discard: "Discard",
          keyboardHint: "Keyboard",
          resetConfig: "Reset",
          assignTo: "Assign to",
        },
      },
    } as ReturnType<typeof useTranslation>);
    mockUseTheme.mockReturnValue({
      theme: "light",
      toggleTheme: vi.fn(),
    });
    mockUseProjectConfig.mockReturnValue({
      config: [
        { name: "Project Alpha", keyNames: ["Key A"] },
        { name: "Project Beta", keyNames: ["Key C"] },
      ],
      setConfig: vi.fn(),
      matchProject: (keyName: string) => {
        if (keyName === "Key A") return "Project Alpha";
        if (keyName === "Key C") return "Project Beta";
        return "__uncategorized__";
      },
    } as ReturnType<typeof useProjectConfig>);

    render(<ProjectView />);

    expect(screen.getByText("Uncategorized")).toBeInTheDocument();
    expect(getRenderedProjectOrder()).toEqual(["Project Alpha", "Project Beta", "Uncategorized"]);

    fireEvent.click(screen.getAllByRole("button", { name: "Images" })[0]);

    expect(getRenderedProjectOrder()).toEqual(["Project Beta", "Project Alpha", "Uncategorized"]);
    expect(screen.getByText("Bars scaled by Images")).toBeInTheDocument();
    expect(screen.getByTestId("copy-Project Alpha")).toHaveAttribute("data-value", "12");
    expect(screen.getByTestId("copy-Project Beta")).toHaveAttribute("data-value", "7");
  });
});
