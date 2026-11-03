// Local operator integration test: two disposable Firebase users, isolated preview storage.
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const file='/private/tmp/clozy-auth-fixtures.json';
if(process.argv[2]==='prepare') {
 const password=crypto.randomUUID()+crypto.randomUUID();
 const users=[1,2].map(()=>({localId:'qa-clozy-'+crypto.randomUUID(),email:'qa-clozy-'+crypto.randomUUID()+'@example.invalid',emailVerified:true,passwordHash:createHash('sha256').update(password).digest('base64')}));
 fs.writeFileSync(file,JSON.stringify({users}),{mode:0o600});
 fs.writeFileSync('/private/tmp/clozy-auth-password',password,{mode:0o600});
 console.log('Prepared two disposable verified fixture identities');
} else {
 const base=process.env.CLOZY_URL;
 assert(base && /^https:\/\/[a-z0-9-]+\.clozy\.pages\.dev$/.test(base) && !base.includes('//main.'),'Isolated preview only');
 const {apiKey}=await (await fetch(base+'/api/firebase-config')).json();
 const fixtures=JSON.parse(fs.readFileSync(file)).users;
 assert(fixtures.every(u=>u.localId.startsWith('qa-clozy-')&&u.email.endsWith('@example.invalid')));
 const password=fs.readFileSync('/private/tmp/clozy-auth-password','utf8');
 const tokens=[];
 const firebase=async(path,body)=>{
  const r=await fetch('https://identitytoolkit.googleapis.com/v1/'+path+'?key='+encodeURIComponent(apiKey),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
  const json=await r.json();assert(r.ok,JSON.stringify(json));return json;
 };
 const req=async(i,path,method='GET',payload,revision)=>fetch(base+'/api/'+path,{method,headers:{Authorization:'Bearer '+tokens[i],...(method==='GET'?{}:{Origin:new URL(base).origin,'Content-Type':'application/json'}),...(revision===undefined?{}:{'If-Match':String(revision)})},body:payload===undefined?undefined:JSON.stringify(payload)});
 try {
  for(const u of fixtures) tokens.push((await firebase('accounts:signInWithPassword',{email:u.email,password,returnSecureToken:true})).idToken);
  const me=await req(0,'me'); assert.equal(me.status,200); assert.equal((await me.json()).user.id,fixtures[0].localId);
  const id=crypto.randomUUID(),backup={version:1,exportedAt:new Date().toISOString(),clothing:[{id,name:'Firebase preview fixture',category:'トップス',brand:'',color:'',size:'',notes:'',favorite:false,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()}],wears:[],images:[]};
  assert.equal((await req(0,'backup','PUT',backup,0)).status,200,'write');
  assert.equal((await req(0,'backup','PUT',backup,0)).status,409,'stale revision');
  assert.equal((await req(1,'backup?uid='+fixtures[0].localId)).status,404,'another UID cannot read fixture');
  const downloaded=await req(0,'backup'); assert.equal(downloaded.status,200);assert.deepEqual(await downloaded.json(),backup);
  for(let i=0;i<2;i++) {assert.equal((await req(i,'account','DELETE',{})).status,200,'Firebase + D1 account deletion');assert.equal((await req(i,'me')).status,401,'deleted token rejected');}
  console.log('PASS: real Firebase signed tokens, UID lookup, backup roundtrip, conflict, cross-UID denial, account deletion and deleted token rejection');
 } finally {
  for(const idToken of tokens) await fetch('https://identitytoolkit.googleapis.com/v1/accounts:delete?key='+encodeURIComponent(apiKey),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({idToken})});
 }
}
