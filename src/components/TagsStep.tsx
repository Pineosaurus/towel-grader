import { Checkbox, Button, H3 } from '@blueprintjs/core';
import { useForm } from 'react-hook-form';
import { useEffect, useRef, useState } from 'react';
import type { FC } from 'react';

import { GRADE_TAGS } from '../constants';
import { computeGrade } from '../utils';
import type { Grade } from '../types';

interface Props {
  towelCount: number;
  onComplete: (grade: Grade, selections: Record<string, boolean>) => void;
  onBack: (selections: Record<string, boolean>) => void;
  initialSelections: Record<string, boolean>;
}

export const TagsStep: FC<Props> = ({ towelCount, onComplete, onBack, initialSelections }) => {
  const { register, handleSubmit, watch, setValue } = useForm();
  const watchedValues = watch();
  const [focusedIndex, setFocusedIndex] = useState(1); // Start on first tag option
  const containerRef = useRef<HTMLDivElement>(null);

  // Restore previous selections when component mounts
  useEffect(() => {
    Object.keys(initialSelections).forEach(key => {
      setValue(key, initialSelections[key]);
    });
  }, [initialSelections, setValue]);

  // Handle A-grade exclusive selection
  useEffect(() => {
    if (!watchedValues) return;

    Object.keys(watchedValues).forEach(key => {
      if (watchedValues[key]) {
        const [towelIdxStr, label] = key.split('__');
        const towelIdx = Number(towelIdxStr);
        
        // If an A-grade tag was just selected, deselect all B and C tags for this towel
        if (GRADE_TAGS.A.includes(label)) {
          Object.keys(watchedValues).forEach(otherKey => {
            const [otherTowelIdxStr, otherLabel] = otherKey.split('__');
            if (Number(otherTowelIdxStr) === towelIdx && otherKey !== key) {
              if (GRADE_TAGS.B.includes(otherLabel) || GRADE_TAGS.C.includes(otherLabel)) {
                setValue(otherKey, false);
              }
            }
          });
        }
      }
    });
  }, [watchedValues, setValue]);


  const gradeTagEntries: { label: string; grade: Grade }[] = [
    ...GRADE_TAGS.A.map((l) => ({ label: l, grade: 'A' as Grade })),
    ...GRADE_TAGS.B.map((l) => ({ label: l, grade: 'B' as Grade })),
    ...GRADE_TAGS.C.map((l) => ({ label: l, grade: 'C' as Grade })),
  ];

  // Calculate total focusable items: back button (1) + checkboxes for each towel + continue button (1)
  const totalCheckboxes = gradeTagEntries.length * towelCount;
  const totalItems = 1 + totalCheckboxes + 1; // back + checkboxes + continue

  const handleKeyDown = (e: KeyboardEvent) => {
    switch (e.code) {
      case 'ArrowUp':
      case 'KeyW':
        e.preventDefault();
        if (focusedIndex > 0) {
          if (focusedIndex > 1 && focusedIndex <= totalCheckboxes) {
            // Move up within checkboxes
            const currentTowel = Math.floor((focusedIndex - 1) / gradeTagEntries.length);
            const currentTag = (focusedIndex - 1) % gradeTagEntries.length;
            if (currentTag > 0) {
              setFocusedIndex(focusedIndex - 1);
            }
          }
        }
        break;
      case 'ArrowDown':
      case 'KeyS':
        e.preventDefault();
        if (focusedIndex === 0) {
          // From back button to first checkbox
          setFocusedIndex(1);
        } else if (focusedIndex < totalCheckboxes) {
          // Move down within checkboxes
          const currentTowel = Math.floor((focusedIndex - 1) / gradeTagEntries.length);
          const currentTag = (focusedIndex - 1) % gradeTagEntries.length;
          if (currentTag < gradeTagEntries.length - 1) {
            setFocusedIndex(focusedIndex + 1);
          } else {
            // Move to continue button
            setFocusedIndex(totalItems - 1);
          }
        }
        break;
      case 'ArrowLeft':
      case 'KeyA':
        e.preventDefault();
        if (focusedIndex > 1 && focusedIndex <= totalCheckboxes) {
          // Move left between towels
          const currentTowel = Math.floor((focusedIndex - 1) / gradeTagEntries.length);
          const currentTag = (focusedIndex - 1) % gradeTagEntries.length;
          if (currentTowel > 0) {
            setFocusedIndex(focusedIndex - gradeTagEntries.length);
          }
        }
        break;
      case 'ArrowRight':
      case 'KeyD':
        e.preventDefault();
        if (focusedIndex > 0 && focusedIndex <= totalCheckboxes) {
          // Move right between towels
          const currentTowel = Math.floor((focusedIndex - 1) / gradeTagEntries.length);
          const currentTag = (focusedIndex - 1) % gradeTagEntries.length;
          if (currentTowel < towelCount - 1) {
            setFocusedIndex(focusedIndex + gradeTagEntries.length);
          }
        }
        break;
      case 'Space':
        e.preventDefault();
        if (focusedIndex === 0) {
          // Back button
          onBack(watchedValues || {});
        } else if (focusedIndex > 0 && focusedIndex <= totalCheckboxes) {
          // Toggle checkbox
          const towelIdx = Math.floor((focusedIndex - 1) / gradeTagEntries.length);
          const tagIdx = (focusedIndex - 1) % gradeTagEntries.length;
          const tag = gradeTagEntries[tagIdx];
          const key = `${towelIdx}__${tag.label}`;
          const currentValue = watchedValues?.[key] || false;
          setValue(key, !currentValue);
        } else {
          // Continue button
          if (isValid()) {
            onSubmit();
          }
        }
        break;
      case 'Enter':
        e.preventDefault();
        if (isValid()) {
          onSubmit();
        }
        break;
      case 'Tab':
        e.preventDefault();
        onBack(watchedValues || {});
        break;
    }
  };

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener('keydown', handleKeyDown);
      container.tabIndex = 0;
      container.focus();
    }

    return () => {
      if (container) {
        container.removeEventListener('keydown', handleKeyDown);
      }
    };
  }, [focusedIndex, watchedValues, towelCount]);

  const getFocusStyle = (index: number) => ({
    outline: focusedIndex === index ? '2px solid #17A2B8' : '',
    outlineOffset: '2px'
  });

  const onSubmit = () => {
    const values = watch();
    const gradeSelections: string[][] = [];
    
    for (let i = 0; i < towelCount; i++) {
      const gradeArr: string[] = [];
      
      Object.keys(values).forEach((key) => {
        const [towelIdxStr, label] = key.split('__');
        if (Number(towelIdxStr) === i && values[key]) {
          gradeArr.push(label);
        }
      });
      
      gradeSelections.push(gradeArr);
    }
    
    const grade = computeGrade(gradeSelections);
    onComplete(grade, values || {});
  };

  const hasAGradeForTowel = (towelIdx: number): boolean => {
    if (!watchedValues) return false;
    return Object.keys(watchedValues).some(key => {
      const [towelIdxStr, label] = key.split('__');
      return Number(towelIdxStr) === towelIdx && 
             GRADE_TAGS.A.includes(label) && 
             watchedValues[key];
    });
  };

  const isValid = () => {
    if (!watchedValues) return false;
    
    for (let towelIdx = 0; towelIdx < towelCount; towelIdx++) {
      const hasGradeTag = Object.keys(watchedValues).some(key => {
        const [towelIdxStr] = key.split('__');
        return Number(towelIdxStr) === towelIdx && watchedValues[key];
      });
      
      if (!hasGradeTag) return false;
    }
    return true;
  };

  return (
    <div ref={containerRef} style={{ outline: 'none' }}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
          <Button 
            icon="arrow-left" 
            onClick={() => {
              setFocusedIndex(0);
              onBack(watchedValues || {});
            }}
            style={{ 
              marginRight: '1rem',
              backgroundColor: '#17A2B8',
              color: '#FFFFFF',
              border: 'none',
              fill: '#FFFFFF',
              ...getFocusStyle(0)
            }}
            className="white-icon-button"
          />
          <H3 style={{ margin: 0 }}>Select quality factors for each towel</H3>
        </div>
      <div style={{ display: 'flex', gap: '2rem' }}>
        {Array.from({ length: towelCount }).map((_, towelIdx) => (
          <div key={towelIdx}>
            <H3>Towel {towelIdx + 1}</H3>
            {gradeTagEntries.map(({ label, grade }, tagIdx) => {
              const hasAGrade = hasAGradeForTowel(towelIdx);
              const isDisabled = hasAGrade && grade !== 'A';
              const itemIndex = 1 + (towelIdx * gradeTagEntries.length) + tagIdx;
              
              return (
                <div 
                  key={label} 
                  style={{ 
                    marginBottom: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    opacity: isDisabled ? 0.5 : 1,
                    ...getFocusStyle(itemIndex)
                  }}
                  onClick={() => setFocusedIndex(itemIndex)}
                >
                  <Checkbox
                    {...register(`${towelIdx}__${label}`)}
                    large
                    disabled={isDisabled}
                    labelElement={
                      <span style={{
                        color: isDisabled 
                          ? '#888' 
                          : (grade === 'A' ? '#0F9960' : grade === 'B' ? '#D9822B' : '#DB3737'),
                        marginLeft: '8px',
                        fontWeight: 'bold'
                      }}>
                        {label}
                      </span>
                    }
                  />
                </div>
              );
            })}
          </div>
        ))}
      </div>
        <Button 
          type="submit" 
          onClick={() => setFocusedIndex(totalItems - 1)}
          style={{ 
            marginTop: '1rem',
            backgroundColor: '#17A2B8',
            color: 'white',
            border: 'none',
            ...getFocusStyle(totalItems - 1)
          }}
          disabled={!isValid()}
        >
          Continue
        </Button>
      </form>
    </div>
  );
};

