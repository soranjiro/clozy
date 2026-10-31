import {it,expect} from 'vitest';
import {convert} from './convert.mjs';
const row={id:1,userID:'old@example.com',name:'シャツ',category:'トップス',imageKey:'old@example.com/photo.png'};
const wear={id:1,email:row.userID,clothesID:1,date:'2025-01-01'};
const now='2026-11-01T00:00:00.000Z';
it('preserves clothing, image and history references with deterministic IDs',async()=>{
 const a=await convert([row],[wear],row.userID,now),b=await convert([row],[wear],row.userID,now);
 expect(a).toEqual(b); expect(a.images[0].id).toBe(a.clothing[0].imageId); expect(a.wears[0].clothingId).toBe(a.clothing[0].id);
});
it('refuses cross-owner rows, cross-owner images and broken history',async()=>{
 await expect(convert([row],[],'stranger',now)).rejects.toThrow();
 await expect(convert([{...row,imageKey:'stranger/photo.png'}],[],row.userID,now)).rejects.toThrow();
 await expect(convert([row],[{...wear,clothesID:2}],row.userID,now)).rejects.toThrow();
 await expect(convert([row],[wear,wear],row.userID,now)).rejects.toThrow();
});
