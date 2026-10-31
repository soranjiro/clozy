import { response, reject, account, firebaseConfig, writeAllowed } from '../_lib.js';
export async function onRequestDelete({request,env}) {
  if(!writeAllowed(request)) return reject('送信元が不正です',403);
  if(!env.DB||!env.BACKUPS) return reject('クラウド保存は設定中です',503);
  const user=await account(request,env);
  if(!user) return reject('ログインが必要です',401);
  if(Math.floor(Date.now()/1000)-user.authTime>300) return reject('再ログインしてください',401);
  const config=firebaseConfig(env);
  const result=await fetch('https://identitytoolkit.googleapis.com/v1/accounts:delete?key='+encodeURIComponent(config.apiKey), {
    method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({idToken:request.headers.get('Authorization').slice(7)}),signal:AbortSignal.timeout(10000)
  });
  if(!result.ok) return reject('Firebase アカウントを削除できません',502);
  await env.DB.batch([
    env.DB.prepare('INSERT OR IGNORE INTO deleted_firebase_accounts(uid,deleted_at) VALUES(?,?)').bind(user.id,new Date().toISOString()),
    env.DB.prepare('DELETE FROM firebase_backups WHERE uid=?').bind(user.id)
  ]);
  return response({ok:true});
}
