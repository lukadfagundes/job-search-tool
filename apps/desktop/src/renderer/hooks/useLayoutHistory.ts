import { useState, useCallback, useRef } from 'react';
import type { LayoutElement } from '../../shared/layout-types.ts';

const MAX_HISTORY = 50;

export function useLayoutHistory(initialElements: LayoutElement[]) {
  const [elements, setElementsInternal] = useState<LayoutElement[]>(initialElements);
  const historyRef = useRef<LayoutElement[][]>([initialElements]);
  const indexRef = useRef(0);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const pushState = useCallback((newElements: LayoutElement[]) => {
    // Clear any future states (if we've undone)
    historyRef.current = historyRef.current.slice(0, indexRef.current + 1);
    historyRef.current.push(newElements);
    // Limit history size
    if (historyRef.current.length > MAX_HISTORY) {
      historyRef.current.shift();
    } else {
      indexRef.current += 1;
    }
    setElementsInternal(newElements);
  }, []);

  const setElements = useCallback(
    (updater: LayoutElement[] | ((prev: LayoutElement[]) => LayoutElement[])) => {
      setElementsInternal((prev) => {
        const next = typeof updater === 'function' ? updater(prev) : updater;
        // Debounce rapid changes (dragging, etc.)
        if (debounceTimer.current) clearTimeout(debounceTimer.current);
        debounceTimer.current = setTimeout(() => {
          pushState(next);
        }, 300);
        return next;
      });
    },
    [pushState]
  );

  const setElementsImmediate = useCallback(
    (newElements: LayoutElement[]) => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      pushState(newElements);
    },
    [pushState]
  );

  const undo = useCallback(() => {
    if (indexRef.current > 0) {
      indexRef.current -= 1;
      setElementsInternal(historyRef.current[indexRef.current]);
    }
  }, []);

  const redo = useCallback(() => {
    if (indexRef.current < historyRef.current.length - 1) {
      indexRef.current += 1;
      setElementsInternal(historyRef.current[indexRef.current]);
    }
  }, []);

  const canUndo = indexRef.current > 0;
  const canRedo = indexRef.current < historyRef.current.length - 1;

  const resetHistory = useCallback((newElements: LayoutElement[]) => {
    historyRef.current = [newElements];
    indexRef.current = 0;
    setElementsInternal(newElements);
  }, []);

  return {
    elements,
    setElements,
    setElementsImmediate,
    undo,
    redo,
    canUndo,
    canRedo,
    resetHistory,
  };
}
