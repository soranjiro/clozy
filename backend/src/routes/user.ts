
import { Hono, Context } from 'hono'
import bcrypt from 'bcryptjs'
import { Env } from '../index'
import { db } from '../repository'
import { Query } from '../types'
import { deleteImagesFromR2 } from '../r2'

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
//   return c.text('User created')
// })

userRoutes.post('/signout', async (c) => {
  const { email }: Query = await c.req.json()
  if (handleDemoEmail(c, email)) {
    return c.text('Demo user cannot be deleted')
  }
  const database = db(c.env)
  await database.user.delete({ email })
  await database.clothes.deleteByUser({ userID: email });
  await database.wearHistory.deleteByUser({ email });
  await deleteImagesFromR2(c.env, email);
  return c.text('User and related data deleted')
})

userRoutes.post('/login', async (c) => {
  const { email, password }: Query = await c.req.json();
  const database = db(c.env);
  const user = await database.user.findUnique({ email: email });

  if (user && user.password && password && await bcrypt.compare(password, user.password)) {
    return c.json({ username: user.username });
  }

  return c.text('Invalid credentials', 401);
});

userRoutes.post('/logout', (c) => {
  return c.text('Logout successful')
})

userRoutes.post('/changePassword', async (c) => {
  const { email, password, newPassword }: { email: string; password: string; newPassword: string } = await c.req.json();
  if (handleDemoEmail(c, email)) {
    return c.text('Demo user cannot change password');
  }
  const database = db(c.env);
  const user = await database.user.findUnique({ email });

  if (user && user.password && await bcrypt.compare(password, user.password)) {
    if (password === newPassword) {
      return c.json({ error: 'New password must be different' }, 400);
    }
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    await database.user.updatePassword({ email, password: hashedNewPassword });
    return c.text('Password changed');
  }

  return c.text('Invalid credentials', 401);
});

export default userRoutes;
