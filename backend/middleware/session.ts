import { Context } from "hono"
import Session from "../lib/session"
import { getCookie, setCookie } from "hono/cookie"

const SESSION_EXPIRE = 60 * 60 // 1 hour

function generateAndSetSessionId(c: Context) {
  const sessionId = crypto.randomUUID();
  setCookie(c, "session_id", sessionId, {
    httpOnly: false,
    path: "/",
    maxAge: SESSION_EXPIRE,
    secure: c.req.url.startsWith("https"),
    sameSite: "lax",
  });
  return sessionId;
}

export const sessionMiddleware = async (c: Context, next: () => Promise<void>) => {
  const sessionId = getCookie(c, "session_id") || generateAndSetSessionId(c);
  // console.log("Session ID:", sessionId);
  c.session = new Session(c, sessionId, SESSION_EXPIRE);
  await next();
}
