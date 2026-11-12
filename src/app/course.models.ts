export interface CourseSummary {
  id: string; title: string; topic: string; track: 'quick' | 'deep';
  category: 'technical' | 'leadership'; roadmapIds: string[]; sourceUrl: string;
  partial: boolean; messageCount: number;
}
export interface CourseMessage { id: string; markdown: string; truncated: boolean; }
export interface CourseDocument { id: string; messages: CourseMessage[]; }
export interface CourseChapter { id: string; title: string; markdown: string; }
export interface CourseLocation { courseId: string; chapterId: string; }
