import { Context } from "hono";
import { generateToken } from "./jwt";

export async function setSessionUser(
  c: Context,
  email: string
): Promise<string> {
  await c.session.set("user", { email: email });

  // JWTトークンを生成して返す
  const jwtSecret = c.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error("JWT secret is not configured");
  }

  return generateToken({ email }, jwtSecret);
}

export async function validateSession(
  c: Context,
  email: string | undefined
): Promise<boolean> {
  const user = await c.session.get("user");
  if (user && email && user.email === email) {
    return true;
  }
  return false;
}

export async function clearSession(c: Context): Promise<void> {
  await c.session.destroy();
}
