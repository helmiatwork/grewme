import type { SkillCategory } from '$lib/api/types';

export const SKILL_CATEGORIES: SkillCategory[] = ['READING', 'MATH', 'WRITING', 'LOGIC', 'SOCIAL'];

export const SKILL_LABELS: Record<SkillCategory, string> = {
  READING: 'Reading',
  MATH: 'Math',
  WRITING: 'Writing',
  LOGIC: 'Logic',
  SOCIAL: 'Social'
};

export const SKILL_COLORS: Record<SkillCategory, string> = {
  READING: '#10B981',
  MATH: '#F59E0B',
  WRITING: '#8B5CF6',
  LOGIC: '#06B6D4',
  SOCIAL: '#F43F5E'
};

export const SKILL_BG_COLORS: Record<SkillCategory, string> = {
  READING: 'bg-emerald-100 text-emerald-700',
  MATH: 'bg-amber-100 text-amber-700',
  WRITING: 'bg-violet-100 text-violet-700',
  LOGIC: 'bg-cyan-100 text-cyan-700',
  SOCIAL: 'bg-rose-100 text-rose-700'
};

export const SKILL_EMOJIS: Record<SkillCategory, string> = {
  READING: '📖',
  MATH: '🔢',
  WRITING: '✏️',
  LOGIC: '🧩',
  SOCIAL: '🤝'
};
