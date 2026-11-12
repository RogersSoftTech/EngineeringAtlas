import { Component, signal } from '@angular/core';
import { MarkdownComponent } from './markdown.component';
@Component({selector:'atlas-storage-lab',imports:[MarkdownComponent],template:`
  <div class="intro"><div class="tag">LEARN FROM YOUR OWN APPLICATION</div><h1>Azure storage lab.</h1><p>Follow a saved note from this browser to private Azure storage.</p></div>
  <div class="diagram" role="img" aria-label="Browser to Azure sign-in to .NET 10 API to private Blob Storage"><div class="node">Angular<br>Device cache</div><span>→</span><div class="node">Azure Static Web Apps<br>GitHub identity</div><span>→</span><div class="node">.NET 10 Functions<br>Validation & ownership</div><span>→</span><div class="node">Private Blob Storage<br>Conditional writes</div></div>
  <article class="panel">@if(markdown()){<atlas-markdown [markdown]="markdown()"/>}@else{<p role="status">{{error()||'Loading the storage lab…'}}</p>}</article>
`})
export class StorageLabComponent {
  readonly markdown=signal('');readonly error=signal('');
  constructor(){void fetch(new URL('azure-storage-lab.md',document.baseURI)).then(async r=>{if(!r.ok)throw Error();this.markdown.set(await r.text());}).catch(()=>this.error.set('Unable to load the lab. Please refresh.'));}
}
