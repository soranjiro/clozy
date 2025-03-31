import { Context } from "hono";
import { generateToken } from "./jwt";

interface SessionData {
  [key: string]: any;
}

class Session {
  private context: Context;
  private sessionData: SessionData = {};
  private userEmail: string;
  private isDirty: boolean = false;

  constructor(
    context: Context,
    userEmail: string,
    initialData: SessionData = {}
  ) {
    this.context = context;
    this.userEmail = userEmail;
    this.sessionData = initialData;
  }

  async get(key: string): Promise<any> {
    return this.sessionData[key];
  }

  async set(key: string, value: any): Promise<void> {
    this.sessionData[key] = value;
    this.isDirty = true;
  }

  async save(): Promise<string | null> {
    if (!this.isDirty || !this.userEmail) return null;

    // JWTトークンを生成して返す
    const jwtSecret = this.context.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error("JWT secret is not configured");
    }

    // Cookieの設定を調整 - SameSite=Laxを使用
    this.context.res.headers.set(
      "Set-Cookie",
      `auth_session=${this.userEmail}; HttpOnly; SameSite=Lax; Secure; Path=/; Max-Age=3600`
    );

    this.isDirty = false;
    return generateToken({ email: this.userEmail }, jwtSecret);
  }

  async destroy(): Promise<void> {
    // セッション破棄時にCookieも削除
    this.context.res.headers.set(
      "Set-Cookie",
      `auth_session=; HttpOnly; SameSite=Lax; Secure; Path=/; Max-Age=0`
    );

    this.sessionData = {};
    this.userEmail = "";
    this.isDirty = false;
  }
}

export default Session;
