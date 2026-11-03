import { firebaseConfig, response, reject } from '../_lib.js';
export function onRequestGet({env}) { const config=firebaseConfig(env); return config ? response(config) : reject('Firebase の接続を設定中です',503); }
