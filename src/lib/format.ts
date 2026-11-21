export function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1).replace(".", ",")} MB`;
}

/** Makes a safe "*.pdf" file name from user input. */
export function toPdfFileName(input: string, fallback = "gabungan") {
  const base = input
    .trim()
    .replace(/\.pdf$/i, "")
    .replace(/[\\/:*?"<>|]+/g, "-")
    .slice(0, 120);
  return `${base || fallback}.pdf`;
}
