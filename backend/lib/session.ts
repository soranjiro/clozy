import { Context } from "hono";
import { KVNamespace } from "@cloudflare/workers-types";

class Session {
  private data: Record<string, any> | undefined;
  private sessionId: string;
  private kv: KVNamespace;
  private loaded: boolean = false;
  private sessionExpire: number;

  constructor(c: Context, sessionId: string, sessionExpire: number = 60) {
    this.sessionId = sessionId;
    this.kv = c.env.SESSION_KV;
    this.sessionExpire = sessionExpire;
  }

  private async loadData(): Promise<void> {
    if (!this.loaded) {
      const data = await this.kv.get(this.sessionId);
      this.data = data ? JSON.parse(data) : {};
      this.loaded = true;
    }
  }

  public async set(key: string, value: any): Promise<void> {
    await this.loadData();
    this.data![key] = value;
    await this.kv.put(this.sessionId, JSON.stringify(this.data), {
      // save session data for expirationTtl seconds
      expirationTtl: this.sessionExpire,
    });
  }

  public async get(key: string): Promise<any> {
    await this.loadData();
    return this.data![key];
  }

  public async delete(key: string): Promise<void> {
    await this.loadData();
    delete this.data![key];
    await this.kv.put(this.sessionId, JSON.stringify(this.data));
  }

  public async clear(): Promise<void> {
    this.data = {};
    await this.kv.put(this.sessionId, JSON.stringify(this.data));
  }

  public async destroy(): Promise<void> {
    await this.kv.delete(this.sessionId);
  }

  // KVの全内容を表示するメソッド
  private async showAllKVContent(): Promise<void> {
    try {
      console.log("===== KV CONTENT =====");
      const listResult = await this.kv.list();
      console.log(`Total keys: ${listResult.keys.length}`);

      for (const keyInfo of listResult.keys) {
        const key = keyInfo.name;
        const value = await this.kv.get(key);
        console.log(`Key: ${key}, Value: ${value}`);
      }
      console.log("======================");
    } catch (error) {
      console.error("Error displaying KV content:", error);
    }
  }

  // KVの全内容を削除するメソッド
  public async clearAllKVContent(): Promise<void> {
    try {
      const listResult = await this.kv.list();
      for (const keyInfo of listResult.keys) {
        const key = keyInfo.name;
        await this.kv.delete(key);
      }
    } catch (error) {
      console.error("Error clearing KV content:", error);
    }
  }
}

export default Session;
