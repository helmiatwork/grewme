import { SkillCategoryEnum } from '../graphql/generated/graphql';

export const SKILL_COLORS: Record<string, string> = {
  Reading: '#4CAF50',
  Math: '#2196F3',
  Writing: '#FF9800',
  Logic: '#9C27B0',
  Social: '#F44336',
};

export const SKILL_KEYS = [
  'reading',
  'math',
  'writing',
  'logic',
  'social',
] as const;

export const SKILL_OPTIONS: {
  value: SkillCategoryEnum;
  label: string;
  color: string;
}[] = [
  { value: SkillCategoryEnum.Reading, label: 'Reading', color: '#4CAF50' },
  { value: SkillCategoryEnum.Math, label: 'Math', color: '#2196F3' },
  { value: SkillCategoryEnum.Writing, label: 'Writing', color: '#FF9800' },
  { value: SkillCategoryEnum.Logic, label: 'Logic', color: '#9C27B0' },
  { value: SkillCategoryEnum.Social, label: 'Social', color: '#F44336' },
];

export function skillLabel(key: string): string {
  return key.charAt(0).toUpperCase() + key.slice(1);
}
