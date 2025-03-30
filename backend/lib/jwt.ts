import { sign, verify } from "hono/jwt";

// トークンの有効期限（1時間）
export const TOKEN_EXPIRE = 60 * 60;

export type JWTPayload = {
  email: string;
  exp: number;
};

// JWTトークンを生成する
export const generateToken = (
  payload: Omit<JWTPayload, "exp">,
  secret: string
): Promise<string> => {
  const now = Math.floor(Date.now() / 1000);
  return sign(
    {
      ...payload,
      exp: now + TOKEN_EXPIRE,
    },
    secret
  );
};

// JWTトークンを検証する
export const verifyToken = async (
  token: string,
  secret: string
): Promise<JWTPayload | null> => {
  try {
    return (await verify(token, secret)) as JWTPayload;
  } catch (error) {
    console.error("JWT検証エラー:", error);
    return null;
  }
};

// Authorization ヘッダーからトークンを抽出する
export const extractToken = (authHeader: string | undefined): string | null => {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  return authHeader.slice(7); // 'Bearer 'の後のトークン部分を取得
};
