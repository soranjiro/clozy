import { Context } from "hono";
import Session from "../lib/session";
import { extractToken, verifyToken } from "../lib/jwt";

export const sessionMiddleware = async (
  c: Context,
  next: () => Promise<void>
) => {
  // Authorizationヘッダーからトークンを取得
  const token = extractToken(c.req.header("Authorization"));
  // JWT秘密鍵を環境変数から取得
  const jwtSecret = c.env.JWT_SECRET;

  let userEmail = "";
  let userData = {};

  if (token && jwtSecret) {
    // トークンを検証
    const payload = await verifyToken(token, jwtSecret);
    if (payload) {
      userEmail = payload.email;
      userData = { email: payload.email };
    }
  }

  // JWTから取得したデータでセッションを初期化
  c.session = new Session(c, userEmail, { user: userData });

  await next();

  // レスポンス前にセッションに変更があれば新しいトークンを生成
  const newToken = await c.session.save();
  if (newToken) {
    c.res.headers.set("X-New-Token", newToken);
  }
};
