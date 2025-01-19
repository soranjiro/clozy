// db.ts
import { Env } from '../index'
import { D1QB } from 'workers-qb'
import { userModule } from './users';
import { clothesModule } from './clothes';
import { wearHistoryModule } from './wearHistory';

export const db = (env: Env) => {
  const qb = new D1QB(env.DB);

  return {
    user: userModule(qb),
    clothes: clothesModule(qb),
    wearHistory: wearHistoryModule(qb),
  };
};
