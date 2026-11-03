// Temporary operator-only migration worker. Never include in the Pages deployment.
// OLD_DB / OLD_IMAGES are read only in this source. All writes use NEW_DB / NEW_IMAGES.
import { Buffer } from 'node:buffer';
import { convert } from './convert.mjs';
const root='legacy-import/2026-11-01-yuta';
const hash=async bytes=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(x=>x.toString(16).padStart(2,'0')).join('');
const enc=new TextEncoder();
async function list(bucket) {let cursor,objects=[]; do {const r=await bucket.list({limit:1000,cursor});objects.push(...r.objects);cursor=r.truncated?r.cursor:undefined;}while(cursor);return objects;}
async function putVerified(bucket,key,bytes,type='application/json') {
  const sha256=await hash(bytes), old=await bucket.get(key);
  if(old) {if(await hash(await old.arrayBuffer())!==sha256) throw new Error('Refuse overwrite: '+key);}
  else await bucket.put(key,bytes,{httpMetadata:{contentType:type},customMetadata:{sha256}});
  const check=await bucket.get(key);
  if(!check || await hash(await check.arrayBuffer())!==sha256) throw new Error('Copy verification failed');
  return {key,bytes:bytes.byteLength,sha256};
}
async function audit(env) {
  const clothes=(await env.OLD_DB.prepare('SELECT * FROM clothes ORDER BY id').all()).results;
  const history=(await env.OLD_DB.prepare('SELECT * FROM wearHistory ORDER BY id').all()).results;
  const users=(await env.OLD_DB.prepare('SELECT email,username FROM users ORDER BY email').all()).results;
  const objects=await list(env.OLD_IMAGES), refs=new Set(clothes.filter(c=>c.imageKey).map(c=>c.imageKey));
  const missing=[...refs].filter(k=>!objects.some(o=>o.key===k));
  const broken=history.filter(w=>!clothes.some(c=>c.id===w.clothesID && c.userID===w.email));
  if(missing.length || broken.length) throw new Error('Source references invalid');
  return {clothes,history,users,objects,refs,summary:{accounts:users.length,clothes:clothes.length,wears:history.length,images:objects.length,referenced:refs.size,unreferenced:objects.filter(o=>!refs.has(o.key)).length,missing:missing.length,broken:broken.length}};
}
export default {async fetch(request,env) {
  const expected=enc.encode('Bearer '+env.MIGRATION_SECRET), received=enc.encode(request.headers.get('Authorization')||'');
  if(received.length!==expected.length || !crypto.subtle.timingSafeEqual(expected,received)) return new Response('Unauthorized',{status:401});
  try {
    const source=env.SOURCE_EMAIL,target=env.TARGET_EMAIL;
    if(!source || !target) throw new Error('Explicit account mapping required');
    const mode=new URL(request.url).pathname;
    if(mode==='/download') {const object=await env.NEW_IMAGES.get(root+'/backup.json');return object?new Response(object.body,{headers:{'Content-Type':'application/json','Cache-Control':'no-store'}}):new Response('Missing',{status:404});}
    const a=await audit(env);
    if(mode==='/audit') return Response.json(a.summary);
    if(request.method!=='POST'||!['/prepare','/commit','/verify'].includes(mode)) return new Response('Not found',{status:404});
    const uid=env.TARGET_UID;
    if(!uid) throw new Error('UID required');
    const selected=a.clothes.filter(c=>c.userID===source), history=a.history.filter(w=>w.email===source);
    const now='2026-11-01T00:00:00.000Z';
    const data=await convert(selected,history,source,now);
    if(data.clothing.length!==26 || data.wears.length!==99) throw new Error('Source has changed; re-audit');
    if(mode==='/prepare') {
      const copied=[];
      for(const o of a.objects.filter(o=>!a.refs.has(o.key))) {
        const image=await env.OLD_IMAGES.get(o.key);
        copied.push(await putVerified(env.NEW_IMAGES,root+'/unreferenced/'+o.key,await image.arrayBuffer(),image.httpMetadata?.contentType));
      }
      const raw={users:a.users,clothes:a.clothes,history:a.history,objects:a.objects};
      await putVerified(env.NEW_IMAGES,root+'/source-snapshot.json',enc.encode(JSON.stringify(raw)));
      const chunks=[enc.encode(JSON.stringify({...data,images:undefined}).slice(0,-1)+',"images":[')];
      const images=[];
      for(const [i,ref] of data.images.entries()) {
        const image=await env.OLD_IMAGES.get(ref.key);
        if(!image || image.size>5*1024*1024) throw new Error('Missing or oversized image');
        const type=image.httpMetadata?.contentType;
        if(!['image/png','image/jpeg','image/webp'].includes(type)) throw new Error('Unsupported image type');
        const bytes=await image.arrayBuffer();
        const copiedImage=await putVerified(env.NEW_IMAGES,'users/'+uid+'/legacy-images/'+ref.id,bytes,type);
        images.push({id:ref.id,source:ref.key,...copiedImage});
        // Buffer is available under nodejs_compat. Encode one image at a time.
        chunks.push(enc.encode((i?',':'')+JSON.stringify({id:ref.id,type,data:Buffer.from(bytes).toString('base64')})));
      }
      chunks.push(enc.encode(']}'));
      const bytes=new Uint8Array(chunks.reduce((n,c)=>n+c.byteLength,0));let offset=0;for(const c of chunks){bytes.set(c,offset);offset+=c.length;}
      if(bytes.byteLength>32*1024*1024) throw new Error('Backup exceeds 32MiB');
      const backup=await putVerified(env.NEW_IMAGES,root+'/backup.json',bytes);
      const report={source:a.summary,target:{uid,email:target,clothes:data.clothing.length,wears:data.wears.length,images:images.length},backup,images,unreferenced:copied,sourceRetained:true};
      await putVerified(env.NEW_IMAGES,root+'/report.json',enc.encode(JSON.stringify(report)));
      return Response.json(report);
    }
    const report=await (await env.NEW_IMAGES.get(root+'/report.json')).json();
    if(report.target.uid!==uid) throw new Error('UID mismatch');
    const backup=await env.NEW_IMAGES.get(report.backup.key);
    if(!backup) throw new Error('Backup missing');
    const backupBytes=await backup.arrayBuffer();
    if(await hash(backupBytes)!==report.backup.sha256) throw new Error('Backup checksum mismatch');
    const activeKey='users/'+uid+'/legacy-backup.json';
    if(mode==='/commit') {
      // A local full parseBackup validation is required before this operator-only step.
      if(request.headers.get('X-Validated-SHA256')!==report.backup.sha256) throw new Error('Validation digest required');
      const existing=await env.NEW_DB.prepare('SELECT object_key FROM firebase_backups WHERE uid=?').bind(uid).first();
      if(existing && existing.object_key!==activeKey) throw new Error('Refuse replacing existing backup');
      await putVerified(env.NEW_IMAGES,activeKey,backupBytes);
      await env.NEW_DB.batch([
        env.NEW_DB.prepare('INSERT OR IGNORE INTO legacy_imports(id,source_email,approved_email,uid,object_key,sha256,bytes,clothes,wears,images,created_at,claimed_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)').bind(root,source,target,uid,activeKey,report.backup.sha256,report.backup.bytes,report.target.clothes,report.target.wears,report.target.images,now,now),
        env.NEW_DB.prepare('INSERT OR IGNORE INTO firebase_backups(uid,object_key,revision,bytes,updated_at) VALUES(?,?,?,?,?)').bind(uid,activeKey,1,report.backup.bytes,now)
      ]);
    }
    const active=await env.NEW_DB.prepare('SELECT uid,object_key,revision,bytes FROM firebase_backups WHERE uid=?').bind(uid).first();
    if(!active || active.object_key!==activeKey || active.bytes!==report.backup.bytes) throw new Error('Destination mismatch');
    const activeObject=await env.NEW_IMAGES.get(activeKey);
    if(!activeObject || await hash(await activeObject.arrayBuffer())!==report.backup.sha256) throw new Error('Active backup checksum mismatch');
    const after=await audit(env);
    const rawAfter=enc.encode(JSON.stringify({users:after.users,clothes:after.clothes,history:after.history,objects:after.objects}));
    const saved=await env.NEW_IMAGES.get(root+'/source-snapshot.json');
    if(!saved || await hash(await saved.arrayBuffer())!==await hash(rawAfter)) throw new Error('Source content changed');
    if(JSON.stringify(after.summary)!==JSON.stringify(a.summary)) throw new Error('Source changed');
    return Response.json({source:after.summary,target:report.target,active,sha256:report.backup.sha256,sourceRetained:true});
  } catch(e) {return Response.json({error:e.message},{status:500});}
}};
