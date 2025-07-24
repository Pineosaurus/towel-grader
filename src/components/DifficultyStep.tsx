import { Checkbox, Button, H3 } from '@blueprintjs/core';
import { useForm } from 'react-hook-form';
import type { FC } from 'react';

import { DIFFICULTY_TAGS } from '../constants';
import { computeDifficulty } from '../utils';
import type { Difficulty } from '../types';

interface Props {
  towelCount: number;
  onComplete: (difficulty: Difficulty) => void;
}

export const DifficultyStep: FC<Props> = ({ towelCount, onComplete }) => {
  const { register, handleSubmit, watch } = useForm();
  const watchedValues = watch();

  const tagEntries: { label: string; difficulty: Difficulty }[] = [
    ...DIFFICULTY_TAGS.Easy.map((l) => ({ label: l, difficulty: 'Easy' as Difficulty })),
    ...DIFFICULTY_TAGS.Hard.map((l) => ({ label: l, difficulty: 'Hard' as Difficulty })),
  ];

  const onSubmit = () => {
    const values = watch();
    const selections: string[][] = [];
    for (let i = 0; i < towelCount; i++) {
      const arr: string[] = [];
      Object.keys(values).forEach((key) => {
        const [towelIdxStr, label] = key.split('__');
        if (Number(towelIdxStr) === i && values[key]) arr.push(label);
      });
      selections.push(arr);
    }
    onComplete(computeDifficulty(selections));
  };

  const isValid = () => {
    if (!watchedValues) return false;
    
    for (let towelIdx = 0; towelIdx < towelCount; towelIdx++) {
      const hasSelectedTag = Object.keys(watchedValues).some(key => {
        const [towelIdxStr] = key.split('__');
        return Number(towelIdxStr) === towelIdx && watchedValues[key];
      });
      if (!hasSelectedTag) return false;
    }
    return true;
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <H3>Select difficulty factors for each towel</H3>
      <div style={{ display: 'flex', gap: '2rem' }}>
        {Array.from({ length: towelCount }).map((_, towelIdx) => (
          <div key={towelIdx}>
            <H3>Towel {towelIdx + 1}</H3>
            {tagEntries.map(({ label, difficulty }) => (
              <div key={label} style={{ 
                marginBottom: '8px',
                display: 'flex',
                alignItems: 'center'
              }}>
                <Checkbox
                  {...register(`${towelIdx}__${label}`)}
                  large
                  labelElement={
                    <span style={{
                      color: difficulty === 'Hard' ? '#8B5CF6' : '#137CBD',
                      marginLeft: '8px',
                      fontWeight: 'bold'
                    }}>
                      {label}
                    </span>
                  }
                />
              </div>
            ))}
          </div>
        ))}
      </div>
      <Button 
        type="submit" 
        style={{ 
          marginTop: '1rem',
          backgroundColor: '#17A2B8',
          color: 'white',
          border: 'none'
        }}
        disabled={!isValid()}
      >
        Continue
      </Button>
    </form>
  );
};

