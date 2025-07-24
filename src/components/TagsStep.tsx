import { Checkbox, Button, H3 } from '@blueprintjs/core';
import { useForm } from 'react-hook-form';
import type { FC } from 'react';

import { GRADE_TAGS } from '../constants';
import { computeGrade } from '../utils';
import type { Grade } from '../types';

interface Props {
  towelCount: number;
  onComplete: (grade: Grade) => void;
}

export const TagsStep: FC<Props> = ({ towelCount, onComplete }) => {
  const { register, handleSubmit, watch } = useForm();
  const watchedValues = watch();


  const tagEntries: { label: string; grade: Grade }[] = [
    ...GRADE_TAGS.A.map((l) => ({ label: l, grade: 'A' as Grade })),
    ...GRADE_TAGS.B.map((l) => ({ label: l, grade: 'B' as Grade })),
    ...GRADE_TAGS.C.map((l) => ({ label: l, grade: 'C' as Grade })),
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
    onComplete(computeGrade(selections));
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
      <H3>Select quality factors for each towel</H3>
      <div style={{ display: 'flex', gap: '2rem' }}>
        {Array.from({ length: towelCount }).map((_, towelIdx) => (
          <div key={towelIdx}>
            <H3>Towel {towelIdx + 1}</H3>
            {tagEntries.map(({ label, grade }) => (
              <div key={label} style={{ 
                marginBottom: '8px',
                display: 'flex',
                alignItems: 'center'
              }}>
                <Checkbox
                  {...register(`${towelIdx}__${label}`)}
                  large
                />
                <span style={{
                  color: grade === 'A' ? '#0F9960' : grade === 'B' ? '#D9822B' : '#DB3737',
                  marginLeft: '8px',
                  fontWeight: 'bold'
                }}>
                  {label}
                </span>
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

