import { Injectable, computed, signal } from '@angular/core';
import { topics } from './curriculum';
import { AtlasState, Mode, ModuleWithTopic, Progress } from './models';
import { courseCatalog } from './course-catalog';

export const STORAGE_KEY = 'engineering-atlas-v1';
export const modules: ModuleWithTopic[] = topics.flatMap(topic => topic.modules.map(module => ({ ...module, topic })));
const emptyState = (): AtlasState => ({ version: 1, mode: 'learning', records: {}, last: null });

export function validateBackup(value: unknown): AtlasState {
  if (!value || typeof value !== 'object') throw new Error('Invalid backup');
  const s = value as Partial<AtlasState>;
  if (s.version !== 1 || !['learning', 'interview'].includes(s.mode ?? '') || !s.records || typeof s.records !== 'object' || Array.isArray(s.records)) throw new Error('Invalid backup');
  const records: Record<string, Progress> = {};
  const keys = new Set(modules.flatMap(m => ['learning:' + m.id, 'interview:' + m.id]));
  for (const [key, v] of Object.entries(s.records)) {
    if (!keys.has(key) || !v || typeof v !== 'object' || Array.isArray(v)) throw new Error('Invalid record');
    for (const field of ['notes', 'work', 'takeaway'] as const) if (v[field] !== undefined && typeof v[field] !== 'string') throw new Error('Invalid text');
    if (v.confidence !== undefined && (!Number.isInteger(v.confidence) || v.confidence < 0 || v.confidence > 5)) throw new Error('Invalid confidence');
    records[key] = { started: !!v.started, done: !!v.done, confidence: v.confidence ?? 0, notes: v.notes ?? '', work: v.work ?? '', takeaway: v.takeaway ?? '', updated: Number(v.updated) || 0 };
  }
  const courseRecords: Record<string, Progress> = {};
  if (s.courseRecords !== undefined) {
    if (!s.courseRecords || typeof s.courseRecords !== 'object' || Array.isArray(s.courseRecords)) throw new Error('Invalid course progress');
    for (const [key,v] of Object.entries(s.courseRecords)) {
      const [courseId,chapterId,extra] = key.split('/');
      if (extra || !courseCatalog.some(c=>c.id===courseId) || !/^[a-z0-9-]{1,140}$/.test(chapterId ?? '') || !v || typeof v !== 'object' || Array.isArray(v)) throw new Error('Invalid course record');
      for (const field of ['notes','work','takeaway'] as const) if (v[field] !== undefined && typeof v[field] !== 'string') throw new Error('Invalid course text');
      if (v.confidence !== undefined && (!Number.isInteger(v.confidence) || v.confidence<0 || v.confidence>5)) throw new Error('Invalid confidence');
      courseRecords[key] = {started:!!v.started,done:!!v.done,notes:v.notes??'',work:v.work??'',takeaway:v.takeaway??'',confidence:v.confidence??0,updated:Number(v.updated)||0};
    }
  }
  const courseLast = s.courseLast && Object.hasOwn(courseRecords,s.courseLast.courseId+'/'+s.courseLast.chapterId) ? s.courseLast : undefined;
  return { version: 1, mode: s.mode as Mode, records, last: modules.some(m => m.id === s.last) ? s.last! : null, courseRecords, courseLast };
}

