"use client";

/**
 * Agnes 解析结果上下文模块。
 *
 * 负责在客户端持有原始解析结果、模型筛选结果与多模态告警，
 * 让各个视图都能消费统一的聚合数据结构。
 */

import { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from "react";
import type { ParseResult, ParseError, ParseWarning } from "./types";
import { parseAgnesData, computeKeyStats, computeSummary } from "./parser";

/** Sentinel value for "show all models" */
export const ALL_MODELS = "__all__";

/**
 * 根据当前模型筛选结果重新构造可消费的解析结果。
 */
function filterResult(result: ParseResult | null, model: string): ParseResult | null {
  if (!result) return null;
  if (model === ALL_MODELS) return result;

  const filteredDaily = result.daily.filter((d) => d.model === model);
  const keys = computeKeyStats(filteredDaily);

  return {
    daily: filteredDaily,
    keys,
    summary: computeSummary(filteredDaily, keys, result.summary.models),
    warnings: result.warnings,
  };
}

interface DataState {
  result: ParseResult | null;
  error: ParseError | null;
  warnings: ParseWarning[];
  loading: boolean;
  fileName: string;
  selectedModel: string;
}

interface DataContextValue extends DataState {
  loadFile: (csvText: string, fileName: string) => void;
  clear: () => void;
  setSelectedModel: (model: string) => void;
  filteredResult: ParseResult | null;
}

const DataContext = createContext<DataContextValue | null>(null);

/**
 * 数据上下文提供者。
 */
export function DataProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DataState>({
    result: null,
    error: null,
    warnings: [],
    loading: false,
    fileName: "",
    selectedModel: ALL_MODELS,
  });

  const setSelectedModel = useCallback((model: string) => {
    setState((s) => ({ ...s, selectedModel: model }));
  }, []);

  const filteredResult = useMemo(
    () => filterResult(state.result, state.selectedModel),
    [state.result, state.selectedModel]
  );

  const loadFile = useCallback(
    (csvText: string, fileName: string) => {
      setState((s) => ({ ...s, loading: true, error: null, selectedModel: ALL_MODELS }));
      // Use setTimeout to avoid blocking the UI during parsing
      setTimeout(() => {
        try {
          const parsed = parseAgnesData(csvText);
          if ("error" in parsed) {
            setState({
              result: null,
              error: parsed.error,
              warnings: [],
              loading: false,
              fileName,
              selectedModel: ALL_MODELS,
            });
          } else {
            setState({
              result: parsed,
              error: null,
              warnings: parsed.warnings,
              loading: false,
              fileName,
              selectedModel: ALL_MODELS,
            });
          }
        } catch (err) {
          setState({
            result: null,
            error: {
              type: "malformed_row" as const,
              message: err instanceof Error ? err.message : "Unexpected parsing error",
            },
            warnings: [],
            loading: false,
            fileName,
            selectedModel: ALL_MODELS,
          });
        }
      }, 0);
    },
    []
  );

  const clear = useCallback(() => {
    setState({
      result: null,
      error: null,
      warnings: [],
      loading: false,
      fileName: "",
      selectedModel: ALL_MODELS,
    });
  }, []);

  return (
    <DataContext.Provider value={{ ...state, loadFile, clear, setSelectedModel, filteredResult }}>
      {children}
    </DataContext.Provider>
  );
}

/**
 * 读取 Agnes 数据上下文。
 */
export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used within DataProvider");
  return ctx;
}
