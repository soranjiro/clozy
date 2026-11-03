import { validateClothing, validateWearEntry } from '../../packages/domain/src/index.ts';
export async function legacyId(kind, id) {
  const bytes = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`clozy-legacy:${kind}:${id}`))).slice(0,16);
  bytes[6]=(bytes[6]&15)|80; bytes[8]=(bytes[8]&63)|128;
  const h=[...bytes].map(b=>b.toString(16).padStart(2,'0')).join('');
  return `${h.slice(0,8)}-${h.slice(8,12)}-${h.slice(12,16)}-${h.slice(16,20)}-${h.slice(20)}`;
}
export async function convert(clothes, history, sourceEmail, now) {
  const ids=new Map(), images=[];
  const clothing=[];
  for(const row of clothes) {
    if(row.userID!==sourceEmail || ids.has(row.id)) throw new Error('Invalid clothing owner or duplicate');
    const id=await legacyId('clothes',row.id); ids.set(row.id,id);
    if(row.imageKey) {
      if(!row.imageKey.startsWith(sourceEmail+'/')) throw new Error('Image belongs to another owner');
      images.push({id,key:row.imageKey});
    }
    clothing.push(validateClothing({id,name:row.name,category:row.category,brand:row.brand||'',color:row.color||'',size:row.size||'',notes:'',favorite:false,createdAt:now,updatedAt:now,...(row.imageKey?{imageId:id}:{})}));
  }
  const pairs=new Set(), seen=new Set(), wears=[];
  for(const row of history) {
    const clothingId=ids.get(row.clothesID), pair=clothingId+'|'+row.date;
    if(row.email!==sourceEmail || !clothingId || pairs.has(pair) || seen.has(row.id)) throw new Error('Invalid history owner, reference or duplicate');
    seen.add(row.id);pairs.add(pair);
    wears.push(validateWearEntry({id:await legacyId('wear',row.id),clothingId,date:row.date,createdAt:now}));
  }
  return {version:1,exportedAt:now,clothing,wears,images};
}
