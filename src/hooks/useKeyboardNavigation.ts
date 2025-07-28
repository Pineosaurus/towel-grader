import { useEffect, useRef, useState } from 'react';

interface NavigationItem {
  id: string;
  element: HTMLElement;
  row: number;
  col: number;
}

interface UseKeyboardNavigationOptions {
  onEnter?: () => void;
  onTab?: () => void;
  onSpace?: () => void;
}

export const useKeyboardNavigation = (options: UseKeyboardNavigationOptions = {}) => {
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [items, setItems] = useState<NavigationItem[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  const registerItem = (id: string, element: HTMLElement, row: number, col: number) => {
    setItems(prev => {
      const filtered = prev.filter(item => item.id !== id);
      const newItem = { id, element, row, col };
      const updated = [...filtered, newItem];
      // Sort by row first, then by col
      return updated.sort((a, b) => a.row - b.row || a.col - b.col);
    });
  };

  const unregisterItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const updateFocus = (newIndex: number) => {
    if (items.length === 0) return;
    const clampedIndex = Math.max(0, Math.min(newIndex, items.length - 1));
    setFocusedIndex(clampedIndex);
    
    // Add visual focus styling
    items.forEach((item, index) => {
      if (index === clampedIndex) {
        item.element.style.outline = '2px solid #17A2B8';
        item.element.style.outlineOffset = '2px';
        item.element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      } else {
        item.element.style.outline = '';
        item.element.style.outlineOffset = '';
      }
    });
  };

  const moveUp = () => {
    if (items.length === 0) return;
    const currentItem = items[focusedIndex];
    const currentRow = currentItem.row;
    const currentCol = currentItem.col;
    
    // Find items in the row above
    const itemsAbove = items.filter(item => item.row < currentRow);
    if (itemsAbove.length === 0) return;
    
    // Get the highest row below current
    const targetRow = Math.max(...itemsAbove.map(item => item.row));
    const rowItems = itemsAbove.filter(item => item.row === targetRow);
    
    // Find closest column match
    const closest = rowItems.reduce((prev, curr) => 
      Math.abs(curr.col - currentCol) < Math.abs(prev.col - currentCol) ? curr : prev
    );
    
    const newIndex = items.findIndex(item => item.id === closest.id);
    if (newIndex !== -1) updateFocus(newIndex);
  };

  const moveDown = () => {
    if (items.length === 0) return;
    const currentItem = items[focusedIndex];
    const currentRow = currentItem.row;
    const currentCol = currentItem.col;
    
    // Find items in the row below
    const itemsBelow = items.filter(item => item.row > currentRow);
    if (itemsBelow.length === 0) return;
    
    // Get the lowest row above current
    const targetRow = Math.min(...itemsBelow.map(item => item.row));
    const rowItems = itemsBelow.filter(item => item.row === targetRow);
    
    // Find closest column match
    const closest = rowItems.reduce((prev, curr) => 
      Math.abs(curr.col - currentCol) < Math.abs(prev.col - currentCol) ? curr : prev
    );
    
    const newIndex = items.findIndex(item => item.id === closest.id);
    if (newIndex !== -1) updateFocus(newIndex);
  };

  const moveLeft = () => {
    if (items.length === 0) return;
    const currentItem = items[focusedIndex];
    const currentRow = currentItem.row;
    const currentCol = currentItem.col;
    
    // Find items in the same row to the left
    const leftItems = items.filter(item => item.row === currentRow && item.col < currentCol);
    if (leftItems.length === 0) return;
    
    // Get the rightmost item to the left
    const closest = leftItems.reduce((prev, curr) => curr.col > prev.col ? curr : prev);
    const newIndex = items.findIndex(item => item.id === closest.id);
    if (newIndex !== -1) updateFocus(newIndex);
  };

  const moveRight = () => {
    if (items.length === 0) return;
    const currentItem = items[focusedIndex];
    const currentRow = currentItem.row;
    const currentCol = currentItem.col;
    
    // Find items in the same row to the right
    const rightItems = items.filter(item => item.row === currentRow && item.col > currentCol);
    if (rightItems.length === 0) return;
    
    // Get the leftmost item to the right
    const closest = rightItems.reduce((prev, curr) => curr.col < prev.col ? curr : prev);
    const newIndex = items.findIndex(item => item.id === closest.id);
    if (newIndex !== -1) updateFocus(newIndex);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent default for navigation keys
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyW', 'KeyA', 'KeyS', 'KeyD', 'Space', 'Enter', 'Tab'].includes(e.code)) {
        e.preventDefault();
      }

      switch (e.code) {
        case 'ArrowUp':
        case 'KeyW':
          moveUp();
          break;
        case 'ArrowDown':
        case 'KeyS':
          moveDown();
          break;
        case 'ArrowLeft':
        case 'KeyA':
          moveLeft();
          break;
        case 'ArrowRight':
        case 'KeyD':
          moveRight();
          break;
        case 'Space':
          if (options.onSpace) {
            options.onSpace();
          } else if (items[focusedIndex]) {
            // Default space behavior - click the focused element
            items[focusedIndex].element.click();
          }
          break;
        case 'Enter':
          if (options.onEnter) {
            options.onEnter();
          }
          break;
        case 'Tab':
          if (options.onTab) {
            options.onTab();
          }
          break;
      }
    };

    if (containerRef.current) {
      containerRef.current.addEventListener('keydown', handleKeyDown);
      // Make container focusable
      containerRef.current.tabIndex = 0;
      containerRef.current.focus();
    }

    return () => {
      if (containerRef.current) {
        containerRef.current.removeEventListener('keydown', handleKeyDown);
      }
    };
  }, [items, focusedIndex, options]);

  // Initialize focus on first item when items change
  useEffect(() => {
    if (items.length > 0 && focusedIndex < items.length) {
      updateFocus(focusedIndex);
    }
  }, [items]);

  return {
    containerRef,
    registerItem,
    unregisterItem,
    focusedIndex,
    items
  };
};