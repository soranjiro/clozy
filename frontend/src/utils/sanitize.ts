/**
 * HTML特殊文字をエスケープしてXSS攻撃を防止するユーティリティ関数
 */
export const sanitizeHtml = (html: string): string => {
  return html
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

/**
 * JSON内のすべての文字列値をサニタイズする
 */
export const sanitizeJson = <T>(json: T): T => {
  if (typeof json === "string") {
    return sanitizeHtml(json) as unknown as T;
  }

  if (typeof json !== "object" || json === null) {
    return json;
  }

  if (Array.isArray(json)) {
    return json.map(sanitizeJson) as unknown as T;
  }

  const result: Record<string, any> = {};
  Object.entries(json as Record<string, any>).forEach(([key, value]) => {
    result[key] = sanitizeJson(value);
  });

  return result as T;
};
