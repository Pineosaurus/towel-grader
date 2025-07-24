import {
  Button,
  ButtonGroup,
  Card,
  Divider,
  H2,
} from '@blueprintjs/core';
import type { FC } from 'react';

import { TIME_OPTIONS } from '../constants';

interface Props {
  towelCount: 1 | 2 | 3 | null;
  setTowelCount: (v: 1 | 2 | 3) => void;
  timeIdx: 0 | 1 | 2 | null;
  setTimeIdx: (v: 0 | 1 | 2) => void;
  onProceed: (isValidInitial: boolean) => void;
}

export const InitialStep: FC<Props> = ({
  towelCount,
  setTowelCount,
  timeIdx,
  setTimeIdx,
  onProceed,
}) => {
  const validInitialCombination = () => {
    if (towelCount === 1 && timeIdx === 0) return true;
    if (towelCount === 2 && timeIdx === 1) return true;
    if (towelCount === 3 && timeIdx === 2) return true;
    return false;
  };

  return (
    <Card interactive={false}>
      <H2>How many towels are folded in the episode?</H2>
      <ButtonGroup minimal large>
        {[1, 2, 3].map((n) => (
          <Button
            key={n}
            intent={towelCount === n ? 'primary' : 'none'}
            onClick={() => setTowelCount(n as 1 | 2 | 3)}
          >
            {n} towel{n > 1 ? 's' : ''}
          </Button>
        ))}
      </ButtonGroup>

      <Divider style={{ margin: '1rem 0' }} />

      <H2>How long was the episode?</H2>
      <ButtonGroup minimal large>
        {TIME_OPTIONS.map((label, idx) => (
          <Button
            key={label}
            intent={timeIdx === idx ? 'primary' : 'none'}
            onClick={() => setTimeIdx(idx as 0 | 1 | 2)}
          >
            {label}
          </Button>
        ))}
      </ButtonGroup>

      <Divider style={{ margin: '1rem 0' }} />

      <Button
        disabled={towelCount === null || timeIdx === null}
        onClick={() => onProceed(validInitialCombination())}
        style={{
          backgroundColor: '#17A2B8',
          color: 'white',
          border: 'none'
        }}
      >
        Continue
      </Button>
    </Card>
  );
};

