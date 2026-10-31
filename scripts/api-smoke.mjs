// Read-only checks on isolated preview. Positive authorization and UID separation
// are tested with signed test keys and real API handlers in Vitest; no emulator
// token is ever accepted by the deployed server.
import assert from 'node:assert/strict';
const base=process.env.CLOZY_URL;
assert(base && /^https:\/\/[a-z0-9-]+\.clozy\.pages\.dev\/?$/.test(base),'Preview URL required');
assert(!['https://clozy.pages.dev','https://main.clozy.pages.dev'].includes(base.replace(/\/$/,'')),'Never test production');
const config=await fetch(base+'/api/firebase-config');
assert.equal(config.status,200);assert.equal((await config.json()).projectId,'clozy-6166b');
for(const path of ['me','backup']) {
 for(const headers of [{},{Authorization:'Bearer forged'},{Cookie:'__Host-clozy_session='+ 'a'.repeat(64)}]) {
  const r=await fetch(base+'/api/'+path,{headers});assert.equal(r.status,401,path+' must reject invalid identities');
 }
}
for(const path of ['register','login','salt']) {
 const r=await fetch(base+'/api/'+path,{method:path==='salt'?'GET':'POST'});assert.equal(r.status,410);
}
const put=await fetch(base+'/api/backup',{method:'PUT',headers:{Origin:new URL(base).origin,'Content-Type':'application/json','If-Match':'0'},body:'{}'});
assert.equal(put.status,401);
console.log('PASS: Firebase configuration, unauthorized access, legacy cookie rejection, old authentication disabled');
