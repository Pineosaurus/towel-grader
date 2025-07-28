import { Checkbox, Button, H3 } from '@blueprintjs/core';
import { useForm } from 'react-hook-form';
import { useEffect, useRef, useState } from 'react';
import type { FC } from 'react';

import { DIFFICULTY_TAGS } from '../constants';
import { computeDifficulty } from '../utils';
import type { Difficulty } from '../types';

interface Props {
  towelCount: number;
  onComplete: (difficulty: Difficulty, selections: Record<string, boolean>) => void;
  onBack: (selections: Record<string, boolean>) => void;
  initialSelections: Record<string, boolean>;
}

export const DifficultyStep: FC<Props> = ({ towelCount, onComplete, onBack, initialSelections }) => {
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

  // Handle Easy difficulty exclusive selection
  useEffect(() => {
    if (!watchedValues) return;

    Object.keys(watchedValues).forEach(key => {
      if (watchedValues[key]) {
        const [towelIdxStr, label] = key.split('__');
        const towelIdx = Number(towelIdxStr);
        
        // If an Easy difficulty tag was just selected, deselect all Hard tags for this towel
        if (DIFFICULTY_TAGS.Easy.includes(label)) {
          Object.keys(watchedValues).forEach(otherKey => {
            const [otherTowelIdxStr, otherLabel] = otherKey.split('__');
            if (Number(otherTowelIdxStr) === towelIdx && otherKey !== key) {
              if (DIFFICULTY_TAGS.Hard.includes(otherLabel)) {
                setValue(otherKey, false);
              }
            }
          });
        }
      }
    });
  }, [watchedValues, setValue]);

  const tagEntries: { label: string; difficulty: Difficulty }[] = [
    ...DIFFICULTY_TAGS.Easy.map((l) => ({ label: l, difficulty: 'Easy' as Difficulty })),
    ...DIFFICULTY_TAGS.Hard.map((l) => ({ label: l, difficulty: 'Hard' as Difficulty })),
  ];

  // Calculate total focusable items: back button (1) + checkboxes for each towel + submit button (1)
  const totalCheckboxes = tagEntries.length * towelCount;
  const totalItems = 1 + totalCheckboxes + 1; // back + checkboxes + submit

  const handleKeyDown = (e: KeyboardEvent) => {
    switch (e.code) {
      case 'ArrowUp':
      case 'KeyW':
        e.preventDefault();
        if (focusedIndex > 0) {
          if (focusedIndex > 1 && focusedIndex <= totalCheckboxes) {
            const currentTag = (focusedIndex - 1) % tagEntries.length;
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
          setFocusedIndex(1);
        } else if (focusedIndex < totalCheckboxes) {
          const currentTag = (focusedIndex - 1) % tagEntries.length;
          if (currentTag < tagEntries.length - 1) {
            setFocusedIndex(focusedIndex + 1);
          } else {
            setFocusedIndex(totalItems - 1);
          }
        }
        break;
      case 'ArrowLeft':
      case 'KeyA':
        e.preventDefault();
        if (focusedIndex > 1 && focusedIndex <= totalCheckboxes) {
          const currentTowel = Math.floor((focusedIndex - 1) / tagEntries.length);
          if (currentTowel > 0) {
            setFocusedIndex(focusedIndex - tagEntries.length);
          }
        }
        break;
      case 'ArrowRight':
      case 'KeyD':
        e.preventDefault();
        if (focusedIndex > 0 && focusedIndex <= totalCheckboxes) {
          const currentTowel = Math.floor((focusedIndex - 1) / tagEntries.length);
          if (currentTowel < towelCount - 1) {
            setFocusedIndex(focusedIndex + tagEntries.length);
          }
        }
        break;
      case 'Space':
        e.preventDefault();
        if (focusedIndex === 0) {
          onBack(watchedValues || {});
        } else if (focusedIndex > 0 && focusedIndex <= totalCheckboxes) {
          const towelIdx = Math.floor((focusedIndex - 1) / tagEntries.length);
          const tagIdx = (focusedIndex - 1) % tagEntries.length;
          const tag = tagEntries[tagIdx];
          const key = `${towelIdx}__${tag.label}`;
          const currentValue = watchedValues?.[key] || false;
          setValue(key, !currentValue);
        } else {
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

  const hasEasyDifficultyForTowel = (towelIdx: number): boolean => {
    if (!watchedValues) return false;
    return Object.keys(watchedValues).some(key => {
      const [towelIdxStr, label] = key.split('__');
      return Number(towelIdxStr) === towelIdx && 
             DIFFICULTY_TAGS.Easy.includes(label) && 
             watchedValues[key];
    });
  };

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
    onComplete(computeDifficulty(selections), values || {});
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
          <H3 style={{ margin: 0 }}>Select difficulty factors for each towel</H3>
        </div>
      <div style={{ display: 'flex', gap: '2rem' }}>
        {Array.from({ length: towelCount }).map((_, towelIdx) => (
          <div key={towelIdx}>
            <H3>Towel {towelIdx + 1}</H3>
            {tagEntries.map(({ label, difficulty }, tagIdx) => {
              const hasEasyDifficulty = hasEasyDifficultyForTowel(towelIdx);
              const isDisabled = hasEasyDifficulty && difficulty !== 'Easy';
              const itemIndex = 1 + (towelIdx * tagEntries.length) + tagIdx;
              
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
                          : (difficulty === 'Hard' ? '#8B5CF6' : '#137CBD'),
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
          Submit
        </Button>
      </form>
    </div>
  );
};

