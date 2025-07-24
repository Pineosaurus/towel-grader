// Centralised constants used by the application.

import type { Difficulty, Grade } from './types';

export const TIME_OPTIONS = [
  '19 – 30 sec',
  '38 sec – 1 min 1 sec', 
  '57 sec – 1 min 32 sec',
] as const;

export const GRADE_TAGS: Record<Grade, string[]> = {
  A: ['zero or one minor cosmetic flaw in final fold'],
  B: [
    'rolled edge',
    'unfolded or flipped corner',
    'misaligned edge (> 1 inch)',
    'partial unfold during place',
    'other cosmetic issue in final fold',
    'inaccurate placement',
  ],
  C: [
    'failure to fold or place',
    'chaotic or uncertain movements',
    'inefficient path to fold',
    'complicated in-hand manipulation',
    'hand holding towel out of view',
  ],
};

export const DIFFICULTY_TAGS: Record<Difficulty, string[]> = {
  Hard: [
    'messy initial grab',
    'double grab/pinch',
    'dropped corner',
    'multiple tries for one motion',
    'more than 6 sec from grab to pre-fold layout',
  ],
  Easy: ['all motions logical and efficient'],
};

