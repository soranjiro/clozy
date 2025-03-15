import { Context } from "hono";

export async function setSessionUser(c: Context, email: any): Promise<void> {
  await c.session.set("user", { email: email });
}

export async function validateSession(c: Context, email: string | undefined): Promise<boolean> {
  const user = await c.session.get("user");
  if (user && email && user.email === email) {
    return true;
  }
  return false;
}

export async function clearSession(c: Context): Promise<void> {
  await c.session.destroy();
}
