import { useState } from 'react';
import {
  Button,
  Drawer,
  Tag,
} from '@blueprintjs/core';

import type { Difficulty, Grade } from './types';

import { InitialStep } from './components/InitialStep';
import { TagsStep } from './components/TagsStep';
import { DifficultyStep } from './components/DifficultyStep';
import { ResultView } from './components/ResultView';

// ---------------- main component ----------------

export default function App() {
  const [step, setStep] = useState<0 | 1 | 2 | 3>(0);

  const [towelCount, setTowelCount] = useState<1 | 2 | 3 | null>(null);
  const [timeIdx, setTimeIdx] = useState<0 | 1 | 2 | null>(null);

  // we no longer keep the intermediate checkbox selections in component state – we
  // only need the final computed grade & difficulty, which are stored below.

  const [resultGrade, setResultGrade] = useState<Grade>('C');
  const [resultDifficulty, setResultDifficulty] = useState<Difficulty>('Easy');

  const [history, setHistory] = useState<{ grade: Grade; difficulty: Difficulty }[]>(
    []
  );

  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const resetAll = () => {
    setStep(0);
    setTowelCount(null);
    setTimeIdx(null);
    // nothing else to reset because we only track final results
  };

  const gradeTagColors: Record<Grade, 'success' | 'warning' | 'danger'> = {
    A: 'success',
    B: 'warning',
    C: 'danger',
  };

  const handleInitialStep = (isValid: boolean) => {
    if (isValid) {
      setStep(1);
    } else {
      // Invalid combinations get automatic C grade and skip to results
      setResultGrade('C');
      setHistory((h) => [...h, { grade: 'C', difficulty: 'Easy' }]);
      setStep(3);
    }
  };

  const handleTagsComplete = (grade: Grade) => {
    setResultGrade(grade);
    if (grade === 'C') {
      // C grade skips difficulty step and goes straight to results
      setHistory((h) => [...h, { grade, difficulty: 'Easy' }]);
      setStep(3);
    } else {
      // A and B grades proceed to difficulty step
      setStep(2);
    }
  };

  const handleDifficultyComplete = (difficulty: Difficulty) => {
    setResultDifficulty(difficulty);
    setHistory((h) => [...h, { grade: resultGrade, difficulty }]);
    setStep(3);
  };

  return (
    <div className="bp6-dark" style={{ minHeight: '100vh', padding: '2rem' }}>
      {/* History button */}
      <div style={{ position: 'absolute', top: 10, right: 10 }}>
        <Button minimal icon="list" onClick={() => setIsHistoryOpen(true)}>
          History
        </Button>
      </div>

      {step === 0 && (
        <InitialStep
          towelCount={towelCount}
          setTowelCount={setTowelCount}
          timeIdx={timeIdx}
          setTimeIdx={setTimeIdx}
          onProceed={handleInitialStep}
        />
      )}
      {step === 1 && (
        <TagsStep
          towelCount={towelCount ?? 1}
          onComplete={handleTagsComplete}
        />
      )}
      {step === 2 && (
        <DifficultyStep
          towelCount={towelCount ?? 1}
          onComplete={handleDifficultyComplete}
        />
      )}
      {step === 3 && (
        <ResultView
          grade={resultGrade}
          difficulty={resultDifficulty}
          onReset={resetAll}
        />
      )}

      <Drawer
        title="History"
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        position="right"
      >
        <div style={{ padding: '1rem' }}>
          {history.length === 0 ? (
            <p>No history yet.</p>
          ) : (
            history.map((entry, idx) => (
              <p key={idx} style={{ margin: '0.5rem 0' }}>
                <Tag intent={gradeTagColors[entry.grade]} style={{ marginRight: '0.5rem' }}>
                  {entry.grade}
                </Tag>
                {entry.grade !== 'C' && (
                  <Tag
                    intent={entry.difficulty === 'Hard' ? 'danger' : 'primary'}
                  >
                    {entry.difficulty}
                  </Tag>
                )}
              </p>
            ))
          )}
        </div>
      </Drawer>
    </div>
  );
}
