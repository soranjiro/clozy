import { Context } from "hono";

interface SessionData {
  [key: string]: any;
}

class Session {
  private context: Context;
  private sessionId: string;
  private expiration: number;
  private data: SessionData = {};
  private isLoaded: boolean = false;

  constructor(context: Context, sessionId: string, expiration: number) {
    this.context = context;
    this.sessionId = sessionId;
    this.expiration = expiration;
  }

  private async load(): Promise<void> {
    if (this.isLoaded || !this.sessionId) return;

    try {
      const sessionData = await this.context.env.SESSION_KV.get(this.sessionId);
      if (sessionData) {
        this.data = JSON.parse(sessionData);
      }
    } catch (error) {
      console.error("セッションデータ読み込みエラー:", error);
    }

    this.isLoaded = true;
  }

  private async save(): Promise<void> {
    if (!this.sessionId) return;

    try {
      await this.context.env.SESSION_KV.put(
        this.sessionId,
        JSON.stringify(this.data),
        { expirationTtl: this.expiration }
      );
    } catch (error) {
      console.error("セッションデータ保存エラー:", error);
    }
  }

  async get(key: string): Promise<any> {
    await this.load();
    return this.data[key];
  }

  async set(key: string, value: any): Promise<void> {
    await this.load();
    this.data[key] = value;
    await this.save();
  }

  async destroy(): Promise<void> {
    if (!this.sessionId) return;

    try {
      await this.context.env.SESSION_KV.delete(this.sessionId);
    } catch (error) {
      console.error("セッション削除エラー:", error);
    }

    this.data = {};
    this.isLoaded = false;
  }
}

export default Session;
