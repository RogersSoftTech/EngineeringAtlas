export type Mode = 'learning' | 'interview';
export interface LearningModule { id: string; title: string; content: string; example: string; exercise: string; question: string; rubric: string; minutes: number; }
export interface Topic { id: string; name: string; category: 'technical' | 'leadership'; icon: string; description: string; modules: LearningModule[]; }
export interface ModuleWithTopic extends LearningModule { topic: Topic; }
export interface Progress { started?: boolean; done?: boolean; notes?: string; work?: string; takeaway?: string; confidence?: number; updated?: number; }
export interface AtlasState { version: 1; mode: Mode; records: Record<string, Progress>; last: string | null; }
