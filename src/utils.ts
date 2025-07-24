// Helper utility functions that implement grading logic.

import { DIFFICULTY_TAGS, GRADE_TAGS } from './constants';
import type { Difficulty, Grade } from './types';

/**
 * Given selections – an array for each towel, containing the selected tags –
 * compute the overall grade for the episode.
 */
export function computeGrade(selected: string[][]): Grade {
  const flat = selected.flat();

  if (flat.some((tag) => GRADE_TAGS.C.includes(tag))) return 'C';
  if (flat.some((tag) => GRADE_TAGS.B.includes(tag))) return 'B';

  return 'A';
}

/**
 * Compute the overall difficulty for the episode from a list of selections.
 */
export function computeDifficulty(selected: string[][]): Difficulty {
  const flat = selected.flat();

  if (flat.some((tag) => DIFFICULTY_TAGS.Hard.includes(tag))) return 'Hard';

  return 'Easy';
}

