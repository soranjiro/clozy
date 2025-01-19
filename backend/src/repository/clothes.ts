import { D1QB } from 'workers-qb';
import { Product } from '../types';

export const clothesModule = (qb: D1QB) => ({
  create: async (data: {
    name: string
    category: string
    size: string
    color: string
    brand: string
    imageKey?: string
    imageURL?: string
    userID: string
  }) => {
    const insertData: any = {
      name: data.name,
      category: data.category,
      size: data.size,
      color: data.color,
      brand: data.brand,
      userID: data.userID,
    };

    if (data.imageKey !== undefined) {
      insertData.imageKey = data.imageKey;
    }

    if (data.imageURL !== undefined) {
      insertData.imageURL = data.imageURL;
    }

    await qb
      .insert<Product>({
        tableName: 'clothes',
        data: insertData,
        returning: '*'
      })
      .execute()
  },
  findMany: async (where: { userID: string }) => {
    const result = await qb
      .fetchAll<Product>({
        tableName: 'clothes',
        where: {
          conditions: 'userID = ?1',
          params: [where.userID],
        },
      })
      .execute();
    return result.results;
  },
  findUnique: async (where: { id: number, userID: string }) => {
    const result = await qb
      .fetchOne<Product>({
        tableName: 'clothes',
        where: {
          conditions: 'id = ?1 AND userID = ?2',
          params: [where.id, where.userID],
        },
      })
      .execute();
    return result.results;
  },
  findByDate: async (where: { date: string, userID: string }) => {
    const result = await qb
      .fetchAll<Product>({
        tableName: 'clothes',
        where: {
          conditions: 'date = ?1 AND userID = ?2',
          params: [where.date, where.userID],
        },
      })
      .execute();
    return result.results
  },
  update: async (data: {
    id: number;
    name: string;
    category: string;
    size: string;
    color: string;
    brand: string;
    imageKey?: string;
    imageURL?: string;
  }) => {
    const updateData: any = {
      name: data.name,
      category: data.category,
      size: data.size,
      color: data.color,
      brand: data.brand,
    };

    if (data.imageKey !== undefined) {
      updateData.imageKey = data.imageKey;
    }

    if (data.imageURL !== undefined) {
      updateData.imageURL = data.imageURL;
    }

    await qb
      .update<Product>({
        tableName: 'clothes',
        data: updateData,
        where: {
          conditions: 'id = ?1',
          params: [data.id],
        },
      })
      .execute();
  },
  delete: async (where: { id: number, userID: string }) => {
    await qb
      .delete({
        tableName: 'clothes',
        where: {
          conditions: 'id = ?1 AND userID = ?2',
          params: [where.id, where.userID],
        },
      })
      .execute();
  },
  deleteByUser: async (where: { userID: string }) => {
    await qb
      .delete({
        tableName: 'clothes',
        where: {
          conditions: 'userID = ?1',
          params: [where.userID],
        },
      })
      .execute();
  },
});
