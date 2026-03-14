import { useCallback } from "react";

const VISITED_KEY = "pinyin-visited-words";

export function useVisitedWords() {
  const getVisited = useCallback((): string[] => {
    try {
      const raw = sessionStorage.getItem(VISITED_KEY);
      return raw ? (JSON.parse(raw) as string[]) : [];
    } catch {
      return [];
    }
  }, []);

  const markVisited = useCallback((wordId: string) => {
    const visited = (() => {
      try {
        const raw = sessionStorage.getItem(VISITED_KEY);
        return raw ? (JSON.parse(raw) as string[]) : [];
      } catch {
        return [];
      }
    })();

    if (!visited.includes(wordId)) {
      visited.push(wordId);
      sessionStorage.setItem(VISITED_KEY, JSON.stringify(visited));
    }
  }, []);

  const resetVisited = useCallback(() => {
    sessionStorage.removeItem(VISITED_KEY);
  }, []);

  const isVisited = useCallback(
    (wordId: string): boolean => {
      return getVisited().includes(wordId);
    },
    [getVisited]
  );

  const visitedCount = useCallback((): number => {
    return getVisited().length;
  }, [getVisited]);

  return { getVisited, markVisited, resetVisited, isVisited, visitedCount };
}
