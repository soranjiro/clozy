import { Context } from "hono";
import { sign, verify } from "hono/jwt";
import { nanoid } from "nanoid";

// CSRFトークンの有効期限（30分）
const CSRF_TOKEN_EXPIRE = 30 * 60;

// CSRFトークンを生成する
export const generateCSRFToken = async (c: Context): Promise<string> => {
  const tokenId = nanoid(16);
  const user = await c.session.get("user");
  const email = user ? user.email : "";

  // トークンにはユーザーID（あれば）とランダムなIDを含める
  const payload = {
    sub: email || "anonymous",
    jti: tokenId,
    exp: Math.floor(Date.now() / 1000) + CSRF_TOKEN_EXPIRE,
  };

  const token = await sign(payload, c.env.JWT_SECRET);
  console.log("Generated CSRF token for:", email || "anonymous");
  return token;
};

// CSRFトークンを検証する
export const verifyCSRFToken = async (
  c: Context,
  token: string
): Promise<boolean> => {
  try {
    const payload = await verify(token, c.env.JWT_SECRET);
    const user = await c.session.get("user");
    const email = user ? user.email : "";

    // トークンが有効でかつ現在のユーザーと一致するか確認
    if (payload && payload.sub === (email || "anonymous")) {
      return true;
    }
    return false;
  } catch (error) {
    console.error("CSRF token validation error:", error);
    return false;
  }
};
