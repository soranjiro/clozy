import { D1QB } from 'workers-qb';
import { WearHistory } from '../types';

export const wearHistoryModule = (qb: D1QB) => ({
  create: async (data: { email: string; clothesIDs: number[]; date: string }) => {
    await Promise.all(
      data.clothesIDs.map((clothesID) =>
        qb.insert<WearHistory>({
          tableName: 'wearHistory',
          data: {
            email: data.email,
            clothesID,
            date: data.date,
          },
          returning: '*'
        }).execute()
      )
    );
  },
  findByDate: async (where: { date: string, email: string }) => {
    const result = await qb
      .fetchAll<WearHistory>({
        tableName: 'wearHistory',
        where: {
          conditions: 'date = ?1 AND email = ?2',
          params: [where.date, where.email],
        },
      })
      .execute();
    return result;
  },
  findUnique: async (where: { email: string; clothesID: number; date: string }) => {
    const result = await qb
      .fetchOne<WearHistory>({
        tableName: 'wearHistory',
        where: {
          conditions: 'email = ?1 AND clothesID = ?2 AND date = ?3',
          params: [where.email, where.clothesID, where.date],
        },
      })
      .execute();
    return result.results ? result.results : null;
  },
  delete: async (where: { email: string; clothesID: number; date: string }) => {
    await qb
      .delete({
        tableName: 'wearHistory',
        where: {
          conditions: 'email = ?1 AND clothesID = ?2 AND date = ?3',
          params: [where.email, where.clothesID, where.date],
        },
      })
      .execute();
  },
  deleteByUser: async (where: { email: string }) => {
    await qb
      .delete({
        tableName: 'wearHistory',
        where: {
          conditions: 'email = ?1',
          params: [where.email],
        },
      })
      .execute();
  },
});
