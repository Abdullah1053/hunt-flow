import { useState, useRef, useCallback, useEffect } from 'react';

export interface UseHistoryStateOptions {
  maxHistory?: number;
  debounceMs?: number;
}

export interface UseHistoryStateReturn<T> {
  state: T;
  set: (nextState: T, isDiscrete?: boolean) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  pastCount: number;
  futureCount: number;
  reset: (newPresent: T) => void;
}

/**
 * Custom hook managing undo/redo history with a snapshot stack.
 * Rapid edits (e.g., text typing) are debounced so typing characters doesn't
 * generate individual undo steps. Discrete actions (e.g. adding items, deleting,
 * toggling visibility) push to history immediately.
 */
export function useHistoryState<T>(
  initialPresent: T,
  options: UseHistoryStateOptions = {}
): UseHistoryStateReturn<T> {
  const { maxHistory = 50, debounceMs = 400 } = options;

  const [history, setHistory] = useState<{
    past: T[];
    present: T;
    future: T[];
  }>({
    past: [],
    present: initialPresent,
    future: [],
  });

  // Reference to current present state to access inside timeouts and callbacks
  const presentRef = useRef<T>(history.present);
  presentRef.current = history.present;

  // Track the snapshot that represents the state before rapid continuous changes started
  const debounceBaselineRef = useRef<T | null>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const commitDebouncedChange = useCallback(
    (baseline: T, finalState: T) => {
      setHistory((prev) => {
        // Only push to past if state actually changed from the baseline
        const newPast = [...prev.past, baseline].slice(-maxHistory);
        return {
          past: newPast,
          present: finalState,
          future: [],
        };
      });
      debounceBaselineRef.current = null;
    },
    [maxHistory]
  );

  const set = useCallback(
    (nextState: T, isDiscrete: boolean = false) => {
      if (isDiscrete) {
        // If there was a pending debounced edit, clear it and push the baseline if needed
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
          debounceTimerRef.current = null;
          if (debounceBaselineRef.current !== null) {
            const baseline = debounceBaselineRef.current;
            debounceBaselineRef.current = null;
            setHistory((prev) => {
              const newPast = [...prev.past, baseline, prev.present].slice(-maxHistory);
              return {
                past: newPast,
                present: nextState,
                future: [],
              };
            });
            return;
          }
        }

        // Standard discrete push
        setHistory((prev) => {
          const newPast = [...prev.past, prev.present].slice(-maxHistory);
          return {
            past: newPast,
            present: nextState,
            future: [],
          };
        });
      } else {
        // Continuous edit (e.g. typing)
        if (debounceBaselineRef.current === null) {
          debounceBaselineRef.current = presentRef.current;
        }

        // Update present immediately for responsive typing
        setHistory((prev) => ({
          ...prev,
          present: nextState,
          future: [],
        }));

        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
        }

        debounceTimerRef.current = setTimeout(() => {
          if (debounceBaselineRef.current !== null) {
            commitDebouncedChange(debounceBaselineRef.current, nextState);
          }
          debounceTimerRef.current = null;
        }, debounceMs);
      }
    },
    [commitDebouncedChange, debounceMs, maxHistory]
  );

  const undo = useCallback(() => {
    // If a debounce is pending, flush it or cancel it before undoing
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
      if (debounceBaselineRef.current !== null) {
        const baseline = debounceBaselineRef.current;
        debounceBaselineRef.current = null;
        // Revert straight to baseline
        setHistory((prev) => ({
          past: prev.past,
          present: baseline,
          future: [prev.present, ...prev.future].slice(0, maxHistory),
        }));
        return;
      }
    }

    setHistory((prev) => {
      if (prev.past.length === 0) return prev;
      const previous = prev.past[prev.past.length - 1];
      const newPast = prev.past.slice(0, prev.past.length - 1);
      return {
        past: newPast,
        present: previous,
        future: [prev.present, ...prev.future].slice(0, maxHistory),
      };
    });
  }, [maxHistory]);

  const redo = useCallback(() => {
    // If a debounce is pending, clear it
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
      debounceBaselineRef.current = null;
    }

    setHistory((prev) => {
      if (prev.future.length === 0) return prev;
      const next = prev.future[0];
      const newFuture = prev.future.slice(1);
      return {
        past: [...prev.past, prev.present].slice(-maxHistory),
        present: next,
        future: newFuture,
      };
    });
  }, [maxHistory]);

  const reset = useCallback((newPresent: T) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    debounceBaselineRef.current = null;
    setHistory({
      past: [],
      present: newPresent,
      future: [],
    });
  }, []);

  return {
    state: history.present,
    set,
    undo,
    redo,
    canUndo: history.past.length > 0 || debounceBaselineRef.current !== null,
    canRedo: history.future.length > 0,
    pastCount: history.past.length,
    futureCount: history.future.length,
    reset,
  };
}

