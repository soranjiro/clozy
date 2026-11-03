import fs from 'node:fs';
import { createHash } from 'node:crypto';
import { parseBackup } from '../../packages/application/src/index.ts';
const bytes=fs.readFileSync('/private/tmp/clozy-migration-backup.json');
const report=JSON.parse(fs.readFileSync('/private/tmp/clozy-migration-prepare.json'));
const sha256=createHash('sha256').update(bytes).digest('hex');
if(sha256!==report.backup.sha256) throw new Error('Backup checksum mismatch');
const {snapshot,images}=parseBackup(JSON.parse(bytes));
if(snapshot.clothing.length!==report.target.clothes||snapshot.wears.length!==report.target.wears||images.length!==report.target.images) throw new Error('Count mismatch');
for(const image of images) {
 const expected=report.images.find(i=>i.id===image.id);
 if(!expected || createHash('sha256').update(Buffer.from(await image.blob.arrayBuffer())).digest('hex')!==expected.sha256) throw new Error('Image checksum mismatch');
}
fs.writeFileSync('/private/tmp/clozy-migration-validated',sha256,{mode:0o600});
console.log(JSON.stringify({valid:true,clothes:snapshot.clothing.length,wears:snapshot.wears.length,images:images.length,sha256,bytes:bytes.length}));
