import {it,expect,vi,afterEach} from 'vitest';
vi.mock('../functions/_lib.js',async importOriginal=>({...await importOriginal(),account:vi.fn()}));
import {account} from '../functions/_lib.js';
import {onRequestGet,onRequestPut} from '../functions/api/backup.js';
import {validateBackup} from '../functions/_backup.js';
afterEach(()=>vi.clearAllMocks());
it('reads only the signed-in UID even if a different UID is supplied in query and headers',async()=>{
 vi.mocked(account).mockResolvedValue({id:'alice',email:'alice@example.com'});
 const bindings=[];const get=vi.fn(async()=>({body:'{"version":1}'}));
 const env={DB:{prepare:vi.fn(sql=>({bind:(...args)=>{bindings.push({sql,args});return {first:async()=>({object_key:'users/alice/backup.json',revision:1})};}}))},BACKUPS:{get}};
 const r=await onRequestGet({request:new Request('https://clozy.pages.dev/api/backup?uid=bob',{headers:{'X-User-ID':'bob'}}),env});
 expect(r.status).toBe(200);expect(bindings[0].args).toEqual(['alice']);expect(get).toHaveBeenCalledWith('users/alice/backup.json');
});
it('writes a UID-specific object and rejects a stale revision before writing',async()=>{
 vi.mocked(account).mockResolvedValue({id:'alice',email:'alice@example.com'});
 const put=vi.fn(),calls=[];
 const env={DB:{prepare:sql=>({bind:(...args)=>{calls.push({sql,args});return {first:async()=>null,run:async()=>({meta:{changes:1}})};}})},BACKUPS:{put,delete:vi.fn()}};
 const make=revision=>new Request('https://clozy.pages.dev/api/backup?uid=bob',{method:'PUT',headers:{Origin:'https://clozy.pages.dev','Content-Type':'application/json','If-Match':revision},body:JSON.stringify({version:1,clothing:[],wears:[],images:[]})});
 expect((await onRequestPut({request:make('1'),env})).status).toBe(409);expect(put).not.toHaveBeenCalled();
 expect((await onRequestPut({request:make('0'),env})).status).toBe(200);
 expect(put.mock.calls[0][0]).toMatch(/^users\/alice\//);expect(calls.at(-1).args[0]).toBe('alice');
});
it('validates image and history references on the server',()=>{
 expect(()=>validateBackup({version:1,clothing:[],wears:[],images:[{id:'foreign',type:'image/png',data:''}]})).toThrow();
 expect(()=>validateBackup({version:1,clothing:[],wears:[{id:'bad'}],images:[]})).toThrow();
});
