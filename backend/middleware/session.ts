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

  if (token && jwtSecret) {
    // トークンを検証
    const payload = await verifyToken(token, jwtSecret);
    if (payload) {
      // 有効なトークンの場合、セッションを初期化しユーザー情報を設定
      c.session = new Session(c, payload.email, 0);
      await c.session.set("user", { email: payload.email });
    } else {
      // 無効なトークンの場合は空のセッションを作成
      c.session = new Session(c, "", 0);
    }
  } else {
    // トークンがない場合は空のセッションを作成
    c.session = new Session(c, "", 0);
  }

  await next();
};
