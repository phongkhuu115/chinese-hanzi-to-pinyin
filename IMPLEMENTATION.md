# Chinese Learning App — Implementation Plan

## Overview

A React + Vite + Shadcn/Tailwind web application for learning Chinese (Mandarin), tailored for Vietnamese speakers. The app has three learning modes:

1. **Random Vocab** — Flashcard-based vocabulary review
2. **Pinyin Assertion** — Endless pinyin input practice
3. **Test** — Random quiz with up to 20 words

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 + Vite |
| UI Components | Shadcn/ui + Tailwind CSS v4 |
| Routing | React Router v6 |
| Pinyin Processing | `pinyin-pro` (npm) |
| Audio | Web Speech API (`SpeechSynthesis`) |
| Storage | `sessionStorage` (visited words) |
| Data | Curated local JSON vocabulary list |
| Dictionary API | `dict.minhqnd.com` (Chinese → Vietnamese lookup) |

---

## API Strategy

### Primary: `dict.minhqnd.com`
- Endpoint: `GET https://dict.minhqnd.com/api/v1/lookup?word=<hanzi>&lang=zh&def_lang=vi`
- Returns: Vietnamese meanings, pronunciations, audio URL
- Used for: Vietnamese definitions, supplemental data

### Pinyin: `pinyin-pro` (npm package)
- Converts Hanzi → Pinyin with tone marks
- Supports tone normalization for input comparison
- Radical decomposition via `pinyin-pro/data`

### Audio: Web Speech API
- `window.speechSynthesis.speak()` with `lang: 'zh-CN'`
- No external API needed, works offline
- Fallback: `dict.minhqnd.com` audio URL if available

---

## Project Structure

```
src/
├── components/
│   ├── ui/                        # Shadcn components (existing)
│   ├── theme-provider.tsx         # Existing
│   ├── layout/
│   │   └── AppLayout.tsx          # Navigation + layout wrapper
│   ├── vocab/
│   │   └── VocabFlashcard.tsx     # Flashcard component
│   ├── pinyin/
│   │   └── PinyinInput.tsx        # Pinyin input + validation
│   └── test/
│       └── TestBuilder.tsx        # Test creation + quiz
├── pages/
│   ├── HomePage.tsx               # Landing page
│   ├── RandomVocabPage.tsx        # Route: /vocab
│   ├── PinyinAssertionPage.tsx    # Route: /pinyin
│   └── TestPage.tsx               # Route: /test
├── data/
│   └── vocabulary.ts              # Curated word list (100+ words)
├── hooks/
│   ├── useVocabulary.ts           # Word selection logic
│   └── useSessionStorage.ts       # sessionStorage helpers
├── lib/
│   ├── utils.ts                   # Existing
│   ├── pinyin.ts                  # Pinyin utilities
│   └── tts.ts                     # Text-to-speech helpers
├── types/
│   └── index.ts                   # TypeScript interfaces
├── App.tsx
└── main.tsx
```

---

## Data Model

```typescript
interface VocabularyWord {
  id: string;
  hanzi: string;           // e.g. "学习"
  pinyin: string;          // e.g. "xuéxí"
  pinyinNormalized: string; // e.g. "xuexi" (for comparison)
  vietnamese: string;      // e.g. "học tập"
  english: string;         // e.g. "to study"
  radicals: Radical[];     // e.g. [{char: "子", meaning: "child"}]
  hskLevel: number;        // HSK 1-6
  category: string;        // e.g. "education"
}

interface Radical {
  char: string;
  meaning: string;
  pinyin: string;
}
```

---

## Route Breakdown

### 1. `/vocab` — Random Vocabulary Flashcard

**Behavior:**
- Show a random word from the vocabulary list
- Flashcard displays: Hanzi (large), Pinyin, Vietnamese meaning, English meaning, Radical breakdown
- 🔊 Sound button: plays pronunciation via Web Speech API
- "Next" button: loads another random word
- Words are not tracked (free exploration)

**Components:**
- `VocabFlashcard` — card with flip animation
- `AudioButton` — triggers TTS

**UI Elements (Shadcn):**
- `Card`, `CardContent`, `CardHeader`
- `Button`, `Badge`, `Separator`

---

### 2. `/pinyin` — Pinyin Assertion

**Behavior:**
- Show a random Hanzi word
- User types pinyin (with or without tone marks)
- On submit: validate and show correct/incorrect feedback
- Move to next word automatically (or on button click)
- **Never repeat** a word in the same session (sessionStorage)
- When all words are exhausted, show completion message and offer reset

**Pinyin Validation:**
- Accept both `xuéxí` and `xuexi` (tone-insensitive mode)
- Accept both `xue2xi2` (tone number) and `xuéxí` (tone mark)
- Normalize before comparison

**SessionStorage:**
- Key: `pinyin-visited-words`
- Value: JSON array of word IDs

**Components:**
- `PinyinInput` — input field with validation state
- Progress counter: "X / Y words remaining"

**UI Elements (Shadcn):**
- `Input`, `Button`, `Alert`, `Badge`, `Progress`

---

### 3. `/test` — Random Test

**Behavior:**
- Landing: "Create Test" button + optional word count selector (5–20)
- On create: randomly select N words
- Show questions one by one: Hanzi → user inputs pinyin
- At the end: show score (X/N correct), review answers
- Option to retake or create new test

**Scoring:**
- Tone-insensitive comparison (same as Pinyin Assertion)
- Show correct answer for wrong responses

**UI Elements (Shadcn):**
- `Dialog` or inline form for test creation
- `Progress` bar during test
- `Table` or card list for results review
- `Badge` for correct/incorrect indicators

---

## SessionStorage Schema

```json
{
  "pinyin-visited-words": ["word-001", "word-042", "word-017"]
}
```

---

## Vocabulary Data

The app ships with a curated list of ~100 common Chinese words (HSK 1–3 level), covering:
- Greetings & basics
- Numbers & time
- Family & people
- Food & daily life
- Actions & verbs
- Places & travel

Each word includes: hanzi, pinyin, Vietnamese meaning, English meaning, and radical breakdown.

---

## Audio / TTS

```typescript
function speak(text: string) {
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'zh-CN';
  utterance.rate = 0.8;
  window.speechSynthesis.speak(utterance);
}
```

---

## Pinyin Normalization

```typescript
// Strip tone marks for comparison
function normalizePinyin(pinyin: string): string {
  return pinyin
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, '');
}
```

---

## Implementation Phases

### Phase 1 — Foundation ✅
- [x] Project already set up (Vite + React + Shadcn)
- [ ] Install `react-router-dom`, `pinyin-pro`
- [ ] Create types, vocabulary data, utility files

### Phase 2 — Core Pages
- [ ] `AppLayout` with navigation
- [ ] `HomePage` landing
- [ ] `RandomVocabPage` with flashcard
- [ ] `PinyinAssertionPage` with input + sessionStorage
- [ ] `TestPage` with builder + quiz + results

### Phase 3 — Polish
- [ ] Loading states, error boundaries
- [ ] Responsive design (mobile-first)
- [ ] Animations (card flip, transitions)
- [ ] Dark mode support (already configured)

---

## Dependencies to Install

```bash
pnpm add react-router-dom pinyin-pro
```

---

## Notes

- No backend required — all data is local + optional API enrichment
- `pinyin-pro` handles both Hanzi→Pinyin conversion and tone normalization
- Web Speech API is available in all modern browsers
- The vocabulary list is the single source of truth; API calls are optional enrichment
