// Local operator runner. The secret stays in a mode-0600 file, never in command arguments.
import fs from 'node:fs';
import { createHash } from 'node:crypto';
const mode=process.argv[2];
if(!['audit','prepare','download','commit','verify'].includes(mode)) throw new Error('Invalid mode');
const secret=fs.readFileSync('/private/tmp/clozy-migration-secret','utf8').trim();
const headers={Authorization:'Bearer '+secret};
if(mode==='commit') headers['X-Validated-SHA256']=fs.readFileSync('/private/tmp/clozy-migration-validated','utf8').trim();
const r=await fetch('https://clozy-migration-20261101.soranjiro.workers.dev/'+mode,{method:['audit','download'].includes(mode)?'GET':'POST',headers});
if(!r.ok) throw new Error(await r.text());
if(mode==='download') {
 const bytes=Buffer.from(await r.arrayBuffer());
 fs.writeFileSync('/private/tmp/clozy-migration-backup.json',bytes,{mode:0o600});
 console.log(JSON.stringify({bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex')}));
} else {
 const result=await r.json();
 fs.writeFileSync('/private/tmp/clozy-migration-'+mode+'.json',JSON.stringify(result,null,2),{mode:0o600});
 console.log(JSON.stringify({source:result.source||result,target:result.target,backup:result.backup,sha256:result.sha256,sourceRetained:result.sourceRetained}));
}
