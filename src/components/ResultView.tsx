import { Button, H2, Tag } from '@blueprintjs/core';
import type { FC } from 'react';

import type { Difficulty, Grade } from '../types';

interface Props {
  grade: Grade;
  difficulty: Difficulty;
  onReset: () => void;
}

export const ResultView: FC<Props> = ({ grade, difficulty, onReset }) => {
  const gradeTagColors: Record<Grade, 'success' | 'warning' | 'danger'> = {
    A: 'success',
    B: 'warning',
    C: 'danger',
  };

  return (
    <div style={{ textAlign: 'center' }}>
      <H2>Class</H2>
      <Tag large intent={gradeTagColors[grade]} style={{ fontSize: '2rem' }}>
        {grade}
      </Tag>

      {grade !== 'C' && (
        <>
          <H2 style={{ marginTop: '2rem' }}>Difficulty</H2>
          <Tag
            large
            intent={difficulty === 'Hard' ? undefined : 'primary'}
            style={{ 
              fontSize: '2rem',
              backgroundColor: difficulty === 'Hard' ? '#8B5CF6' : undefined,
              color: difficulty === 'Hard' ? 'white' : undefined
            }}
          >
            {difficulty}
          </Tag>
        </>
      )}

      <div style={{ marginTop: '2rem' }}>
        <Button 
          onClick={onReset}
          style={{
            backgroundColor: '#17A2B8',
            color: 'white',
            border: 'none'
          }}
        >
          Reset
        </Button>
      </div>
    </div>
  );
};

