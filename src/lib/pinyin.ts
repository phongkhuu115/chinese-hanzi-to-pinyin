import { pinyin } from "pinyin-pro";

/**
 * Convert hanzi to pinyin with tone marks, e.g. "学习" → "xuéxí"
 */
export function toPinyin(hanzi: string): string {
  return pinyin(hanzi, { toneType: "symbol", separator: "" });
}

/**
 * Convert hanzi to plain pinyin (no tones), e.g. "学习" → "xuexi"
 */
export function toPinyinPlain(hanzi: string): string {
  return pinyin(hanzi, { toneType: "none", separator: "" });
}

/**
 * Normalize a pinyin string for comparison:
 * - strip tone marks (NFD decomposition)
 * - strip tone numbers (1-5)
 * - lowercase, no spaces
 */
export function normalizePinyin(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // strip diacritics
    .replace(/[1-5]/g, "") // strip tone numbers
    .toLowerCase()
    .replace(/\s+/g, "")
    .trim();
}

/**
 * Check if user's pinyin answer matches the correct pinyin.
 * Accepts tone marks, tone numbers, or no tones.
 */
export function isPinyinCorrect(
  userInput: string,
  correctPinyin: string
): boolean {
  return normalizePinyin(userInput) === normalizePinyin(correctPinyin);
}
