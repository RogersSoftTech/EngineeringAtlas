import { afterEach,describe,expect,it,vi } from 'vitest';
import { CloudApiService } from './cloud-api.service';
describe('cloud transport boundary',()=>{
  afterEach(()=>vi.unstubAllGlobals());
  it('sends same-origin credentials and conditional writes, never storage credentials',async()=>{
    const fetcher=vi.fn().mockResolvedValue(new Response(JSON.stringify({owner:'alice',etag:'v2'}),{headers:{'content-type':'application/json'}}));vi.stubGlobal('fetch',fetcher);const api=new CloudApiService();api.identity.set({owner:'alice',displayName:'Alice',storage:'azure-blob'});await api.saveProgress({version:1,mode:'learning',records:{},last:null},'v1');expect(fetcher.mock.calls[0][1]).toMatchObject({credentials:'same-origin',headers:{'X-Atlas-Owner':'alice','If-Match':'v1'}});expect(JSON.stringify(fetcher.mock.calls)).not.toContain('AccountKey');
  });
  it('rejects a response for a different signed-in account',async()=>{
    vi.stubGlobal('fetch',vi.fn().mockResolvedValue(new Response(JSON.stringify({owner:'bob',state:null,etag:null}),{headers:{'content-type':'application/json'}})));const api=new CloudApiService();api.identity.set({owner:'alice',displayName:'Alice',storage:'azure-blob'});await expect(api.progress()).rejects.toMatchObject({code:'SESSION_CHANGED'});
  });
});
