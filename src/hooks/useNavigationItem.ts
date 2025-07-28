import { useEffect, useRef } from 'react';

interface NavigationItemProps {
  id: string;
  row: number;
  col: number;
  onRegister: (id: string, element: HTMLElement, row: number, col: number) => void;
  onUnregister: (id: string) => void;
}

export const useNavigationItem = ({ id, row, col, onRegister, onUnregister }: NavigationItemProps) => {
  const elementRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (elementRef.current) {
      onRegister(id, elementRef.current, row, col);
    }

    return () => {
      onUnregister(id);
    };
  }, [id, row, col, onRegister, onUnregister]);

  return elementRef;
};