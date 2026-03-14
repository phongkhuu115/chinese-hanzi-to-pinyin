import type { HskEntry, VocabularyWord } from "@/types";
import { toPinyin, toPinyinPlain } from "./pinyin";

// ─── HSK Word Pool ────────────────────────────────────────────────────────────
// Primary: drkameleon/complete-hsk-vocabulary — complete.json
// The JSON is an object keyed by hanzi, each value has: simplified, pinyin,
// level, forms[].transcriptions[].pinyin, forms[].meanings[].meaning, etc.
const HSK_POOL_URL =
  "https://raw.githubusercontent.com/drkameleon/complete-hsk-vocabulary/main/complete.json";

// Fallback: ivankra/hsk30 — array of { hanzi, pinyin, english, hsk }
const HSK_FALLBACK_URL =
  "https://raw.githubusercontent.com/ivankra/hsk30/master/data/hsk30.json";

let cachedWordPool: HskEntry[] | null = null;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractEnglish(item: any): string {
  // drkameleon schema: forms[].meanings[].meaning (array of strings)
  if (Array.isArray(item.forms)) {
    const meanings: string[] = [];
    for (const form of item.forms) {
      if (Array.isArray(form.meanings)) {
        for (const m of form.meanings) {
          const text: string =
            typeof m === "string" ? m : (m.meaning ?? m.definition ?? "");
          if (text) meanings.push(text);
        }
      }
    }
    if (meanings.length > 0) return meanings.slice(0, 2).join("; ");
  }
  // flat fields
  const flat =
    item.english ?? item.definition ?? item.meaning ?? item.translations ?? "";
  if (Array.isArray(flat)) return flat.slice(0, 2).join("; ");
  return String(flat ?? "");
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractPinyin(item: any): string {
  if (item.pinyin) return item.pinyin;
  // drkameleon: forms[].transcriptions[].pinyin
  if (Array.isArray(item.forms)) {
    for (const form of item.forms) {
      if (Array.isArray(form.transcriptions)) {
        for (const t of form.transcriptions) {
          if (t.pinyin) return t.pinyin;
        }
      }
    }
  }
  return "";
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractHskLevel(item: any): number {
  if (typeof item.hsk === "number") return item.hsk;
  if (typeof item.level === "number") return item.level;
  // drkameleon: level is array like ["new-1", "old-3"]
  if (Array.isArray(item.level)) {
    const first = String(item.level[0] ?? "");
    const match = first.match(/\d+/);
    if (match) return parseInt(match[0], 10);
  }
  if (typeof item.level === "string") {
    const match = item.level.match(/\d+/);
    if (match) return parseInt(match[0], 10);
  }
  return 1;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseEntries(raw: any): HskEntry[] {
  // drkameleon: object keyed by hanzi
  // ivankra: array
  const items: any[] = Array.isArray(raw) ? raw : Object.values(raw);
  const entries: HskEntry[] = [];

  for (let idx = 0; idx < items.length; idx++) {
    const item = items[idx];
    const hanzi: string =
      item.simplified ?? item.hanzi ?? item.word ?? item.character ?? "";
    if (!hanzi) continue;

    const english = extractEnglish(item);
    const pinyin = extractPinyin(item);
    const hsk = extractHskLevel(item);

    entries.push({ id: String(idx), hanzi, pinyin, english, hsk });
  }
  return entries;
}

export async function fetchWordPool(): Promise<HskEntry[]> {
  if (cachedWordPool) return cachedWordPool;

  for (const url of [HSK_POOL_URL, HSK_FALLBACK_URL]) {
    try {
      const res = await fetch(url);
      if (!res.ok) continue;
      const raw = await res.json();
      const entries = parseEntries(raw);
      if (entries.length > 0) {
        cachedWordPool = entries;
        return entries;
      }
    } catch {
      // try next
    }
  }

  throw new Error(
    "Could not load HSK word pool. Check your internet connection."
  );
}

// ─── Vietnamese Translation via MyMemory ──────────────────────────────────────
// MyMemory is a free translation API — no auth required, works from browser.
// Endpoint: https://api.mymemory.translated.net/get?q=TEXT&langpair=en|vi
const viCache = new Map<string, string>();

export async function translateToVietnamese(english: string): Promise<string> {
  if (!english) return "";

  // Use only the first meaning (before semicolon) to keep translation clean
  const text = english.split(";")[0].trim();
  if (!text) return "";

  if (viCache.has(text)) return viCache.get(text)!;

  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|vi`;
    const res = await fetch(url);
    if (!res.ok) return english; // fallback to English

    const data = await res.json();
    const translated: string =
      data?.responseData?.translatedText ?? "";

    // MyMemory sometimes returns the original if it can't translate
    const result = translated && translated !== text ? translated : english;
    viCache.set(text, result);
    return result;
  } catch {
    return english; // fallback to English on error
  }
}

// ─── Radical decomposition ────────────────────────────────────────────────────
const RADICAL_MAP: Record<string, { meaning: string; pinyin: string }> = {
  一: { meaning: "one", pinyin: "yī" },
  丨: { meaning: "line", pinyin: "gǔn" },
  丶: { meaning: "dot", pinyin: "zhǔ" },
  丿: { meaning: "slash", pinyin: "piě" },
  乙: { meaning: "second", pinyin: "yǐ" },
  二: { meaning: "two", pinyin: "èr" },
  亠: { meaning: "lid", pinyin: "tóu" },
  人: { meaning: "person", pinyin: "rén" },
  儿: { meaning: "legs", pinyin: "ér" },
  入: { meaning: "enter", pinyin: "rù" },
  八: { meaning: "eight", pinyin: "bā" },
  冫: { meaning: "ice", pinyin: "bīng" },
  刀: { meaning: "knife", pinyin: "dāo" },
  力: { meaning: "power", pinyin: "lì" },
  十: { meaning: "ten", pinyin: "shí" },
  厂: { meaning: "cliff", pinyin: "hǎn" },
  又: { meaning: "again", pinyin: "yòu" },
  口: { meaning: "mouth", pinyin: "kǒu" },
  囗: { meaning: "enclosure", pinyin: "wéi" },
  土: { meaning: "earth", pinyin: "tǔ" },
  士: { meaning: "scholar", pinyin: "shì" },
  夕: { meaning: "evening", pinyin: "xī" },
  大: { meaning: "big", pinyin: "dà" },
  女: { meaning: "woman", pinyin: "nǚ" },
  子: { meaning: "child", pinyin: "zǐ" },
  宀: { meaning: "roof", pinyin: "mián" },
  寸: { meaning: "inch", pinyin: "cùn" },
  小: { meaning: "small", pinyin: "xiǎo" },
  尸: { meaning: "corpse", pinyin: "shī" },
  山: { meaning: "mountain", pinyin: "shān" },
  工: { meaning: "work", pinyin: "gōng" },
  己: { meaning: "self", pinyin: "jǐ" },
  巾: { meaning: "cloth", pinyin: "jīn" },
  干: { meaning: "dry", pinyin: "gān" },
  广: { meaning: "shelter", pinyin: "guǎng" },
  弓: { meaning: "bow", pinyin: "gōng" },
  彡: { meaning: "hair", pinyin: "shān" },
  彳: { meaning: "step", pinyin: "chì" },
  心: { meaning: "heart", pinyin: "xīn" },
  戈: { meaning: "spear", pinyin: "gē" },
  户: { meaning: "door", pinyin: "hù" },
  手: { meaning: "hand", pinyin: "shǒu" },
  文: { meaning: "script", pinyin: "wén" },
  斤: { meaning: "axe", pinyin: "jīn" },
  方: { meaning: "square", pinyin: "fāng" },
  日: { meaning: "sun/day", pinyin: "rì" },
  月: { meaning: "moon/month", pinyin: "yuè" },
  木: { meaning: "tree/wood", pinyin: "mù" },
  止: { meaning: "stop", pinyin: "zhǐ" },
  毛: { meaning: "fur", pinyin: "máo" },
  气: { meaning: "steam/air", pinyin: "qì" },
  水: { meaning: "water", pinyin: "shuǐ" },
  火: { meaning: "fire", pinyin: "huǒ" },
  父: { meaning: "father", pinyin: "fù" },
  牛: { meaning: "cow", pinyin: "niú" },
  犬: { meaning: "dog", pinyin: "quǎn" },
  玉: { meaning: "jade", pinyin: "yù" },
  生: { meaning: "life/birth", pinyin: "shēng" },
  用: { meaning: "use", pinyin: "yòng" },
  田: { meaning: "field", pinyin: "tián" },
  白: { meaning: "white", pinyin: "bái" },
  皮: { meaning: "skin", pinyin: "pí" },
  目: { meaning: "eye", pinyin: "mù" },
  石: { meaning: "stone", pinyin: "shí" },
  禾: { meaning: "grain", pinyin: "hé" },
  穴: { meaning: "cave", pinyin: "xué" },
  立: { meaning: "stand", pinyin: "lì" },
  竹: { meaning: "bamboo", pinyin: "zhú" },
  米: { meaning: "rice", pinyin: "mǐ" },
  羊: { meaning: "sheep", pinyin: "yáng" },
  羽: { meaning: "feather", pinyin: "yǔ" },
  老: { meaning: "old", pinyin: "lǎo" },
  耳: { meaning: "ear", pinyin: "ěr" },
  肉: { meaning: "flesh", pinyin: "ròu" },
  自: { meaning: "self", pinyin: "zì" },
  舌: { meaning: "tongue", pinyin: "shé" },
  舟: { meaning: "boat", pinyin: "zhōu" },
  色: { meaning: "color", pinyin: "sè" },
  虫: { meaning: "insect", pinyin: "chóng" },
  血: { meaning: "blood", pinyin: "xuè" },
  行: { meaning: "walk/travel", pinyin: "xíng" },
  衣: { meaning: "clothes", pinyin: "yī" },
  见: { meaning: "see", pinyin: "jiàn" },
  角: { meaning: "horn/angle", pinyin: "jiǎo" },
  言: { meaning: "speech", pinyin: "yán" },
  谷: { meaning: "valley", pinyin: "gǔ" },
  豆: { meaning: "bean", pinyin: "dòu" },
  贝: { meaning: "shell/money", pinyin: "bèi" },
  走: { meaning: "walk/run", pinyin: "zǒu" },
  足: { meaning: "foot", pinyin: "zú" },
  身: { meaning: "body", pinyin: "shēn" },
  车: { meaning: "vehicle", pinyin: "chē" },
  金: { meaning: "metal/gold", pinyin: "jīn" },
  门: { meaning: "gate/door", pinyin: "mén" },
  隹: { meaning: "bird", pinyin: "zhuī" },
  雨: { meaning: "rain", pinyin: "yǔ" },
  青: { meaning: "blue-green", pinyin: "qīng" },
  食: { meaning: "eat/food", pinyin: "shí" },
  首: { meaning: "head", pinyin: "shǒu" },
  香: { meaning: "fragrant", pinyin: "xiāng" },
};

export function getRadicals(hanzi: string): import("@/types").Radical[] {
  const chars = [...hanzi];
  const results: import("@/types").Radical[] = [];
  const seen = new Set<string>();

  for (const char of chars) {
    if (seen.has(char)) continue;
    seen.add(char);
    const info = RADICAL_MAP[char];
    if (info) {
      results.push({ char, meaning: info.meaning, pinyin: info.pinyin });
    }
  }
  return results;
}

// ─── Build a full VocabularyWord ──────────────────────────────────────────────
export async function buildVocabWord(
  entry: HskEntry,
  id: string
): Promise<VocabularyWord> {
  const english = Array.isArray(entry.english)
    ? (entry.english as string[]).join("; ")
    : String(entry.english || "");

  const vietnamese = await translateToVietnamese(english);
  const pinyinResolved = entry.pinyin || toPinyin(entry.hanzi);
  const pinyinPlain = toPinyinPlain(entry.hanzi);
  const radicals = getRadicals(entry.hanzi);

  return {
    id,
    hanzi: entry.hanzi,
    pinyin: pinyinResolved,
    pinyinPlain,
    vietnamese,
    english,
    radicals,
    hskLevel: entry.hsk,
  };
}
