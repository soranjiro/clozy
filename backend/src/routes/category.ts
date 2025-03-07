
import { Hono } from 'hono'

import { validateSession } from '../../lib/auth'

import { categories } from '../repository/categories'

const categoryRoutes = new Hono();

categoryRoutes.get('/categories', async (c) => {
  const { email } = await c.req.json();
  if (!(await validateSession(c, email))) {
    return c.json({ message: "Unauthorized" }, 401);
  }
  return c.json(categories);
});

export default categoryRoutes;
