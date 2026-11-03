import { describe,it,expect,beforeAll,vi,afterEach } from 'vitest';
import { generateKeyPair, SignJWT } from 'jose';
import { verifyFirebaseToken, account, firebaseConfig, readJson } from '../functions/_lib.js';
let privateKey, publicKey;
const project='clozy-6166b';
beforeAll(async()=>({privateKey,publicKey}=await generateKeyPair('RS256')));
const claims={email:'owner@example.com',email_verified:true,auth_time:Math.floor(Date.now()/1000)-1,firebase:{sign_in_provider:'password'}};
async function token(patch={},header={}) {
 return new SignJWT({...claims,...patch}).setProtectedHeader({alg:'RS256',kid:'test',...header}).setSubject('owner-uid').setIssuer('https://securetoken.google.com/'+project).setAudience(project).setIssuedAt().setExpirationTime('1h').sign(privateKey);
}
describe('Firebase identity verification',()=>{
 it('accepts a signed verified identity and derives UID from subject',async()=>{
  expect(await verifyFirebaseToken(await token(),project,publicKey)).toMatchObject({id:'owner-uid',email:'owner@example.com'});
 });
 it('rejects tokens from another project',async()=>{
  await expect(verifyFirebaseToken(await token(),'other-project',publicKey)).rejects.toThrow();
 });
 it.each([{email_verified:false},{auth_time:9999999999},{email:null},{firebase:{sign_in_provider:'anonymous'}}])('rejects unsafe claims %j',async patch=>{
  await expect(verifyFirebaseToken(await token(patch),project,publicKey)).rejects.toThrow();
 });
 it('rejects expired and future-issued tokens',async()=>{
  for(const jwt of [new SignJWT(claims).setExpirationTime(1),new SignJWT(claims).setExpirationTime('1h').setIssuedAt(9999999999)]) {
   const t=await jwt.setSubject('owner').setIssuer('https://securetoken.google.com/'+project).setAudience(project).setProtectedHeader({alg:'RS256',kid:'test'}).sign(privateKey);
   await expect(verifyFirebaseToken(t,project,publicKey)).rejects.toThrow();
  }
 });
 it('rejects forged signatures',async()=>{
  const other=await generateKeyPair('RS256');
  await expect(verifyFirebaseToken(await token(),project,other.publicKey)).rejects.toThrow();
 });
 it('rejects unsigned emulator tokens',async()=>{
  const part=v=>Buffer.from(JSON.stringify(v)).toString('base64url');
  await expect(verifyFirebaseToken(part({alg:'none'})+'.'+part(claims)+'.',project,publicKey)).rejects.toThrow();
 });
 it('never accepts an old session cookie or a client-supplied UID',async()=>{
  expect(await account(new Request('https://clozy.pages.dev/api/me',{headers:{Cookie:'__Host-clozy_session='+ 'a'.repeat(64),'X-User-Id':'owner'}}),{})).toBeNull();
 });
 it('fails closed when client and server project configuration differ',()=>{
  expect(firebaseConfig({FIREBASE_PROJECT_ID:project,FIREBASE_WEB_CONFIG:JSON.stringify({projectId:'other',apiKey:'key',appId:'id',authDomain:'domain'})})).toBeNull();
 });
});
describe('bounded JSON reader',()=>{
 it('rejects a streamed body above the limit without relying on Content-Length',async()=>{
  await expect(readJson(new Request('https://clozy.pages.dev',{method:'POST',body:'{"a":"too big"}'}),4)).rejects.toThrow('large body');
 });
});
describe('live Firebase account status',()=>{
 afterEach(()=>vi.unstubAllGlobals());
 const env={FIREBASE_PROJECT_ID:project,FIREBASE_WEB_CONFIG:JSON.stringify({projectId:project,apiKey:'public-key',appId:'app',authDomain:'clozy-6166b.firebaseapp.com'}),DB:{prepare:()=>({bind:()=>({first:async()=>null})})}};
 async function live(liveUser) {
  const {exportJWK}=await import('jose');
  const jwk=await exportJWK(publicKey);
  vi.stubGlobal('fetch',vi.fn(async url=>String(url).includes('/jwk/')?new Response(JSON.stringify({keys:[{...jwk,kid:'test',alg:'RS256',use:'sig'}]}),{headers:{'Content-Type':'application/json'}}):new Response(JSON.stringify({users:liveUser?[liveUser]:[]}))));
  return account(new Request('https://clozy.pages.dev/api/me',{headers:{Authorization:'Bearer '+await token()}}),env);
 }
 it('accepts verified active account status after checking Google',async()=>{
  expect(await live({localId:'owner-uid',email:'owner@example.com',emailVerified:true})).toMatchObject({id:'owner-uid'});
 });
 it.each([{disabled:true},{emailVerified:false},{validSince:'9999999999'},{localId:'someone-else'},{email:'another@example.com'}])('rejects disabled, unverified, revoked or mismatched accounts %j',async patch=>{
  expect(await live({localId:'owner-uid',email:'owner@example.com',emailVerified:true,...patch})).toBeNull();
 });
 it('rejects deleted accounts',async()=>expect(await live(null)).toBeNull());
});
