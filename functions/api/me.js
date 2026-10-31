import { response, reject, account, metadata } from '../_lib.js';
export async function onRequestGet({ request, env }) {
  if(!env.DB||!env.BACKUPS) return reject('クラウド保存は設定中です',503);
  const user=await account(request,env.DB);
  if(!user) return reject('ログインが必要です',401);
  return response({user,backup:await metadata(env.DB,user.id)});
}