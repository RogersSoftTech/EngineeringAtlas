import { Component, computed, input } from '@angular/core';
import { Marked } from 'marked';

// Angular sanitizes this HTML binding. Never bypass that sanitizer for chat content.
const parser = new Marked({ gfm:true, renderer: {
  html: ({text}) => text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'),
  image: () => '<p><em>Source illustration: open the original chat to view.</em></p>'
} });

@Component({ selector:'atlas-markdown', template:'<div class="course-prose" [innerHTML]="html()"></div>' })
export class MarkdownComponent {
  readonly markdown = input.required<string>();
  readonly html = computed(() => parser.parse(cleanSourceMarkdown(this.markdown()),{async:false}));
}

export function cleanSourceMarkdown(markdown: string): string {
  // ChatGPT's display markers are source annotations, not readable lesson text.
  return markdown.replace(/\uE200entity\uE202([\s\S]*?)\uE201/g,(_match,payload:string)=>{
    try { const value=JSON.parse(payload); return typeof value[1]==='string'?value[1]:''; } catch { return ''; }
  }).replace(/\uE200image_group\uE202[\s\S]*?\uE201/g,'\n\n*Source illustration: open the original chat to view.*\n\n')
    .replace(/\uE200(?:cite|navlist|[a-z_]+)\uE202[\s\S]*?\uE201/g,' *(See the original chat for this source reference.)* ');
}
