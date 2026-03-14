import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Loader2, ArrowLeft, Volume2, Search, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { fetchWordPool } from "@/lib/api";
import { toPinyin } from "@/lib/pinyin";
import { speak } from "@/lib/tts";
import type { HskEntry } from "@/types";

const LEVEL_COLORS: Record<number, string> = {
  1: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  2: "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300",
  3: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
  4: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  5: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
  6: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
  7: "bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-900/40 dark:text-fuchsia-300",
};

export function HskVocabListPage() {
  const { level } = useParams<{ level: string }>();
  const navigate = useNavigate();
  const hskLevel = Number(level ?? 1);

  const [allEntries, setAllEntries] = useState<HskEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    setLoading(true);
    fetchWordPool()
      .then((pool) => {
        setAllEntries(pool.filter((e) => e.hsk === hskLevel));
      })
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false));
  }, [hskLevel]);

  const filtered = useMemo(() => {
    if (!search.trim()) return allEntries;
    const q = search.trim().toLowerCase();
    return allEntries.filter(
      (e) =>
        e.hanzi.includes(q) ||
        e.pinyin.toLowerCase().includes(q) ||
        String(e.english).toLowerCase().includes(q)
    );
  }, [allEntries, search]);

  const levelColor = LEVEL_COLORS[hskLevel] ?? LEVEL_COLORS[1];

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/vocab-list")}
          className="shrink-0"
        >
          <ArrowLeft className="size-4" />
        </Button>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">HSK {hskLevel}</h1>
            {!loading && (
              <Badge variant="secondary">
                {allEntries.length.toLocaleString()} words
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground text-sm">
            Click any card to hear pronunciation
          </p>
        </div>
      </div>

      {/* Search */}
      {!loading && allEntries.length > 0 && (
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search hanzi, pinyin, or meaning…"
            className="pl-9 pr-9"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-16">
          <Loader2 className="size-7 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Error */}
      {error && (
        <p className="text-center text-destructive text-sm">{error}</p>
      )}

      {/* Results count when filtering */}
      {!loading && search && (
        <p className="text-sm text-muted-foreground">
          {filtered.length} result{filtered.length !== 1 ? "s" : ""} for &ldquo;{search}&rdquo;
        </p>
      )}

      {/* Word grid */}
      {!loading && !error && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {filtered.map((entry) => {
            const pinyin = entry.pinyin || toPinyin(entry.hanzi);
            const english = Array.isArray(entry.english)
              ? (entry.english as string[]).join(", ")
              : String(entry.english || "");

            return (
              <Card
                key={entry.id}
                onClick={() => speak(entry.hanzi)}
                className="cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all group"
              >
                <CardContent className="flex flex-col items-center gap-1.5 p-4 text-center">
                  {/* Hanzi */}
                  <div className="text-3xl font-bold leading-none group-hover:scale-110 transition-transform">
                    {entry.hanzi}
                  </div>

                  {/* Pinyin */}
                  <div className="text-xs font-medium text-primary">
                    {pinyin}
                  </div>

                  {/* English meaning */}
                  <div className="text-xs text-muted-foreground line-clamp-2 leading-snug">
                    {english || "—"}
                  </div>

                  {/* HSK badge + audio icon */}
                  <div className="flex items-center gap-1.5 mt-1">
                    <span
                      className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${levelColor}`}
                    >
                      HSK {hskLevel}
                    </span>
                    <Volume2 className="size-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {filtered.length === 0 && !loading && (
            <div className="col-span-full text-center py-12 text-muted-foreground text-sm">
              No words found for &ldquo;{search}&rdquo;
            </div>
          )}
        </div>
      )}
    </div>
  );
}
