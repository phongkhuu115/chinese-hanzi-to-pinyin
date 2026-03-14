export interface Radical {
  char: string;
  meaning: string;
  pinyin: string;
}

export interface VocabularyWord {
  id: string;
  hanzi: string;
  pinyin: string; // with tone marks e.g. "xuéxí"
  pinyinPlain: string; // no tones e.g. "xuexi"
  vietnamese: string;
  english: string;
  radicals: Radical[];
  hskLevel: number;
}

export type TestStatus = "idle" | "running" | "finished";

export interface TestQuestion {
  word: VocabularyWord;
  userAnswer: string;
  isCorrect: boolean | null;
}

// Raw entry from the HSK JSON word pool (fetched from GitHub)
export interface HskEntry {
  id: string;
  hanzi: string;
  pinyin: string;
  english: string | string[];
  hsk: number;
}

