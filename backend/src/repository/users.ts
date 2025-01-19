import { D1QB } from 'workers-qb';
import { User } from '../types';

export const userModule = (qb: D1QB) => ({
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
});
