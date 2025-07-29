import {
  Button,
  ButtonGroup,
  Card,
  Divider,
  H2,
} from '@blueprintjs/core';
import type { FC } from 'react';
import { useEffect, useRef, useState } from 'react';

import { TIME_OPTIONS } from '../constants';

interface Props {
  towelCount: 1 | 2 | 3 | null;
  setTowelCount: (v: 1 | 2 | 3) => void;
  timeIdx: 0 | 1 | 2 | 3 | null;
  setTimeIdx: (v: 0 | 1 | 2 | 3) => void;
  onProceed: (isValidInitial: boolean) => void;
}

export const InitialStep: FC<Props> = ({
  towelCount,
  setTowelCount,
  timeIdx,
  setTimeIdx,
  onProceed,
}) => {
  const [focusedIndex, setFocusedIndex] = useState(1); // Start on "2 towels" button
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Total focusable items: 3 towel buttons + 4 time buttons + 1 continue button = 8
  const totalItems = 8;

  const validInitialCombination = () => {
    // Index 3 ('<19s or >1m 32s') is always invalid (automatic C grade)
    if (timeIdx === 3) return false;
    if (towelCount === 1 && timeIdx === 0) return true;
    if (towelCount === 2 && timeIdx === 1) return true;
    if (towelCount === 3 && timeIdx === 2) return true;
    return false;
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    switch (e.code) {
      case 'ArrowUp':
      case 'KeyW':
        e.preventDefault();
        if (focusedIndex >= 3) {
          // Move from time buttons to towel buttons
          setFocusedIndex(Math.min(focusedIndex - 3, 2));
        }
        break;
      case 'ArrowDown':
      case 'KeyS':
        e.preventDefault();
        if (focusedIndex < 3) {
          // Move from towel buttons to time buttons
          setFocusedIndex(focusedIndex + 3);
        } else if (focusedIndex < 7) {
          // Move from time buttons to continue button
          setFocusedIndex(7);
        }
        break;
      case 'ArrowLeft':
      case 'KeyA':
        e.preventDefault();
        if (focusedIndex > 0 && focusedIndex !== 7) {
          setFocusedIndex(focusedIndex - 1);
        }
        break;
      case 'ArrowRight':
      case 'KeyD':
        e.preventDefault();
        if (focusedIndex < totalItems - 2) { // Don't go past last time button
          setFocusedIndex(focusedIndex + 1);
        }
        break;
      case 'Space':
        e.preventDefault();
        if (focusedIndex < 3) {
          // Towel buttons
          setTowelCount((focusedIndex + 1) as 1 | 2 | 3);
        } else if (focusedIndex < 7) {
          // Time buttons
          setTimeIdx((focusedIndex - 3) as 0 | 1 | 2 | 3);
        } else {
          // Continue button
          if (towelCount !== null && timeIdx !== null) {
            onProceed(validInitialCombination());
          }
        }
        break;
      case 'Enter':
        e.preventDefault();
        if (towelCount !== null && timeIdx !== null) {
          onProceed(validInitialCombination());
        }
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
  }, [focusedIndex, towelCount, timeIdx]);

  const getFocusStyle = (index: number) => ({
    outline: focusedIndex === index ? '2px solid #17A2B8' : '',
    outlineOffset: '2px'
  });

  return (
    <div ref={containerRef} style={{ outline: 'none' }}>
      <Card interactive={false}>
        <H2>How many towels are folded in the episode?</H2>
        <ButtonGroup minimal large>
          {[1, 2, 3].map((n, index) => (
            <Button
              key={n}
              intent={towelCount === n ? 'primary' : 'none'}
              onClick={() => {
                setTowelCount(n as 1 | 2 | 3);
                setFocusedIndex(index);
              }}
              style={getFocusStyle(index)}
            >
              {n} towel{n > 1 ? 's' : ''}
            </Button>
          ))}
        </ButtonGroup>

        <Divider style={{ margin: '1rem 0' }} />

        <H2>How long was the episode?</H2>
        <ButtonGroup minimal large>
          {TIME_OPTIONS.slice(0, 3).map((label, idx) => (
            <Button
              key={label}
              intent={timeIdx === idx ? 'primary' : 'none'}
              onClick={() => {
                setTimeIdx(idx as 0 | 1 | 2 | 3);
                setFocusedIndex(idx + 3);
              }}
              style={getFocusStyle(idx + 3)}
            >
              {label}
            </Button>
          ))}
        </ButtonGroup>
        <div style={{ marginTop: '0.5rem' }}>
          <Button
            key={TIME_OPTIONS[3]}
            intent={timeIdx === 3 ? 'primary' : 'none'}
            onClick={() => {
              setTimeIdx(3);
              setFocusedIndex(6);
            }}
            style={{
              ...getFocusStyle(6),
              backgroundColor: 'transparent',
              color: timeIdx === 3 ? undefined : '#888',
              border: 'none',
              boxShadow: 'none'
            }}
            minimal
            large
          >
            {TIME_OPTIONS[3]}
          </Button>
        </div>

        <Divider style={{ margin: '1rem 0' }} />

        <Button
          disabled={towelCount === null || timeIdx === null}
          onClick={() => {
            setFocusedIndex(7);
            onProceed(validInitialCombination());
          }}
          style={{
            backgroundColor: '#17A2B8',
            color: 'white',
            border: 'none',
            ...getFocusStyle(7)
          }}
        >
          Continue
        </Button>
      </Card>
    </div>
  );
};

