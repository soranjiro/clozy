import bcrypt from "bcryptjs";
import { Hono, Context } from "hono";
import { setCookie } from "hono/cookie";

import { setSessionUser, validateSession, clearSession } from "../../lib/auth";
import { generateCSRFToken } from "../../lib/csrf";
import { Env } from "../index";
import { deleteImagesFromR2 } from "../r2";

import { Query } from "../types";
import { db } from "../repository";

// XSS対策 - 文字列をエスケープする関数
const escapeHtml = (unsafe: string): string => {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

const userRoutes = new Hono<{ Bindings: Env }>();

const handleDemoEmail = (c: Context<{ Bindings: Env }>, email: string) => {
  if (email === c.env.DEMO_EMAIL) {
    return true;
  }
  return false;
};

// userRoutes.post('/signup', async (c) => {
//   const { email, password, username }: User = await c.req.json()
//   const hashedPassword = await bcrypt.hash(password, 10)
//   const database = db(c.env)
//   await database.user.create({ email, password: hashedPassword, username })
//   return c.json({ message: 'User created' })
// })

userRoutes.post("/signout", async (c) => {
  const { email }: Query = await c.req.json();
  if (!(await validateSession(c, email))) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  if (handleDemoEmail(c, email)) {
    return c.json({ message: "Demo user cannot be deleted" }, 400);
  }
  const database = db(c.env);
  await database.user.delete({ email });
  await database.clothes.deleteByUser({ userID: email });
  await database.wearHistory.deleteByUser({ email });
  await deleteImagesFromR2(c.env, email);
  // delete session
  await clearSession(c);
  return c.json({ message: "User and related data deleted" }, 200);
});

// ログインエンドポイントをPOSTに戻す
userRoutes.post("/login", async (c) => {
  try {
    // リクエストボディから認証情報を受け取る
    const { email, password }: Query = await c.req.json();

    // 必須パラメータのチェック
    if (!email || !password) {
      return c.json({ message: "Email and password are required" }, 400);
    }

    // XSS対策 - 入力値をサニタイズ
    const sanitizedEmail = escapeHtml(email);

    const database = db(c.env);
    const user = await database.user.findUnique({ email: sanitizedEmail });

    if (
      user &&
      user.password &&
      password &&
      (await bcrypt.compare(password, user.password))
    ) {
      const token = await setSessionUser(c, sanitizedEmail);

      // ユーザー名もサニタイズして返す
      const sanitizedUsername = escapeHtml(user.username);

      // SameSite=Laxでもフォームのサブミットは許可されるので安全
      setCookie(c, "auth_session", token, {
        httpOnly: true,
        secure: true,
        sameSite: "Lax", // POSTでもフォームのサブミットは許可される
        path: "/",
        maxAge: 3600, // 1時間
      });

      // CSRFトークンをヘッダーとレスポンスボディの両方に含める
      const csrfToken = await generateCSRFToken(c);
      c.res.headers.set("X-CSRF-Token", csrfToken);

      // トークンをレスポンスボディにも含める（確実に受け取れるように）
      return c.json(
        {
          username: sanitizedUsername,
          token,
          csrfToken, // ボディにもCSRFトークンを含める
        },
        200
      );
    }

    return c.json({ message: "Invalid credentials" }, 401);
  } catch (error) {
    return c.json({ message: "Internal server error" }, 500);
  }
});

// ログアウトAPIを削除

userRoutes.post("/changePassword", async (c) => {
  const {
    email,
    password,
    newPassword,
  }: { email: string; password: string; newPassword: string } =
    await c.req.json();

  if (!(await validateSession(c, email))) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  if (handleDemoEmail(c, email)) {
    return c.json({ message: "Demo user cannot change password" }, 400);
  }
  const database = db(c.env);
  const user = await database.user.findUnique({ email });

  if (
    user &&
    user.password &&
    (await bcrypt.compare(password, user.password))
  ) {
    if (password === newPassword) {
      return c.json({ message: "New password must be different" }, 400);
    }
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    await database.user.updatePassword({ email, password: hashedNewPassword });
    return c.json({ message: "Password changed" }, 200);
  }

  return c.json({ message: "Invalid credentials" }, 401);
});

export default userRoutes;
