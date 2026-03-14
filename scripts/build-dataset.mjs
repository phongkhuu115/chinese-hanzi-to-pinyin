/**
 * scripts/build-dataset.mjs
 *
 * Fetches the HSK vocabulary from GitHub, translates all English meanings to
 * Vietnamese via MyMemory API, and writes the result to:
 *   src/data/hsk-processed.json
 *
 * Run with:  node scripts/build-dataset.mjs
 *
 * The output is a JSON array of ProcessedEntry objects:
 * {
 *   id: string,
 *   hanzi: string,
 *   pinyin: string,
 *   english: string,
 *   vietnamese: string,
 *   hsk: number
 * }
 */

import { writeFileSync, mkdirSync, existsSync, readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_PATH = join(__dirname, "../src/data/hsk-processed.json");

// ─── Sources ──────────────────────────────────────────────────────────────────
const HSK_POOL_URL =
  "https://raw.githubusercontent.com/drkameleon/complete-hsk-vocabulary/main/complete.json";
const HSK_FALLBACK_URL =
  "https://raw.githubusercontent.com/ivankra/hsk30/master/data/hsk30.json";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function extractEnglish(item) {
  if (Array.isArray(item.forms)) {
    const meanings = [];
    for (const form of item.forms) {
      if (Array.isArray(form.meanings)) {
        for (const m of form.meanings) {
          const text = typeof m === "string" ? m : (m.meaning ?? m.definition ?? "");
          if (text) meanings.push(text);
        }
      }
    }
    if (meanings.length > 0) return meanings.slice(0, 2).join("; ");
  }
  const flat = item.english ?? item.definition ?? item.meaning ?? item.translations ?? "";
  if (Array.isArray(flat)) return flat.slice(0, 2).join("; ");
  return String(flat ?? "");
}

function extractPinyin(item) {
  if (item.pinyin) return item.pinyin;
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

function extractHskLevel(item) {
  if (typeof item.hsk === "number") return item.hsk;
  if (typeof item.level === "number") return item.level;
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

function parseEntries(raw) {
  const items = Array.isArray(raw) ? raw : Object.values(raw);
  const entries = [];
  for (let idx = 0; idx < items.length; idx++) {
    const item = items[idx];
    const hanzi = item.simplified ?? item.hanzi ?? item.word ?? item.character ?? "";
    if (!hanzi) continue;
    entries.push({
      id: String(idx),
      hanzi,
      pinyin: extractPinyin(item),
      english: extractEnglish(item),
      hsk: extractHskLevel(item),
    });
  }
  return entries;
}

// ─── Translation ──────────────────────────────────────────────────────────────
const viCache = new Map();
let apiErrorCount = 0;

// ── Provider 1: MyMemory ──────────────────────────────────────────────────────
async function tryMyMemory(text) {
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|vi`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = await res.json();
  if (data?.responseStatus !== 200) return null;
  const translated = (data?.responseData?.translatedText ?? "").trim();
  return translated || null;
}

// ── Provider 2: Google Translate (unofficial endpoint, no key needed) ─────────
async function tryGoogle(text) {
  const url =
    `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=vi&dt=t&q=${encodeURIComponent(text)}`;
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0" },
  });
  if (!res.ok) return null;
  const data = await res.json();
  // Response shape: [ [ ["translated", "original", ...], ... ], ... ]
  const translated = data?.[0]
    ?.map((chunk) => chunk?.[0])
    .filter(Boolean)
    .join("")
    .trim();
  return translated || null;
}

// ── Provider 3: LibreTranslate public instance ────────────────────────────────
async function tryLibreTranslate(text) {
  const url = "https://libretranslate.com/translate";
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ q: text, source: "en", target: "vi", format: "text" }),
  });
  if (!res.ok) return null;
  const data = await res.json();
  const translated = (data?.translatedText ?? "").trim();
  return translated || null;
}

async function translateOneMeaning(text) {
  const t = text.trim();
  if (!t) return "";
  if (viCache.has(t)) return viCache.get(t);

  const providers = [
    { name: "MyMemory", fn: tryMyMemory },
    { name: "Google", fn: tryGoogle },
    { name: "LibreTranslate", fn: tryLibreTranslate },
  ];

  for (const { name, fn } of providers) {
    try {
      const result = await fn(t);
      if (result) {
        viCache.set(t, result);
        return result;
      }
    } catch {
      // try next provider
    }
    // Small pause before trying next provider
    await new Promise((r) => setTimeout(r, 100));
  }

  // All providers failed — fall back to English
  apiErrorCount++;
  if (apiErrorCount <= 5) {
    console.warn(`\n  ⚠️  All providers failed for: "${t}" — keeping English`);
  }
  return t;
}

// Translates all semicolon-separated meanings in parallel
async function translateToVietnamese(english) {
  if (!english) return "";
  const parts = english.split(";").map((s) => s.trim()).filter(Boolean);
  if (parts.length === 0) return "";
  const translated = await Promise.all(parts.map(translateOneMeaning));
  return translated.join("; ");
}

// Translate entries in parallel batches of `batchSize`, with a delay between batches
async function translateBatch(entries, batchSize = 10, delayMs = 300) {
  const results = new Array(entries.length);
  for (let i = 0; i < entries.length; i += batchSize) {
    const batch = entries.slice(i, i + batchSize);
    const translations = await Promise.all(
      batch.map((e) => translateToVietnamese(e.english))
    );
    translations.forEach((vi, j) => { results[i + j] = vi; });

    const done = Math.min(i + batchSize, entries.length);
    process.stdout.write(
      `\r  Translating... ${done}/${entries.length} (${Math.round((done / entries.length) * 100)}%)  errors: ${apiErrorCount}`
    );

    if (i + batchSize < entries.length) {
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
  console.log();
  return results;
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  // ── Load existing output for resume support ──────────────────────────────
  const existingMap = new Map(); // hanzi → processed entry
  if (existsSync(OUT_PATH)) {
    try {
      const existing = JSON.parse(readFileSync(OUT_PATH, "utf-8"));
      if (Array.isArray(existing)) {
        for (const e of existing) {
          if (!e.hanzi || !e.vietnamese || e.vietnamese === e.english) continue;

          // Re-translate if the English has more meanings than the Vietnamese
          // (i.e. old single-meaning translation — needs refresh)
          const enCount = e.english ? e.english.split(";").length : 0;
          const viCount = e.vietnamese ? e.vietnamese.split(";").length : 0;
          if (enCount > 1 && viCount < enCount) continue; // will re-translate

          existingMap.set(e.hanzi, e);
          // Pre-warm cache for each individual meaning
          if (e.english && e.vietnamese) {
            const enParts = e.english.split(";").map((s) => s.trim());
            const viParts = e.vietnamese.split(";").map((s) => s.trim());
            enParts.forEach((en, i) => {
              if (viParts[i]) viCache.set(en, viParts[i]);
            });
          }
        }
        console.log(`♻️  Resuming — ${existingMap.size} entries already translated, will skip them.`);
      }
    } catch {
      console.log("⚠️  Could not parse existing output, starting fresh.");
    }
  }

  console.log("📥 Fetching HSK vocabulary...");

  let raw = null;
  for (const url of [HSK_POOL_URL, HSK_FALLBACK_URL]) {
    try {
      console.log(`   Trying: ${url}`);
      const res = await fetch(url);
      if (!res.ok) { console.log(`   ✗ HTTP ${res.status}`); continue; }
      raw = await res.json();
      console.log(`   ✓ Fetched`);
      break;
    } catch (e) {
      console.log(`   ✗ ${e.message}`);
    }
  }

  if (!raw) {
    console.error("❌ Could not fetch HSK data. Check your internet connection.");
    process.exit(1);
  }

  console.log("🔍 Parsing entries...");
  const entries = parseEntries(raw);
  console.log(`   Found ${entries.length} entries`);

  // Split into already-done and needs-translation
  const toTranslate = entries.filter((e) => !existingMap.has(e.hanzi));
  const skipped = entries.length - toTranslate.length;

  if (skipped > 0) {
    console.log(`   ⏭️  Skipping ${skipped} already-translated entries`);
  }

  let newTranslations = [];
  if (toTranslate.length > 0) {
    console.log(`🌐 Translating ${toTranslate.length} new entries (English → Vietnamese)...`);
    console.log(`   (10 entries per batch, providers: MyMemory → Google → LibreTranslate)`);
    newTranslations = await translateBatch(toTranslate, 10, 300);
  } else {
    console.log("✨ All entries already translated — nothing to do!");
  }

  // Merge: use existing where available, new translations otherwise
  const processed = entries.map((e) => {
    if (existingMap.has(e.hanzi)) {
      // Keep existing but refresh id/pinyin/english/hsk from source
      const prev = existingMap.get(e.hanzi);
      return { id: e.id, hanzi: e.hanzi, pinyin: e.pinyin || prev.pinyin, english: e.english || prev.english, vietnamese: prev.vietnamese, hsk: e.hsk };
    }
    const newIdx = toTranslate.findIndex((t) => t.id === e.id);
    return {
      id: e.id,
      hanzi: e.hanzi,
      pinyin: e.pinyin,
      english: e.english,
      vietnamese: newTranslations[newIdx] || e.english,
      hsk: e.hsk,
    };
  });

  console.log("💾 Writing output...");
  mkdirSync(join(__dirname, "../src/data"), { recursive: true });
  writeFileSync(OUT_PATH, JSON.stringify(processed, null, 0), "utf-8");

  const sizeKb = Math.round(
    Buffer.byteLength(JSON.stringify(processed)) / 1024
  );
  console.log(`✅ Done! Wrote ${processed.length} entries to src/data/hsk-processed.json (${sizeKb} KB)`);

  // Summary by level
  const byLevel = {};
  for (const e of processed) byLevel[e.hsk] = (byLevel[e.hsk] ?? 0) + 1;
  console.log("\n📊 Words per HSK level:");
  for (const [lvl, count] of Object.entries(byLevel).sort((a, b) => Number(a[0]) - Number(b[0]))) {
    console.log(`   HSK ${lvl}: ${count} words`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
