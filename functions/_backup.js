import { validateClothing, validateWearEntry } from '../packages/domain/src/index.ts';
export function validateBackup(payload) {
  if(payload?.version!==1||!Array.isArray(payload.clothing)||!Array.isArray(payload.wears)||!Array.isArray(payload.images)||payload.clothing.length>2000||payload.wears.length>20000||payload.images.length>2000) throw new Error('Invalid backup');
  const clothing=payload.clothing.map(validateClothing),wears=payload.wears.map(validateWearEntry);
  const ids=new Set(clothing.map(c=>c.id)),imageIds=new Set(),wearIds=new Set(),pairs=new Set();
  if(ids.size!==clothing.length) throw new Error('Duplicate clothing');
  for(const w of wears) {
    const pair=w.clothingId+'|'+w.date;
    if(!ids.has(w.clothingId)||wearIds.has(w.id)||pairs.has(pair)) throw new Error('Invalid wear reference');
    wearIds.add(w.id);pairs.add(pair);
  }
  for(const i of payload.images) {
    if(!i||!ids.has(i.id)||imageIds.has(i.id)||!['image/png','image/jpeg','image/webp'].includes(i.type)||typeof i.data!=='string'||i.data.length%4!==0||i.data.length>Math.ceil(5*1024*1024/3)*4||!/^[A-Za-z0-9+/]*={0,2}$/.test(i.data)) throw new Error('Invalid image');
    const bytes=i.data.length/4*3-(i.data.endsWith('==')?2:i.data.endsWith('=')?1:0);
    if(bytes>5*1024*1024) throw new Error('Image too large');
    imageIds.add(i.id);
  }
  for(const c of clothing) if((c.imageId!==undefined)!==imageIds.has(c.id)) throw new Error('Invalid image reference');
}