@Injectable({ providedIn: 'root' })
export class ProgressService {
  private storageKey=STORAGE_KEY;
  onLocalSave?:()=>void;
  readonly state = signal<AtlasState>(emptyState());
  readonly message = signal('');
  readonly storageOK = signal(true);
  readonly mode = computed(() => this.state().mode);
  readonly completed = computed(() => modules.filter(m => this.record(m.id).done));
  readonly started = computed(() => modules.filter(m => this.record(m.id).started && !this.record(m.id).done));
  readonly takeaways = computed(() => modules.filter(m => this.record(m.id).takeaway?.trim()));
  readonly assessed = computed(() => modules.filter(m => (this.record(m.id).confidence ?? 0) > 0));
  readonly strengths = computed(() => this.assessed().filter(m => this.record(m.id).confidence! >= 4));
  readonly gaps = computed(() => this.assessed().filter(m => this.record(m.id).confidence! <= 2));
  readonly recommendations = computed(() => modules.filter(m => !this.record(m.id).done).sort((a, b) => this.score(b) - this.score(a)));
  readonly resume = computed(() => modules.find(m => m.id === this.state().last && !this.record(m.id).done) ?? this.recommendations()[0]);
  readonly courseEntries = computed(() => Object.entries(this.state().courseRecords ?? {}).map(([key,record]) => {
    const [courseId,chapterId] = key.split('/');
    return { course: courseCatalog.find(c=>c.id===courseId)!, chapterId, record };
  }).filter(entry=>entry.course));
  readonly courseResume = computed(() => {
    const last = this.state().courseLast;
    return last && !this.courseRecord(last.courseId,last.chapterId).done ? {...last,course:courseCatalog.find(c=>c.id===last.courseId)} : undefined;
  });

  constructor() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) this.state.set(validateBackup(JSON.parse(raw)));
    } catch {
      this.storageOK.set(false);
      this.message.set('Saved data could not be loaded. Import a valid backup or export your current work.');
    }
  }
  record(id: string, mode = this.mode()): Progress { return this.state().records[mode + ':' + id] ?? {}; }
  topicPercent(id: string): number {
    const t = topics.find(t => t.id === id);
    return t ? Math.round(t.modules.filter(m => this.record(m.id).done).length / t.modules.length * 100) : 0;
  }
  setMode(mode: Mode) { this.state.update(s => ({ ...s, mode })); this.persist(); }
  update(id: string, patch: Partial<Progress>) {
    this.state.update(s => ({ ...s, records: { ...s.records, [s.mode + ':' + id]: { ...this.record(id), ...patch, updated: Date.now() } } }));
    this.persist();
  }
  visit(id: string) {
    if (!this.record(id).started) this.update(id, { started: true });
    this.state.update(s => ({ ...s, last: id }));
    this.persist();
  }
  toggleComplete(id: string) { this.update(id, { done: !this.record(id).done }); }
  courseRecord(courseId: string, chapterId: string): Progress { return this.state().courseRecords?.[courseId+'/'+chapterId] ?? {}; }
  updateCourse(courseId: string, chapterId: string, patch: Partial<Progress>) {
    this.state.update(s=>({...s,courseRecords:{...s.courseRecords,[courseId+'/'+chapterId]:{...this.courseRecord(courseId,chapterId),...patch,updated:Date.now()}},courseLast:{courseId,chapterId}}));
    this.persist();
  }
  exportJson() { return JSON.stringify(this.state(), null, 2); }
  activateCloudScope(owner:string){this.storageKey=STORAGE_KEY+':'+owner;const raw=localStorage.getItem(this.storageKey);this.state.set(raw?validateBackup(JSON.parse(raw)):emptyState());}
  replaceState(state:AtlasState){this.state.set(validateBackup(state));this.persist();}
  legacyState():AtlasState|null{try{const raw=localStorage.getItem(STORAGE_KEY);return raw?validateBackup(JSON.parse(raw)):null;}catch{return null;}}
  importJson(text: string) {
    const backup = validateBackup(JSON.parse(text));
    this.state.update(s => ({ ...s, records: { ...s.records, ...backup.records }, courseRecords:{...s.courseRecords,...backup.courseRecords},courseLast:backup.courseLast??s.courseLast }));
    this.persist();
  }
  private score(m: ModuleWithTopic) {
    const r = this.record(m.id);
    return (r.started ? 100 : 0) + (r.confidence ? 6 - r.confidence : 0) * 10 - m.topic.modules.findIndex(x => x.id === m.id);
  }
  private persist() {
    try { localStorage.setItem(this.storageKey, this.exportJson()); this.storageOK.set(true); this.message.set(this.storageKey===STORAGE_KEY?'Saved in this browser ✓':'Saved on this device · Azure sync pending'); }
    catch { this.storageOK.set(false); this.message.set('Could not save. Export a backup before closing this page.'); }
    this.onLocalSave?.();
  }
}
