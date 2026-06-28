import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import DropZone from "@/components/DropZone";

const {
  loadFileMock,
  readCsvFileMock,
  trackEventMock,
  maxUploadSizeBytes,
} = vi.hoisted(() => ({
  loadFileMock: vi.fn(),
  readCsvFileMock: vi.fn(),
  trackEventMock: vi.fn(),
  maxUploadSizeBytes: 50 * 1024 * 1024,
}));

vi.mock("@/lib/DataContext", () => ({
  useData: () => ({
    loadFile: loadFileMock,
    loading: false,
  }),
}));

vi.mock("@/i18n", () => ({
  useTranslation: () => ({
    t: {
      dropzone: {
        processing: "Processing CSV…",
        title: "Drop your Agnes usage CSV here or click to upload",
        hint: "Current version supports a single Agnes usage CSV file",
        privacy: "Files stay in your browser — nothing is uploaded",
        oversizedTitle: "File too large",
        oversizedHint: "Each file must be under 50 MB. The file \"{name}\" is {size} MB. Large files may freeze the browser.",
        processingError: "Processing Error",
        singleFileHint: "The current Agnes version supports only one CSV file at a time.",
        csvOnlyHint: "Only Agnes usage CSV files are supported.",
      },
    },
    locale: "en",
  }),
}));

vi.mock("@/lib/upload", () => ({
  MAX_UPLOAD_SIZE_BYTES: maxUploadSizeBytes,
  readCsvFile: readCsvFileMock,
}));

vi.mock("@/lib/analytics", () => ({
  trackEvent: trackEventMock,
}));

/**
 * 设置隐藏文件输入框的 files 值。
 */
function setInputFiles(input: HTMLInputElement, files: File[]) {
  Object.defineProperty(input, "files", {
    value: files,
    configurable: true,
  });
}

describe("DropZone", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    readCsvFileMock.mockResolvedValue("Type,Secret Key Name\n");
  });

  it("renders the Agnes upload title", () => {
    render(<DropZone />);
    expect(screen.getByText("Drop your Agnes usage CSV here or click to upload")).toBeDefined();
  });

  it("shows single-file hint when multiple files are selected", async () => {
    render(<DropZone />);

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    setInputFiles(input, [
      new File(["a"], "one.csv", { type: "text/csv" }),
      new File(["b"], "two.csv", { type: "text/csv" }),
    ]);

    fireEvent.change(input);

    await waitFor(() => {
      expect(screen.getByText("The current Agnes version supports only one CSV file at a time.")).toBeDefined();
    });
  });

  it("shows csv-only hint when a non-csv file is selected", async () => {
    render(<DropZone />);

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    setInputFiles(input, [new File(["x"], "usage.txt", { type: "text/plain" })]);

    fireEvent.change(input);

    await waitFor(() => {
      expect(screen.getByText("Only Agnes usage CSV files are supported.")).toBeDefined();
    });
  });

  it("shows oversize error when file exceeds the limit", async () => {
    render(<DropZone />);

    const bigFile = new File(["x"], "big.csv", { type: "text/csv" });
    Object.defineProperty(bigFile, "size", {
      value: maxUploadSizeBytes + 1024,
      configurable: true,
    });

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    setInputFiles(input, [bigFile]);

    fireEvent.change(input);

    await waitFor(() => {
      expect(screen.getByText("File too large")).toBeDefined();
      expect(screen.getByText(/big\.csv/)).toBeDefined();
    });
  });

  it("shows processing error when readCsvFile rejects", async () => {
    readCsvFileMock.mockRejectedValueOnce(new Error("Read failed"));
    render(<DropZone />);

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    setInputFiles(input, [new File(["a"], "agnes.csv", { type: "text/csv" })]);

    fireEvent.change(input);

    await waitFor(() => {
      expect(screen.getByText("Processing Error")).toBeDefined();
      expect(screen.getByText("Read failed")).toBeDefined();
    });
  });

  it("clears a local selection error when clicking the drop zone again", async () => {
    readCsvFileMock.mockRejectedValueOnce(new Error("Read failed"));
    render(<DropZone />);

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    setInputFiles(input, [new File(["a"], "agnes.csv", { type: "text/csv" })]);

    fireEvent.change(input);

    await waitFor(() => {
      expect(screen.getByText("Read failed")).toBeDefined();
    });

    const dropZone = document.querySelector(".cursor-pointer") as HTMLElement;
    fireEvent.click(dropZone);

    await waitFor(() => {
      expect(screen.queryByText("Read failed")).toBeNull();
    });
  });
});
