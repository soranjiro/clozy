import bcrypt from "bcryptjs";
import { Hono, Context } from "hono";
import { setCookie } from "hono/cookie";

import { setSessionUser, validateSession, clearSession } from "../../lib/auth";
import { Env } from "../index";
import { deleteImagesFromR2 } from "../r2";

import { Query } from "../types";
import { db } from "../repository";

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

userRoutes.post("/login", async (c) => {
  try {
    const { email, password }: Query = await c.req.json();
    const database = db(c.env);
    const user = await database.user.findUnique({ email: email });

    if (
      user &&
      user.password &&
      password &&
      (await bcrypt.compare(password, user.password))
    ) {
      const token = await setSessionUser(c, email);
      return c.json({ username: user.username, token }, 200);
    }

    return c.json({ message: "Invalid credentials" }, 401);
  } catch (error) {
    return c.json({ message: "Internal server error" }, 500);
  }
});

userRoutes.post("/logout", async (c) => {
  await clearSession(c);
  return c.json({ message: "Logout successful" }, 200);
});

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
