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
import { GRADE_TAGS, DIFFICULTY_TAGS } from './constants';

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

  // localStorage functions
  const saveToLocalStorage = (history: HistoryEntry[], firstTime: Date | null) => {
    try {
      localStorage.setItem('towel-grader-history', JSON.stringify({
        history: history.map(entry => ({
          ...entry,
          timestamp: entry.timestamp.toISOString()
        })),
        firstEntryTime: firstTime?.toISOString() || null
      }));
    } catch (error) {
      console.warn('Failed to save to localStorage:', error);
    }
  };

  const loadFromLocalStorage = (): { history: HistoryEntry[], firstEntryTime: Date | null } => {
    try {
      const saved = localStorage.getItem('towel-grader-history');
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          history: parsed.history.map((entry: any) => ({
            ...entry,
            timestamp: new Date(entry.timestamp)
          })),
          firstEntryTime: parsed.firstEntryTime ? new Date(parsed.firstEntryTime) : null
        };
      }
    } catch (error) {
      console.warn('Failed to load from localStorage:', error);
    }
    return { history: [], firstEntryTime: null };
  };

  // Load saved data on initialization
  useEffect(() => {
    const saved = loadFromLocalStorage();
    setHistory(saved.history);
    setFirstEntryTime(saved.firstEntryTime);
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
  const [expandedHistoryItems, setExpandedHistoryItems] = useState<Set<number>>(new Set());

  // Helper function to get the next 30-minute interval
  const getNextHalfHourMark = (date: Date): Date => {
    const nextMark = new Date(date);
    const minutes = nextMark.getMinutes();
    const seconds = nextMark.getSeconds();
    const milliseconds = nextMark.getMilliseconds();
    
    if (minutes < 30) {
      nextMark.setMinutes(30, 0, 0);
    } else {
      nextMark.setHours(nextMark.getHours() + 1, 0, 0, 0);
    }
    
    return nextMark;
  };

  // Helper function to check if it's a new day
  const isSameDay = (date1: Date, date2: Date): boolean => {
    return date1.toDateString() === date2.toDateString();
  };

  // Helper function to count grading entries for current day
  const getGradingCountForDay = (history: HistoryEntry[], targetDate: Date): number => {
    return history.filter(entry => 
      entry.type === 'grading' && 
      isSameDay(entry.timestamp, targetDate)
    ).length;
  };

  // Direct tag color mapping
  const getGradeTagColor = (tag: string): string => {
    // A-grade tags (green)
    if (tag === 'zero or one minor cosmetic flaw in final fold') {
      return '#0F9960';
    }
    
    // B-grade tags (orange)
    if (tag === 'rolled edge' || 
        tag === 'unfolded or flipped corner' || 
        tag === 'misaligned edge (> 1 inch)' || 
        tag === 'partial unfold during place' || 
        tag === 'other cosmetic issue in final fold' || 
        tag === 'inaccurate placement') {
      return '#D9822B';
    }
    
    // C-grade tags (red)
    if (tag === 'failure to fold or place' || 
        tag === 'chaotic or uncertain movements' || 
        tag === 'inefficient path to fold' || 
        tag === 'complicated in-hand manipulation' || 
        tag === 'hand holding towel out of view') {
      return '#DB3737';
    }
    
    return '#888'; // fallback gray
  };

  const getDifficultyTagColor = (tag: string): string => {
    // Hard difficulty tags (purple)
    if (tag === 'messy initial grab' || 
        tag === 'double grab/pinch' || 
        tag === 'dropped corner' || 
        tag === 'multiple tries for one motion' || 
        tag === 'more than 6s from grab to pre-fold layout' || 
        tag === 'pushed aside extra towels') {
      return '#8B5CF6';
    }
    
    // Easy difficulty tags (blue)
    if (tag === 'all motions logical and efficient') {
      return '#137CBD';
    }
    
    return '#888'; // fallback gray
  };

  const toggleHistoryItemExpansion = (index: number) => {
    setExpandedHistoryItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const addGradingEntry = (grade: Grade, difficulty: Difficulty, selectedGradeTags?: string[], selectedDifficultyTags?: string[]) => {
    const now = new Date();
    
    setHistory((prevHistory) => {
      const newGradingEntry: GradingEntry = {
        type: 'grading',
        grade,
        difficulty,
        timestamp: now,
        selectedGradeTags,
        selectedDifficultyTags
      };

      let updatedFirstTime = firstEntryTime;

      // If this is the first entry of the day or no entries exist, initialize
      if (!updatedFirstTime || !isSameDay(updatedFirstTime, now)) {
        updatedFirstTime = now;
        setFirstEntryTime(updatedFirstTime);
        const newHistory = [newGradingEntry];
        saveToLocalStorage(newHistory, updatedFirstTime);
        return newHistory;
      }

      const updatedHistory = [...prevHistory, newGradingEntry];
      saveToLocalStorage(updatedHistory, updatedFirstTime);
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
      addGradingEntry('C', 'Easy', [], []);
      setStep(3);
    }
  };

  const handleTagsComplete = (grade: Grade, selections: Record<string, boolean>) => {
    setResultGrade(grade);
    setGradeSelections(selections);
    if (grade === 'C') {
      // C grade skips difficulty step and goes straight to results
      setResultDifficulty('Easy');
      const selectedTags = Object.keys(selections).filter(key => selections[key]);
      addGradingEntry(grade, 'Easy', selectedTags, []);
      setStep(3);
    } else {
      // A and B grades proceed to difficulty step
      setStep(2);
    }
  };

  const handleDifficultyComplete = (difficulty: Difficulty, selections: Record<string, boolean>) => {
    setResultDifficulty(difficulty);
    setDifficultySelections(selections);
    const selectedGradeTags = Object.keys(gradeSelections).filter(key => gradeSelections[key]);
    const selectedDifficultyTags = Object.keys(selections).filter(key => selections[key]);
    addGradingEntry(resultGrade, difficulty, selectedGradeTags, selectedDifficultyTags);
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
    // Generate 30-minute interval counts for the data
    const generateIntervalCounts = (entries: HistoryEntry[]): HistoryEntry[] => {
      if (entries.length === 0) return entries;
      
      // Only process grading entries for interval calculation
      const gradingEntries = entries.filter(e => e.type === 'grading');
      if (gradingEntries.length === 0) return entries;
      
      // Find the first entry to determine when to start counting
      const firstEntry = gradingEntries[0];
      const firstEntryDate = firstEntry.timestamp;
      
      // Get the next 30-minute mark after first entry
      let currentInterval = getNextHalfHourMark(firstEntryDate);
      const result: HistoryEntry[] = [...entries];
      
      // Find the last entry time to know when to stop
      const lastEntry = gradingEntries[gradingEntries.length - 1];
      const endTime = new Date();
      const actualEndTime = endTime > lastEntry.timestamp ? endTime : lastEntry.timestamp;
      
      // Generate counts for all 30-minute intervals (only after first entry)
      while (currentInterval <= actualEndTime) {
        // Only generate count if this interval is after the first entry
        if (currentInterval > firstEntryDate) {
          // Count grading entries up to this interval time that are on the same day
          const countUpToInterval = gradingEntries.filter(entry => 
            entry.timestamp <= currentInterval &&
            isSameDay(entry.timestamp, firstEntryDate)
          ).length;
        
          const countEntry: CountEntry = {
            type: 'count',
            count: countUpToInterval,
            timestamp: new Date(currentInterval)
          };
          
          result.push(countEntry);
        }
        
        // Move to next 30-minute interval
        if (currentInterval.getMinutes() === 0) {
          currentInterval.setMinutes(30);
        } else {
          currentInterval.setHours(currentInterval.getHours() + 1, 0, 0, 0);
        }
      }
      
      // Sort all entries by timestamp
      return result.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    };
    
    // Generate entries with interval counts
    const entriesWithCounts = generateIntervalCounts(entries);
    const headers = [
      'Type',
      'Final Grade', 
      'Final Difficulty', 
      'A Tags Selected', 
      'B Tags Selected', 
      'C Tags Selected', 
      'Easy Tags Selected', 
      'Hard Tags Selected', 
      'Date', 
      'Time', 
      'Cumulative Count'
    ];
    const csvRows = [headers.join(',')];

    // Helper function to escape CSV values that contain commas
    const escapeCSV = (value: string): string => {
      if (value.includes(',') || value.includes('"') || value.includes('\n')) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    };

    // Helper function to get tags by grade
    const getTagsByGrade = (tags: string[] | undefined, targetGrade: 'A' | 'B' | 'C'): string => {
      if (!tags || tags.length === 0) return '';
      
      const matchingTags = tags.filter(tag => {
        // A-grade tags
        if (targetGrade === 'A' && tag.includes('zero or one minor cosmetic')) return true;
        
        // B-grade tags  
        if (targetGrade === 'B' && (
          tag.includes('rolled edge') ||
          tag.includes('unfolded or flipped') ||
          tag.includes('misaligned edge') ||
          tag.includes('partial unfold') ||
          tag.includes('other cosmetic') ||
          tag.includes('inaccurate placement')
        )) return true;
        
        // C-grade tags
        if (targetGrade === 'C' && (
          tag.includes('failure to fold') ||
          tag.includes('chaotic or uncertain') ||
          tag.includes('inefficient path') ||
          tag.includes('complicated in-hand') ||
          tag.includes('hand holding towel')
        )) return true;
        
        return false;
      });
      
      return matchingTags.join('; ');
    };

    // Helper function to get tags by difficulty
    const getTagsByDifficulty = (tags: string[] | undefined, targetDifficulty: 'Easy' | 'Hard'): string => {
      if (!tags || tags.length === 0) return '';
      
      const matchingTags = tags.filter(tag => {
        // Hard difficulty tags
        if (targetDifficulty === 'Hard' && (
          tag.includes('messy initial') ||
          tag.includes('double grab') ||
          tag.includes('dropped corner') ||
          tag.includes('multiple tries') ||
          tag.includes('more than 6s') ||
          tag.includes('pushed aside')
        )) return true;
        
        // Easy difficulty tags
        if (targetDifficulty === 'Easy' && tag.includes('all motions logical')) return true;
        
        return false;
      });
      
      return matchingTags.join('; ');
    };

    entriesWithCounts.forEach(entry => {
      const date = entry.timestamp.toLocaleDateString();
      const time = entry.timestamp.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit',
        second: '2-digit'
      });

      if (entry.type === 'grading') {
        const aTags = getTagsByGrade(entry.selectedGradeTags, 'A');
        const bTags = getTagsByGrade(entry.selectedGradeTags, 'B');
        const cTags = getTagsByGrade(entry.selectedGradeTags, 'C');
        const easyTags = entry.grade === 'C' ? '' : getTagsByDifficulty(entry.selectedDifficultyTags, 'Easy');
        const hardTags = entry.grade === 'C' ? '' : getTagsByDifficulty(entry.selectedDifficultyTags, 'Hard');

        csvRows.push([
          'Grading',
          entry.grade,
          entry.grade === 'C' ? '' : entry.difficulty, // No difficulty for C grades
          escapeCSV(aTags),
          escapeCSV(bTags),
          escapeCSV(cTags),
          escapeCSV(easyTags),
          escapeCSV(hardTags),
          date,
          time,
          ''
        ].join(','));
      } else {
        csvRows.push([
          'Count',
          '',
          '',
          '',
          '',
          '',
          '',
          '',
          date,
          time,
          entry.count.toString()
        ].join(','));
      }
    });

    // Add total count (only original entries, not generated counts)
    const gradingCount = entries.filter(e => e.type === 'grading').length;
    if (gradingCount > 0) {
      const totalLabel = isAllDates ? 'Total (All Dates)' : 'Total';
      csvRows.push([
        totalLabel, 
        '', 
        '', 
        '', 
        '', 
        '', 
        '', 
        '', 
        '', 
        '', 
        gradingCount.toString()
      ].join(','));
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
      saveToLocalStorage([], null);
    } else {
      const remainingEntries = history.filter(entry => 
        entry.timestamp.toLocaleDateString() !== lastDownloadedDate
      );
      setHistory(remainingEntries);
      
      // Update timing if no entries remain
      if (remainingEntries.length === 0) {
        setFirstEntryTime(null);
        saveToLocalStorage([], null);
      } else {
        // Find new first entry time if needed
        const gradingEntries = remainingEntries.filter(e => e.type === 'grading');
        if (gradingEntries.length > 0) {
          const newFirstTime = gradingEntries[0].timestamp;
          setFirstEntryTime(newFirstTime);
          saveToLocalStorage(remainingEntries, newFirstTime);
        }
      }
    }
  };

  const clearAllHistory = () => {
    setHistory([]);
    setFirstEntryTime(null);
    saveToLocalStorage([], null);
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
    // If the user is currently typing in an input field, don't intercept any keys
    const target = e.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'SELECT' || target.isContentEditable) {
      return; // Let the input handle the keystroke normally
    }

    const totalItems = 4; // filename, date, cancel, download
    
    switch (e.code) {
      case 'ArrowUp':
        e.preventDefault();
        setDownloadModalFocusIndex((prev) => Math.max(0, prev - 1));
        break;
      case 'ArrowDown':
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
        e.preventDefault();
        setClearHistoryModalFocusIndex((prev) => Math.max(0, prev - 1));
        break;
      case 'ArrowDown':
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
        e.preventDefault();
        setConfirmModalFocusIndex(0);
        break;
      case 'ArrowRight':
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
            Total entries: {history.length}
          </div>
          {history.length === 0 ? (
            <p>No history yet.</p>
          ) : (
            history.map((entry, idx) => {
              const gradingEntry = entry as GradingEntry;
              return (
              <div key={idx} style={{ 
                margin: '0.5rem 0',
                border: '1px solid #333',
                borderRadius: '4px',
                padding: '0.5rem'
              }}>
                <>
                  <div style={{ 
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer'
                  }}
                  onClick={() => toggleHistoryItemExpansion(idx)}
                  >
                    <div>
                      <Tag intent={gradeTagColors[gradingEntry.grade]} style={{ marginRight: '0.5rem' }}>
                        {gradingEntry.grade}
                      </Tag>
                      {gradingEntry.grade !== 'C' && (
                        <Tag
                          intent={gradingEntry.difficulty === 'Hard' ? undefined : 'primary'}
                          style={{
                            backgroundColor: gradingEntry.difficulty === 'Hard' ? '#8B5CF6' : undefined,
                            color: gradingEntry.difficulty === 'Hard' ? 'white' : undefined,
                            marginRight: '0.5rem'
                          }}
                        >
                          {gradingEntry.difficulty}
                        </Tag>
                      )}
                      <span style={{ fontSize: '12px', color: '#aaa' }}>
                        {expandedHistoryItems.has(idx) ? '▼' : '▶'} Click to {expandedHistoryItems.has(idx) ? 'hide' : 'show'} tags
                      </span>
                    </div>
                    <span style={{ 
                      fontSize: '12px', 
                      color: '#888',
                      marginLeft: '1rem'
                    }}>
                      {gradingEntry.timestamp.toLocaleDateString()} {gradingEntry.timestamp.toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit',
                        second: '2-digit'
                      })}
                    </span>
                  </div>
                  {expandedHistoryItems.has(idx) && (
                    <div style={{ 
                      marginTop: '0.5rem',
                      paddingTop: '0.5rem',
                      borderTop: '1px solid #444',
                      fontSize: '12px'
                    }}>
                      {gradingEntry.selectedGradeTags && gradingEntry.selectedGradeTags.length > 0 && (
                        <div style={{ marginBottom: '0.25rem' }}>
                          <strong style={{ color: '#ccc' }}>Grade Tags:</strong>
                          <div style={{ marginTop: '0.25rem' }}>
                            {gradingEntry.selectedGradeTags.map((tag: string, tagIdx: number) => {
                              console.log('Rendering grade tag:', tag);
                              let bgColor = '#888'; // default gray
                              
                              // Hard-code the colors for each specific tag
                              if (tag.includes('zero or one minor cosmetic')) bgColor = '#0F9960'; // A - green
                              else if (tag.includes('rolled edge')) bgColor = '#D9822B'; // B - orange
                              else if (tag.includes('unfolded or flipped')) bgColor = '#D9822B'; // B - orange
                              else if (tag.includes('misaligned edge')) bgColor = '#D9822B'; // B - orange
                              else if (tag.includes('partial unfold')) bgColor = '#D9822B'; // B - orange
                              else if (tag.includes('other cosmetic')) bgColor = '#D9822B'; // B - orange
                              else if (tag.includes('inaccurate placement')) bgColor = '#D9822B'; // B - orange
                              else if (tag.includes('failure to fold')) bgColor = '#DB3737'; // C - red
                              else if (tag.includes('chaotic or uncertain')) bgColor = '#DB3737'; // C - red
                              else if (tag.includes('inefficient path')) bgColor = '#DB3737'; // C - red
                              else if (tag.includes('complicated in-hand')) bgColor = '#DB3737'; // C - red
                              else if (tag.includes('hand holding towel')) bgColor = '#DB3737'; // C - red
                              
                              return (
                                <span key={tagIdx} style={{ 
                                  display: 'inline-block',
                                  marginRight: '0.25rem', 
                                  marginBottom: '0.25rem',
                                  fontSize: '11px',
                                  backgroundColor: bgColor,
                                  color: 'white',
                                  fontWeight: 'bold',
                                  padding: '2px 6px',
                                  borderRadius: '3px',
                                  border: 'none'
                                }}>
                                  {tag}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      )}
                      {gradingEntry.selectedDifficultyTags && gradingEntry.selectedDifficultyTags.length > 0 && (
                        <div>
                          <strong style={{ color: '#ccc' }}>Difficulty Tags:</strong>
                          <div style={{ marginTop: '0.25rem' }}>
                            {gradingEntry.selectedDifficultyTags.map((tag: string, tagIdx: number) => {
                              console.log('Rendering difficulty tag:', tag);
                              let bgColor = '#888'; // default gray
                              
                              // Hard-code the colors for each specific tag
                              if (tag.includes('messy initial')) bgColor = '#8B5CF6'; // Hard - purple
                              else if (tag.includes('double grab')) bgColor = '#8B5CF6'; // Hard - purple
                              else if (tag.includes('dropped corner')) bgColor = '#8B5CF6'; // Hard - purple
                              else if (tag.includes('multiple tries')) bgColor = '#8B5CF6'; // Hard - purple
                              else if (tag.includes('more than 6s')) bgColor = '#8B5CF6'; // Hard - purple
                              else if (tag.includes('pushed aside')) bgColor = '#8B5CF6'; // Hard - purple
                              else if (tag.includes('all motions logical')) bgColor = '#137CBD'; // Easy - blue
                              
                              return (
                                <span key={tagIdx} style={{ 
                                  display: 'inline-block',
                                  marginRight: '0.25rem', 
                                  marginBottom: '0.25rem',
                                  fontSize: '11px',
                                  backgroundColor: bgColor,
                                  color: 'white',
                                  fontWeight: 'bold',
                                  padding: '2px 6px',
                                  borderRadius: '3px',
                                  border: 'none'
                                }}>
                                  {tag}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      )}
                      {(!gradingEntry.selectedGradeTags || gradingEntry.selectedGradeTags.length === 0) && 
                       (!gradingEntry.selectedDifficultyTags || gradingEntry.selectedDifficultyTags.length === 0) && (
                        <div style={{ color: '#888', fontStyle: 'italic' }}>
                          No tags available (older entry)
                        </div>
                      )}
                    </div>
                  )}
                </>
              </div>
              );
            })
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
          onKeyDown={handleDownloadModalKeyDown}
        >
          <FormGroup label="File Name" labelFor="filename-input">
            <InputGroup
              id="filename-input"
              placeholder="Enter filename (without .csv extension)"
              value={downloadFileName}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDownloadFileName(e.target.value)}
              onClick={() => setDownloadModalFocusIndex(0)}
              onKeyDown={(e: React.KeyboardEvent) => e.stopPropagation()}
              style={getModalFocusStyle(0, downloadModalFocusIndex)}
            />
          </FormGroup>

          <FormGroup label="Select Date" labelFor="date-select" style={{ marginTop: '1rem' }}>
            <HTMLSelect
              id="date-select"
              value={selectedDate}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedDate(e.target.value)}
              onClick={() => setDownloadModalFocusIndex(1)}
              onKeyDown={(e: React.KeyboardEvent) => e.stopPropagation()}
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
