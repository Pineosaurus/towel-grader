import { useState } from 'react';
import {
  Button,
  Drawer,
  Tag,
} from '@blueprintjs/core';

import type { Difficulty, Grade, HistoryEntry, GradingEntry, CountEntry } from './types';

import { InitialStep } from './components/InitialStep';
import { TagsStep } from './components/TagsStep';
import { DifficultyStep } from './components/DifficultyStep';
import { ResultView } from './components/ResultView';

// ---------------- main component ----------------

export default function App() {
  const [step, setStep] = useState<0 | 1 | 2 | 3>(0);

  const [towelCount, setTowelCount] = useState<1 | 2 | 3 | null>(null);
  const [timeIdx, setTimeIdx] = useState<0 | 1 | 2 | 3 | null>(null);

  // we no longer keep the intermediate checkbox selections in component state – we
  // only need the final computed grade & difficulty, which are stored below.

  const [resultGrade, setResultGrade] = useState<Grade>('C');
  const [resultDifficulty, setResultDifficulty] = useState<Difficulty>('Easy');

  // Form state preservation
  const [gradeSelections, setGradeSelections] = useState<Record<string, boolean>>({});
  const [difficultySelections, setDifficultySelections] = useState<Record<string, boolean>>({});

  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [firstEntryTime, setFirstEntryTime] = useState<Date | null>(null);
  const [lastIntervalCheck, setLastIntervalCheck] = useState<Date | null>(null);

  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const addGradingEntry = (grade: Grade, difficulty: Difficulty) => {
    const now = new Date();
    
    setHistory((prevHistory) => {
      const newGradingEntry: GradingEntry = {
        type: 'grading',
        grade,
        difficulty,
        timestamp: now
      };

      // If this is the first entry, set the first entry time
      if (!firstEntryTime) {
        setFirstEntryTime(now);
        setLastIntervalCheck(now);
        return [newGradingEntry];
      }

      // Check if we need to add a 30-minute interval count entry
      const timeSinceLastCheck = lastIntervalCheck ? now.getTime() - lastIntervalCheck.getTime() : 0;
      const thirtyMinutesInMs = 30 * 60 * 1000;

      let updatedHistory = [...prevHistory, newGradingEntry];

      if (timeSinceLastCheck >= thirtyMinutesInMs) {
        // Count total grading entries (not count entries)
        const gradingEntries = updatedHistory.filter(entry => entry.type === 'grading');
        const countEntry: CountEntry = {
          type: 'count',
          count: gradingEntries.length,
          timestamp: now
        };
        
        updatedHistory.push(countEntry);
        setLastIntervalCheck(now);
      }

      return updatedHistory;
    });
  };

  const resetAll = () => {
    setStep(0);
    setTowelCount(null);
    setTimeIdx(null);
    setGradeSelections({});
    setDifficultySelections({});
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
      setResultDifficulty('Easy');
      addGradingEntry('C', 'Easy');
      setStep(3);
    }
  };

  const handleTagsComplete = (grade: Grade, selections: Record<string, boolean>) => {
    setResultGrade(grade);
    setGradeSelections(selections);
    if (grade === 'C') {
      // C grade skips difficulty step and goes straight to results
      setResultDifficulty('Easy');
      addGradingEntry(grade, 'Easy');
      setStep(3);
    } else {
      // A and B grades proceed to difficulty step
      setStep(2);
    }
  };

  const handleDifficultyComplete = (difficulty: Difficulty, selections: Record<string, boolean>) => {
    setResultDifficulty(difficulty);
    setDifficultySelections(selections);
    addGradingEntry(resultGrade, difficulty);
    setStep(3);
  };

  const goBackFromTags = (selections: Record<string, boolean>) => {
    setGradeSelections(selections);
    setStep(0);
  };

  const goBackFromDifficulty = (selections: Record<string, boolean>) => {
    setDifficultySelections(selections);
    setStep(1);
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
          onBack={goBackFromTags}
          initialSelections={gradeSelections}
        />
      )}
      {step === 2 && (
        <DifficultyStep
          towelCount={towelCount ?? 1}
          onComplete={handleDifficultyComplete}
          onBack={goBackFromDifficulty}
          initialSelections={difficultySelections}
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
        <div style={{ 
          padding: '1rem',
          maxHeight: 'calc(100vh - 120px)',
          overflowY: 'auto'
        }}>
          <div style={{ 
            marginBottom: '1rem', 
            paddingBottom: '0.5rem', 
            borderBottom: '1px solid #ccc',
            fontSize: '14px',
            color: '#666'
          }}>
            Total entries: {history.filter(entry => entry.type === 'grading').length}
          </div>
          {history.length === 0 ? (
            <p>No history yet.</p>
          ) : (
            history.map((entry, idx) => (
              <div key={idx} style={{ 
                margin: '0.5rem 0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                {entry.type === 'grading' ? (
                  <>
                    <div>
                      <Tag intent={gradeTagColors[entry.grade]} style={{ marginRight: '0.5rem' }}>
                        {entry.grade}
                      </Tag>
                      {entry.grade !== 'C' && (
                        <Tag
                          intent={entry.difficulty === 'Hard' ? undefined : 'primary'}
                          style={{
                            backgroundColor: entry.difficulty === 'Hard' ? '#8B5CF6' : undefined,
                            color: entry.difficulty === 'Hard' ? 'white' : undefined
                          }}
                        >
                          {entry.difficulty}
                        </Tag>
                      )}
                    </div>
                    <span style={{ 
                      fontSize: '12px', 
                      color: '#888',
                      marginLeft: '1rem'
                    }}>
                      {entry.timestamp.toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit',
                        second: '2-digit'
                      })}
                    </span>
                  </>
                ) : (
                  <>
                    <div>
                      <Tag 
                        intent="none" 
                        style={{ 
                          backgroundColor: '#444', 
                          color: '#fff',
                          fontWeight: 'bold'
                        }}
                      >
                        COUNT: {entry.count}
                      </Tag>
                    </div>
                    <span style={{ 
                      fontSize: '12px', 
                      color: '#888',
                      marginLeft: '1rem'
                    }}>
                      {entry.timestamp.toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit',
                        second: '2-digit'
                      })}
                    </span>
                  </>
                )}
              </div>
            ))
          )}
        </div>
      </Drawer>
    </div>
  );
}
