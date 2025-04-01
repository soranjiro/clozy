import { Context, Next } from "hono";
import { generateCSRFToken, verifyCSRFToken } from "../lib/csrf";

export const csrfMiddleware = async (c: Context, next: Next) => {
  const method = c.req.method;
  const path = c.req.path;

  // 認証関連のエンドポイントを除外
  if (path === "/api/login" || path === "/api/signup") {
    await next();
    return;
  }

  // 安全なHTTPメソッド（GET, HEAD, OPTIONS）はCSRF保護不要
  if (method === "GET" || method === "HEAD" || method === "OPTIONS") {
    // CSRFトークンを生成してヘッダーにセット
    const token = await generateCSRFToken(c);
    c.res.headers.set("X-CSRF-Token", token);
    await next();
    return;
  }

  // 変更を行うHTTPメソッドはCSRFトークンの検証が必要
  const csrfToken = c.req.header("X-CSRF-Token");

  if (!csrfToken) {
    return c.json({ message: "CSRF token missing" }, 403);
  }

  const isValid = await verifyCSRFToken(c, csrfToken);

  if (!isValid) {
    return c.json({ message: "Invalid CSRF token" }, 403);
  }

  // トークンが有効ならば次へ進む
  await next();
};
