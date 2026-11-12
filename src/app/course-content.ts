import { CourseChapter, CourseDocument, CourseMessage } from './course.models';
import { courseCatalog } from './course-catalog';

// Split only outside code fences; preserve the source prose rather than rewriting it.
export function courseChapters(document: CourseDocument): CourseChapter[] {
  const result: CourseChapter[] = [];
  const ids = new Map<string, number>();
  for (const message of document.messages) {
    let title = result.length ? 'Continued course notes' : 'Course overview';
    let lines: string[] = [];
    let fence = '';
    const flush = () => {
      if (!lines.join('\n').trim()) return;
      const base = title.toLowerCase().replace(/&amp;/g,'and').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,110) || 'section';
      const count = (ids.get(base) ?? 0) + 1; ids.set(base, count);
      result.push({ id: base + (count > 1 ? '-' + count : ''), title: title.replace(/&amp;/g,'&').replace(/\\([.:])/g,'$1'), markdown: lines.join('\n') });
    };
    for (const line of message.markdown.split('\n')) {
      const marker = line.match(/^\s*(`{3,}|~{3,})/);
      if (marker) {
        if (!fence) fence = marker[1][0]; else if (marker[1][0] === fence) fence = '';
      }
      const heading = !fence && line.match(/^#{1,2}\s+(.+)$/);
      if (heading && /\b(?:Module|Part)\s+\d+/i.test(heading[1])) {
        flush(); lines = []; title = heading[1].replace(/\*\*/g,'');
      }
      lines.push(line);
    }
    flush();
  }
  return result;
}

export function validateCourseDocument(value: unknown): CourseDocument {
  if (!value || typeof value !== 'object') throw new Error('Invalid course');
  const d = value as CourseDocument;
  if (!courseCatalog.some(c => c.id === d.id) || !Array.isArray(d.messages) || !d.messages.length) throw new Error('Unrecognized course');
  const messages = d.messages.map(m => {
    if (!m || typeof m.id !== 'string' || typeof m.markdown !== 'string' || !m.markdown.trim()) throw new Error('Invalid course message');
    return { id: m.id, markdown: m.markdown, truncated: !!m.truncated };
  });
  return { id: d.id, messages };
}

export function parseCourseExport(value: unknown): CourseDocument[] {
  // Also accept a single Atlas course document for a small, targeted replacement.
  if (value && !Array.isArray(value) && typeof value === 'object' && 'messages' in value) return [validateCourseDocument(value)];
  if (!Array.isArray(value)) throw new Error('Choose conversations.json from your ChatGPT export');
  const docs: CourseDocument[] = [];
  for (const raw of value) {
    if (!raw || typeof raw !== 'object') continue;
    const entry = courseCatalog.find(c => c.id === (raw.id ?? raw.conversation_id)) ?? courseCatalog.find(c => c.title === raw.title);
    if (!entry || !raw.mapping || typeof raw.mapping !== 'object') continue;
    const nodes = raw.mapping as Record<string, any>;
    let selected: any[] = [];
    if (raw.current_node && nodes[raw.current_node]) {
      let cursor: string | null = raw.current_node; const visited = new Set<string>();
      while (cursor && nodes[cursor] && !visited.has(cursor)) { visited.add(cursor); const node: any=nodes[cursor]; selected.unshift(node); cursor=node.parent; }
    } else selected = Object.values(nodes).sort((a,b) => (a.message?.create_time ?? 0) - (b.message?.create_time ?? 0));
    const messages: CourseMessage[] = selected.map(n => n.message).filter(m => m?.author?.role === 'assistant' && m.content?.content_type === 'text' && Array.isArray(m.content.parts) && !m.metadata?.is_visually_hidden_from_conversation)
      .map(m => ({ id: String(m.id), markdown: (m.content.parts as unknown[]).filter(p => typeof p === 'string').join('\n\n'), truncated: false })).filter(m => m.markdown.trim());
    if (messages.length) docs.push(validateCourseDocument({ id: entry.id, messages }));
  }
  if (!docs.length) throw new Error('No matching Deep Dive or Quick Course chats were found');
  return docs;
}
