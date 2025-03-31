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
      // nonce（使い捨て値）を含めて再生攻撃を防止
      nonce: Math.random().toString(36).substring(2, 15),
      exp: now + TOKEN_EXPIRE,
      iat: now,
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
    const payload = (await verify(token, secret)) as JWTPayload & {
      iat?: number;
    };

    // 発行時刻が設定されているか確認
    if (!payload.iat) {
      console.error("トークンに発行時刻(iat)がありません");
      return null;
    }

    // 有効期限を確認
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp < now) {
      console.error("トークンの有効期限が切れています");
      return null;
    }

    return payload;
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
