import { useState, useEffect } from 'react';
import {
  Button,
  Drawer,
  Tag,
  Dialog,
  FormGroup,
  InputGroup,
  HTMLSelect,
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

  // localStorage functions
  const saveToLocalStorage = (history: HistoryEntry[], firstTime: Date | null, lastCheck: Date | null) => {
    try {
      localStorage.setItem('towel-grader-history', JSON.stringify({
        history: history.map(entry => ({
          ...entry,
          timestamp: entry.timestamp.toISOString()
        })),
        firstEntryTime: firstTime?.toISOString() || null,
        lastIntervalCheck: lastCheck?.toISOString() || null
      }));
    } catch (error) {
      console.warn('Failed to save to localStorage:', error);
    }
  };

  const loadFromLocalStorage = (): { history: HistoryEntry[], firstEntryTime: Date | null, lastIntervalCheck: Date | null } => {
    try {
      const saved = localStorage.getItem('towel-grader-history');
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          history: parsed.history.map((entry: any) => ({
            ...entry,
            timestamp: new Date(entry.timestamp)
          })),
          firstEntryTime: parsed.firstEntryTime ? new Date(parsed.firstEntryTime) : null,
          lastIntervalCheck: parsed.lastIntervalCheck ? new Date(parsed.lastIntervalCheck) : null
        };
      }
    } catch (error) {
      console.warn('Failed to load from localStorage:', error);
    }
    return { history: [], firstEntryTime: null, lastIntervalCheck: null };
  };

  // Load saved data on initialization
  useEffect(() => {
    const saved = loadFromLocalStorage();
    setHistory(saved.history);
    setFirstEntryTime(saved.firstEntryTime);
    setLastIntervalCheck(saved.lastIntervalCheck);
  }, []);

  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
  const [downloadFileName, setDownloadFileName] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [isClearHistoryModalOpen, setIsClearHistoryModalOpen] = useState(false);
  const [isConfirmDeleteModalOpen, setIsConfirmDeleteModalOpen] = useState(false);
  const [clearHistoryType, setClearHistoryType] = useState<'downloaded' | 'all' | null>(null);
  const [lastDownloadedDate, setLastDownloadedDate] = useState<string>('');
  const [downloadModalFocusIndex, setDownloadModalFocusIndex] = useState(0);
  const [clearHistoryModalFocusIndex, setClearHistoryModalFocusIndex] = useState(2); // Default to "No"
  const [confirmModalFocusIndex, setConfirmModalFocusIndex] = useState(0);

  const addGradingEntry = (grade: Grade, difficulty: Difficulty) => {
    const now = new Date();
    
    setHistory((prevHistory) => {
      const newGradingEntry: GradingEntry = {
        type: 'grading',
        grade,
        difficulty,
        timestamp: now
      };

      let updatedFirstTime = firstEntryTime;
      let updatedLastCheck = lastIntervalCheck;

      // If this is the first entry, set the first entry time
      if (!firstEntryTime) {
        updatedFirstTime = now;
        updatedLastCheck = now;
        setFirstEntryTime(now);
        setLastIntervalCheck(now);
        const newHistory = [newGradingEntry];
        saveToLocalStorage(newHistory, updatedFirstTime, updatedLastCheck);
        return newHistory;
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
        updatedLastCheck = now;
        setLastIntervalCheck(now);
      }

      saveToLocalStorage(updatedHistory, updatedFirstTime, updatedLastCheck);
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

  // Download functionality
  const getUniqueDates = (): string[] => {
    const dates = new Set<string>();
    history.forEach(entry => {
      const dateStr = entry.timestamp.toLocaleDateString();
      dates.add(dateStr);
    });
    return Array.from(dates).sort();
  };

  const filterEntriesByDate = (selectedDateStr: string): HistoryEntry[] => {
    if (selectedDateStr === 'all') {
      return history;
    }
    return history.filter(entry => 
      entry.timestamp.toLocaleDateString() === selectedDateStr
    );
  };

  const generateCSV = (entries: HistoryEntry[], isAllDates: boolean = false): string => {
    const headers = ['Type', 'Grade', 'Difficulty', 'Date', 'Time', 'Count'];
    const csvRows = [headers.join(',')];

    entries.forEach(entry => {
      const date = entry.timestamp.toLocaleDateString();
      const time = entry.timestamp.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit',
        second: '2-digit'
      });

      if (entry.type === 'grading') {
        csvRows.push([
          'Grading',
          entry.grade,
          entry.difficulty,
          date,
          time,
          ''
        ].join(','));
      } else {
        csvRows.push([
          'Count',
          '',
          '',
          date,
          time,
          entry.count.toString()
        ].join(','));
      }
    });

    // Add total count
    const gradingCount = entries.filter(e => e.type === 'grading').length;
    if (gradingCount > 0) {
      const totalLabel = isAllDates ? 'Total (All Dates)' : 'Total';
      csvRows.push([totalLabel, '', '', '', '', gradingCount.toString()].join(','));
    }

    return csvRows.join('\n');
  };

  const downloadCSV = () => {
    if (!selectedDate || !downloadFileName.trim()) return;

    const filteredEntries = filterEntriesByDate(selectedDate);
    const isAllDates = selectedDate === 'all';
    const csvContent = generateCSV(filteredEntries, isAllDates);
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `${downloadFileName.trim()}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Store the downloaded date and show clear history modal
    setLastDownloadedDate(selectedDate);
    setIsDownloadModalOpen(false);
    // Set focus to "No" button by default (last button)
    const uniqueDates = getUniqueDates();
    setClearHistoryModalFocusIndex(uniqueDates.length > 1 ? 2 : 1);
    setIsClearHistoryModalOpen(true);
    
    // Reset download form
    setDownloadFileName('');
    setSelectedDate('');
  };

  const openDownloadModal = () => {
    const dates = getUniqueDates();
    if (dates.length > 0) {
      setSelectedDate(dates[dates.length - 1]); // Default to most recent date
    }
    setDownloadModalFocusIndex(0);
    setIsDownloadModalOpen(true);
  };

  const clearDownloadedHistory = () => {
    if (lastDownloadedDate === 'all') {
      setHistory([]);
      setFirstEntryTime(null);
      setLastIntervalCheck(null);
      saveToLocalStorage([], null, null);
    } else {
      const remainingEntries = history.filter(entry => 
        entry.timestamp.toLocaleDateString() !== lastDownloadedDate
      );
      setHistory(remainingEntries);
      
      // Update timing if no entries remain
      if (remainingEntries.length === 0) {
        setFirstEntryTime(null);
        setLastIntervalCheck(null);
        saveToLocalStorage([], null, null);
      } else {
        // Find new first entry time if needed
        const gradingEntries = remainingEntries.filter(e => e.type === 'grading');
        if (gradingEntries.length > 0) {
          const newFirstTime = gradingEntries[0].timestamp;
          setFirstEntryTime(newFirstTime);
          saveToLocalStorage(remainingEntries, newFirstTime, lastIntervalCheck);
        }
      }
    }
  };

  const clearAllHistory = () => {
    setHistory([]);
    setFirstEntryTime(null);
    setLastIntervalCheck(null);
    saveToLocalStorage([], null, null);
  };

  const handleClearHistoryConfirm = (type: 'downloaded' | 'all') => {
    setClearHistoryType(type);
    setIsClearHistoryModalOpen(false);
    setConfirmModalFocusIndex(0); // Default to "No"
    setIsConfirmDeleteModalOpen(true);
  };

  const handleFinalDelete = () => {
    if (clearHistoryType === 'downloaded') {
      clearDownloadedHistory();
    } else if (clearHistoryType === 'all') {
      clearAllHistory();
    }
    
    setIsConfirmDeleteModalOpen(false);
    setClearHistoryType(null);
    setLastDownloadedDate('');
  };

  // Keyboard handlers for modals
  const handleDownloadModalKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const totalItems = 4; // filename, date, cancel, download
    
    switch (e.code) {
      case 'ArrowUp':
      case 'KeyW':
        e.preventDefault();
        setDownloadModalFocusIndex((prev) => Math.max(0, prev - 1));
        break;
      case 'ArrowDown':
      case 'KeyS':
        e.preventDefault();
        setDownloadModalFocusIndex((prev) => Math.min(totalItems - 1, prev + 1));
        break;
      case 'Space':
        e.preventDefault();
        if (downloadModalFocusIndex === 2) {
          // Cancel button
          setIsDownloadModalOpen(false);
          setDownloadFileName('');
          setSelectedDate('');
        } else if (downloadModalFocusIndex === 3) {
          // Download button
          if (downloadFileName.trim() && selectedDate) {
            downloadCSV();
          }
        }
        break;
      case 'Enter':
        e.preventDefault();
        if (downloadFileName.trim() && selectedDate) {
          downloadCSV();
        }
        break;
      case 'Tab':
        e.preventDefault();
        setIsDownloadModalOpen(false);
        setDownloadFileName('');
        setSelectedDate('');
        break;
    }
  };

  const handleClearHistoryModalKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const uniqueDates = getUniqueDates();
    const totalItems = uniqueDates.length > 1 ? 3 : 2; // clear downloaded, clear all (if multiple dates), no
    
    switch (e.code) {
      case 'ArrowUp':
      case 'KeyW':
        e.preventDefault();
        setClearHistoryModalFocusIndex((prev) => Math.max(0, prev - 1));
        break;
      case 'ArrowDown':
      case 'KeyS':
        e.preventDefault();
        setClearHistoryModalFocusIndex((prev) => Math.min(totalItems - 1, prev + 1));
        break;
      case 'Space':
      case 'Enter':
        e.preventDefault();
        if (clearHistoryModalFocusIndex === 0) {
          handleClearHistoryConfirm('downloaded');
        } else if (clearHistoryModalFocusIndex === 1 && uniqueDates.length > 1) {
          handleClearHistoryConfirm('all');
        } else if ((clearHistoryModalFocusIndex === 1 && uniqueDates.length === 1) || (clearHistoryModalFocusIndex === 2 && uniqueDates.length > 1)) {
          // No button - position depends on whether "Clear All" is shown
          setIsClearHistoryModalOpen(false);
          setLastDownloadedDate('');
        }
        break;
      case 'Tab':
        e.preventDefault();
        setIsClearHistoryModalOpen(false);
        setLastDownloadedDate('');
        break;
    }
  };

  const handleConfirmModalKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    switch (e.code) {
      case 'ArrowLeft':
      case 'KeyA':
        e.preventDefault();
        setConfirmModalFocusIndex(0);
        break;
      case 'ArrowRight':
      case 'KeyD':
        e.preventDefault();
        setConfirmModalFocusIndex(1);
        break;
      case 'Space':
        e.preventDefault();
        if (confirmModalFocusIndex === 0) {
          // No button
          setIsConfirmDeleteModalOpen(false);
          setClearHistoryType(null);
          setLastDownloadedDate('');
        } else {
          // Yes, Delete button
          handleFinalDelete();
        }
        break;
      case 'Enter':
        e.preventDefault();
        handleFinalDelete();
        break;
      case 'Tab':
        e.preventDefault();
        setIsConfirmDeleteModalOpen(false);
        setClearHistoryType(null);
        setLastDownloadedDate('');
        break;
    }
  };

  // Focus style helper
  const getModalFocusStyle = (index: number, currentIndex: number) => ({
    outline: index === currentIndex ? '2px solid #17A2B8' : '',
    outlineOffset: '2px'
  });

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
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <span>History</span>
            <Button
              icon="download"
              minimal
              small
              onClick={openDownloadModal}
              disabled={history.length === 0}
              style={{ marginRight: '1rem' }}
            >
              Download History
            </Button>
          </div>
        }
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
                      {entry.timestamp.toLocaleDateString()} {entry.timestamp.toLocaleTimeString([], { 
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
                      {entry.timestamp.toLocaleDateString()} {entry.timestamp.toLocaleTimeString([], { 
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

      {/* Download Modal */}
      <Dialog
        isOpen={isDownloadModalOpen}
        onClose={() => {
          setIsDownloadModalOpen(false);
          setDownloadFileName('');
          setSelectedDate('');
        }}
        title="Download History"
        style={{ width: '400px' }}
      >
        <div 
          style={{ padding: '1rem', outline: 'none' }}
          tabIndex={0}
          onKeyDown={handleDownloadModalKeyDown}
          ref={(el) => {
            if (el && isDownloadModalOpen) {
              el.focus();
            }
          }}
        >
          <FormGroup label="File Name" labelFor="filename-input">
            <InputGroup
              id="filename-input"
              placeholder="Enter filename (without .csv extension)"
              value={downloadFileName}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDownloadFileName(e.target.value)}
              onClick={() => setDownloadModalFocusIndex(0)}
              style={getModalFocusStyle(0, downloadModalFocusIndex)}
            />
          </FormGroup>

          <FormGroup label="Select Date" labelFor="date-select" style={{ marginTop: '1rem' }}>
            <HTMLSelect
              id="date-select"
              value={selectedDate}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedDate(e.target.value)}
              onClick={() => setDownloadModalFocusIndex(1)}
              style={{ ...getModalFocusStyle(1, downloadModalFocusIndex), width: '100%' }}
              fill
            >
              <option value="">Select a date...</option>
              {getUniqueDates().length > 1 && (
                <option value="all">All Dates</option>
              )}
              {getUniqueDates().map(date => (
                <option key={date} value={date}>
                  {date}
                </option>
              ))}
            </HTMLSelect>
          </FormGroup>

          <div style={{ 
            marginTop: '2rem', 
            display: 'flex', 
            justifyContent: 'flex-end', 
            gap: '0.5rem' 
          }}>
            <Button
              onClick={() => {
                setDownloadModalFocusIndex(2);
                setIsDownloadModalOpen(false);
                setDownloadFileName('');
                setSelectedDate('');
              }}
              style={getModalFocusStyle(2, downloadModalFocusIndex)}
            >
              Cancel
            </Button>
            <Button
              intent="primary"
              onClick={() => {
                setDownloadModalFocusIndex(3);
                if (downloadFileName.trim() && selectedDate) {
                  downloadCSV();
                }
              }}
              disabled={!downloadFileName.trim() || !selectedDate}
              style={{
                backgroundColor: '#17A2B8',
                color: 'white',
                border: 'none',
                ...getModalFocusStyle(3, downloadModalFocusIndex)
              }}
            >
              Download
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Clear History Modal */}
      <Dialog
        isOpen={isClearHistoryModalOpen}
        onClose={() => {
          setIsClearHistoryModalOpen(false);
          setLastDownloadedDate('');
        }}
        title="Clear History"
        style={{ width: '400px' }}
      >
        <div 
          style={{ padding: '1rem', outline: 'none' }}
          tabIndex={0}
          onKeyDown={handleClearHistoryModalKeyDown}
          ref={(el) => {
            if (el && isClearHistoryModalOpen) {
              el.focus();
            }
          }}
        >
          <p style={{ marginBottom: '1.5rem' }}>
            Would you like to clear history?
          </p>
          
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '0.5rem',
            marginBottom: '2rem'
          }}>
            <Button
              onClick={() => {
                setClearHistoryModalFocusIndex(0);
                handleClearHistoryConfirm('downloaded');
              }}
              style={{ 
                textAlign: 'left',
                ...getModalFocusStyle(0, clearHistoryModalFocusIndex)
              }}
            >
              Clear Downloaded History
              {lastDownloadedDate === 'all' ? ' (All Dates)' : ` (${lastDownloadedDate})`}
            </Button>
            {getUniqueDates().length > 1 && (
              <Button
                onClick={() => {
                  setClearHistoryModalFocusIndex(1);
                  handleClearHistoryConfirm('all');
                }}
                style={{ 
                  textAlign: 'left',
                  ...getModalFocusStyle(1, clearHistoryModalFocusIndex)
                }}
              >
                Clear All History
              </Button>
            )}
            <Button
              intent="primary"
              onClick={() => {
                const buttonIndex = getUniqueDates().length > 1 ? 2 : 1;
                setClearHistoryModalFocusIndex(buttonIndex);
                setIsClearHistoryModalOpen(false);
                setLastDownloadedDate('');
              }}
              style={{
                backgroundColor: '#17A2B8',
                color: 'white',
                border: 'none',
                textAlign: 'left',
                ...getModalFocusStyle(getUniqueDates().length > 1 ? 2 : 1, clearHistoryModalFocusIndex)
              }}
            >
              No (Keep History)
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Confirmation Delete Modal */}
      <Dialog
        isOpen={isConfirmDeleteModalOpen}
        onClose={() => {
          setIsConfirmDeleteModalOpen(false);
          setClearHistoryType(null);
          setLastDownloadedDate('');
        }}
        title="Confirm Delete"
        style={{ width: '400px' }}
      >
        <div 
          style={{ padding: '1rem', outline: 'none' }}
          tabIndex={0}
          onKeyDown={handleConfirmModalKeyDown}
          ref={(el) => {
            if (el && isConfirmDeleteModalOpen) {
              el.focus();
            }
          }}
        >
          <p style={{ marginBottom: '1.5rem' }}>
            Are you sure you want to delete {' '}
            {clearHistoryType === 'all' 
              ? 'all history' 
              : clearHistoryType === 'downloaded' && lastDownloadedDate === 'all'
                ? 'all history'
                : `history from ${lastDownloadedDate}`
            }?
            <br /><br />
            <strong>This action cannot be undone.</strong>
          </p>
          
          <div style={{ 
            display: 'flex', 
            justifyContent: 'flex-end', 
            gap: '0.5rem' 
          }}>
            <Button
              onClick={() => {
                setConfirmModalFocusIndex(0);
                setIsConfirmDeleteModalOpen(false);
                setClearHistoryType(null);
                setLastDownloadedDate('');
              }}
              style={getModalFocusStyle(0, confirmModalFocusIndex)}
            >
              No
            </Button>
            <Button
              intent="danger"
              onClick={() => {
                setConfirmModalFocusIndex(1);
                handleFinalDelete();
              }}
              style={getModalFocusStyle(1, confirmModalFocusIndex)}
            >
              Yes, Delete
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
