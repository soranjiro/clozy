// db.ts
import { Env } from './index'
import { D1QB } from 'workers-qb'
import { User, Product, WearHistory } from './types';


export const db = (env: Env) => {
  const qb = new D1QB(env.DB);

  return {
    user: {
      create: async (data: { email: string; password: string; username: string }) => {
        await qb
          .insert<User>({
            tableName: 'users',
            data: {
              email: data.email,
              password: data.password,
              username: data.username,
            },
            returning: '*'
          })
          .execute()
      },
      delete: async (where: { email: string }) => {
        await qb
          .delete({
            tableName: 'users',
            where: {
              conditions: 'email = ?',
              params: [where.email],
            }
          })
          .execute()
      },
      findUnique: async (where: { email: string }): Promise<User | null> => {
        const fetched = await qb
          .fetchOne<{ email: string, password: string, username: string }>({
            tableName: 'users',
            where: {
              conditions: 'email = ?1',
              params: [where.email],
            },
          })
          .execute()
        if (fetched && fetched.results) {
          const user: User = {
            email: fetched.results.email,
            password: fetched.results.password,
            username: fetched.results.username,
          };
          return user;
        }
        return null
      },
      updatePassword: async (data: { email: string; password: string }) => {
        await qb
          .update<User>({
            tableName: 'users',
            data: { password: data.password },
            where: {
              conditions: 'email = ?1',
              params: [data.email],
            },
          })
          .execute();
      },
    },
    clothes: {
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
    },
    wearHistory: {
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
    },
  };
};
