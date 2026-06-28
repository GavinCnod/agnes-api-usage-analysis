import { describe, it, expect } from "vitest";
import { parseAgnesData } from "@/lib/parser";

const HEADER =
  "Type,Secret Key Name,Consumption Model,Consumption Amount(cents),Consumption Quantity,Consumption Time,Consumption Status";

describe("parseAgnesData", () => {
  it("parses a valid Agnes CSV and aggregates summary data", () => {
    const csv = [
      HEADER,
      "api_call,Key-A,agnes-2.0-flash,150,input:100/output:20,2026-06-28T02:45:32,success",
      "api_call,Key-A,agnes-2.0-flash,50,input:50/output:10,2026-06-28T03:45:32,success",
    ].join("\n");

    const result = parseAgnesData(csv);
    if ("error" in result) {
      throw new Error("Expected parse success");
    }

    expect(result.daily).toHaveLength(1);
    expect(result.keys).toHaveLength(1);
    expect(result.summary.totalCost).toBe(2);
    expect(result.summary.totalTokens).toBe(180);
    expect(result.summary.totalRequests).toBe(2);
    expect(result.summary.activeKeys).toBe(1);
    expect(result.summary.models).toEqual(["agnes-2.0-flash"]);
    expect(result.summary.dateRange).toEqual({
      start: "2026-06-28",
      end: "2026-06-28",
    });
  });

  it("counts only success rows and emits ignored-status warning", () => {
    const csv = [
      HEADER,
      "api_call,Key-A,agnes-2.0-flash,100,input:10/output:5,2026-06-28T02:45:32,success",
      "api_call,Key-A,agnes-2.0-flash,300,input:30/output:15,2026-06-28T02:46:32,failed",
    ].join("\n");

    const result = parseAgnesData(csv);
    if ("error" in result) {
      throw new Error("Expected parse success");
    }

    expect(result.summary.totalCost).toBe(1);
    expect(result.summary.totalRequests).toBe(1);
    expect(result.warnings.some((warning) => warning.type === "unknown_status")).toBe(true);
  });

  it("keeps partial quantity data and emits warning", () => {
    const csv = [
      HEADER,
      "api_call,Key-A,agnes-2.0-flash,100,input:10,2026-06-28T02:45:32,success",
    ].join("\n");

    const result = parseAgnesData(csv);
    if ("error" in result) {
      throw new Error("Expected parse success");
    }

    expect(result.summary.totalTokens).toBe(10);
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0].type).toBe("partial_quantity_data");
  });

  it("returns missing_columns when required columns are absent", () => {
    const csv = "Type,Secret Key Name,Consumption Model\napi_call,Key-A,agnes-2.0-flash";
    const result = parseAgnesData(csv);

    expect("error" in result).toBe(true);
    if ("error" in result) {
      expect(result.error.type).toBe("missing_columns");
    }
  });

  it("returns malformed_row when amount cannot be parsed", () => {
    const csv = [
      HEADER,
      "api_call,Key-A,agnes-2.0-flash,not-a-number,input:10/output:5,2026-06-28T02:45:32,success",
    ].join("\n");

    const result = parseAgnesData(csv);

    expect("error" in result).toBe(true);
    if ("error" in result) {
      expect(result.error.type).toBe("malformed_row");
      expect(result.error.column).toBe("Consumption Amount(cents)");
    }
  });

  it("returns empty_file when CSV has headers but no data rows", () => {
    const result = parseAgnesData(`${HEADER}\n`);

    expect("error" in result).toBe(true);
    if ("error" in result) {
      expect(result.error.type).toBe("empty_file");
    }
  });

  it("returns malformed_row when time cannot be parsed", () => {
    const csv = [
      HEADER,
      "api_call,Key-A,agnes-2.0-flash,100,input:10/output:5,not-a-time,success",
    ].join("\n");

    const result = parseAgnesData(csv);

    expect("error" in result).toBe(true);
    if ("error" in result) {
      expect(result.error.type).toBe("malformed_row");
      expect(result.error.column).toBe("Consumption Time");
    }
  });
});
