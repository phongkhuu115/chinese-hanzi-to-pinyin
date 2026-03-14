import { useState, useEffect, useCallback, useRef } from "react";
import { fetchWordPool, buildVocabWord } from "@/lib/api";
import type { HskEntry, VocabularyWord } from "@/types";

interface UseVocabularyOptions {
  hskLevels?: number[]; // filter by HSK level, default all
}

interface UseVocabularyReturn {
  word: VocabularyWord | null;
  loading: boolean;
  error: string | null;
  next: () => void;
  wordPool: HskEntry[];
  poolLoading: boolean;
}

export function useVocabulary(
  options: UseVocabularyOptions = {}
): UseVocabularyReturn {
  const { hskLevels } = options;

  const [wordPool, setWordPool] = useState<HskEntry[]>([]);
  const [poolLoading, setPoolLoading] = useState(true);
  const [word, setWord] = useState<VocabularyWord | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Track which indices have been used to avoid immediate repeats
  const usedIndices = useRef<Set<number>>(new Set());

  // Load word pool on mount
  useEffect(() => {
    fetchWordPool()
      .then((pool) => {
        const filtered = hskLevels?.length
          ? pool.filter((e) => hskLevels.includes(e.hsk))
          : pool;
        setWordPool(filtered);
      })
      .catch((e) => setError(String(e)))
      .finally(() => setPoolLoading(false));
  }, [hskLevels]);

  const pickRandom = useCallback(
    async (pool: HskEntry[]) => {
      if (!pool.length) return;

      // Reset used indices when all words have been shown
      if (usedIndices.current.size >= pool.length) {
        usedIndices.current.clear();
      }

      let idx: number;
      do {
        idx = Math.floor(Math.random() * pool.length);
      } while (usedIndices.current.has(idx));

      usedIndices.current.add(idx);
      const entry = pool[idx];

      setLoading(true);
      setError(null);
      try {
        const built = await buildVocabWord(entry, entry.id);
        setWord(built);
      } catch (e) {
        setError(String(e));
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Load first word once pool is ready
  useEffect(() => {
    if (wordPool.length > 0 && !word && !loading) {
      pickRandom(wordPool);
    }
  }, [wordPool, word, loading, pickRandom]);

  const next = useCallback(() => {
    if (wordPool.length > 0) {
      pickRandom(wordPool);
    }
  }, [wordPool, pickRandom]);

  return { word, loading, error, next, wordPool, poolLoading };
}
