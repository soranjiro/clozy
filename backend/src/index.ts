import { Hono } from "hono";
import { logger } from "hono/logger";
import { cors } from "hono/cors";
import { secureHeaders } from "hono/secure-headers";
// import { D1Database } from '@cloudflare/workers-types'

import Session from "../lib/session";
import { sessionMiddleware } from "../middleware/session";
import { csrfMiddleware } from "../middleware/csrf";

import userRoutes from "./routes/user";
import clothesRoutes from "./routes/clothes";
import wearHistoryRoutes from "./routes/wearHistory";
import categoryRoutes from "./routes/category";

declare module "hono" {
  interface Context {
    session: Session;
  }
}

export interface Env {
  DB: D1Database;
  R2_BUCKET: R2Bucket;
  SESSION_KV: KVNamespace;
  LOCAL_ORIGIN: string;
  REMOTE_ORIGIN: string;
  DEMO_EMAIL: string;
  JWT_SECRET: string;
}

const app = new Hono<{ Bindings: Env }>();

// セキュリティヘッダを設定
app.use("*", secureHeaders());
app.use("*", logger());
app.use("*", sessionMiddleware);

app.use(
  "/api/*",
  cors({
    origin: (origin, c) => {
      return c.env.NODE_ENV === "production"
        ? c.env.REMOTE_ORIGIN
        : c.env.LOCAL_ORIGIN;
    },
    credentials: true,
    // CSRFを防止するための設定を追加
    exposeHeaders: [
      "X-CSRF-Token",
      "X-New-Token",
      "Content-Type",
      "Authorization",
    ],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    maxAge: 600,
  })
);

// 認証エンドポイントを除外してCSRF対策のミドルウェアを追加
// ログインとサインアップには適用しない
app.use("/api/*", async (c, next) => {
  const path = c.req.path;
  // ログインとサインアップの場合はCSRF保護をスキップ
  if (path === "/api/login" || path === "/api/signup") {
    await next();
  } else {
    // その他のエンドポイントにはCSRF保護を適用
    await csrfMiddleware(c, next);
  }
});

app.get("/_health", (c) => c.text("OK"));

app.route("/api", userRoutes);
app.route("/api", clothesRoutes);
app.route("/api", wearHistoryRoutes);
app.route("/api", categoryRoutes);

export default app;
