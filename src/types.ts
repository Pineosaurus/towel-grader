// Shared TypeScript types used across components

export type Grade = 'A' | 'B' | 'C';

export type Difficulty = 'Easy' | 'Hard';

export interface GradingEntry {
  type: 'grading';
  grade: Grade;
  difficulty: Difficulty;
  timestamp: Date;
  selectedGradeTags?: string[];
  selectedDifficultyTags?: string[];
}

export interface CountEntry {
  type: 'count';
  count: number;
  timestamp: Date;
}

export type HistoryEntry = GradingEntry | CountEntry;

