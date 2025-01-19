
import { Hono } from 'hono'
import { categories } from '../repository/categories'

const categoryRoutes = new Hono();

categoryRoutes.get('/categories', (c) => {
  return c.json(categories);
});

export default categoryRoutes;
