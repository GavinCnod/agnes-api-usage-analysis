/**
 * Agnes 上传辅助模块。
 *
 * 当前版本只支持单个 CSV 文件上传，因此这里仅保留统一的文件大小上限
 * 与单文件读取工具，避免继续保留已经失效的多文件拼接逻辑。
 */

/** 单个文件上传大小上限（50 MB） */
export const MAX_UPLOAD_SIZE_BYTES = 50 * 1024 * 1024;

/**
 * 读取单个 CSV 文件文本。
 */
export function readCsvFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error ?? new Error("Failed to read CSV file."));
    reader.onload = () => resolve((reader.result as string) ?? "");
    reader.readAsText(file);
  });
}
