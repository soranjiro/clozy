import { response, reject, account, metadata, firebaseConfig } from '../_lib.js';
export async function onRequestGet({request,env}) {
  if(!env.DB||!env.BACKUPS||!firebaseConfig(env)) return reject('クラウド保存は設定中です',503);
  const user=await account(request,env);
  if(!user) return reject('確認済みメールでログインしてください',401);
  return response({user:{id:user.id,email:user.email},backup:await metadata(env.DB,user.id)});
}
