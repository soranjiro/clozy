import { Hono } from 'hono'
import { Env } from '../index'
import { db } from '../db'
import { WearHistory } from '../types'

const wearHistoryRoutes = new Hono<{ Bindings: Env }>();

wearHistoryRoutes.get('/clothesByDate', async (c) => {
  const email = c.req.query('email');
  const date = c.req.query('date');

  if (!email || !date) {
    return c.json({ error: 'Email and date are required' }, 400);
  }

  const database = db(c.env);
  const clothes = await database.wearHistory.findByDate({ date, email });

  if (!clothes.results) {
    return c.json([]);
  }
  return c.json(clothes.results.map((item) => item.clothesID));
});

wearHistoryRoutes.post('/wearHistory', async (c) => {
  const { email, clothesIDs, date }: { email: string; clothesIDs: number[]; date: string } = await c.req.json();
  const database = db(c.env);

  const existingEntries = await Promise.all(
    clothesIDs.map((clothesID) => database.wearHistory.findUnique({ email, clothesID, date }))
  );

  if (existingEntries.some((entry) => entry)) {
    return c.json({ error: 'Some items are already registered' }, 400);
  }

  await database.wearHistory.create({ email, clothesIDs, date });
  return c.text('Wear history added');
});

wearHistoryRoutes.delete('/wearHistory', async (c) => {
  const { email, clothesID, date }: WearHistory = await c.req.json();
  const database = db(c.env);
  await database.wearHistory.delete({ email, clothesID, date });
  return c.text('Wear history deleted');
});

export default wearHistoryRoutes;
