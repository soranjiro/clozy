import { response } from '../_lib.js';
export const onRequestPost = () => response({ok:true},200,{'Set-Cookie':'__Host-clozy_session=; Secure; HttpOnly; Path=/; SameSite=Lax; Max-Age=0'});
