import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, BookMarked, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { fetchWordPool } from "@/lib/api";

const LEVEL_META: Record<
  number,
  { label: string; description: string; color: string; bg: string; border: string }
> = {
  1: {
    label: "HSK 1",
    description: "150 basic words — greetings, numbers, family",
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-950/40",
    border: "border-emerald-200 dark:border-emerald-800",
  },
  2: {
    label: "HSK 2",
    description: "300 words — daily life, simple conversations",
    color: "text-sky-600 dark:text-sky-400",
    bg: "bg-sky-50 dark:bg-sky-950/40",
    border: "border-sky-200 dark:border-sky-800",
  },
  3: {
    label: "HSK 3",
    description: "600 words — travel, work, social topics",
    color: "text-violet-600 dark:text-violet-400",
    bg: "bg-violet-50 dark:bg-violet-950/40",
    border: "border-violet-200 dark:border-violet-800",
  },
  4: {
    label: "HSK 4",
    description: "1200 words — news, opinions, abstract topics",
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-950/40",
    border: "border-amber-200 dark:border-amber-800",
  },
  5: {
    label: "HSK 5",
    description: "2500 words — literature, professional use",
    color: "text-orange-600 dark:text-orange-400",
    bg: "bg-orange-50 dark:bg-orange-950/40",
    border: "border-orange-200 dark:border-orange-800",
  },
  6: {
    label: "HSK 6",
    description: "5000 words — near-native fluency",
    color: "text-rose-600 dark:text-rose-400",
    bg: "bg-rose-50 dark:bg-rose-950/40",
    border: "border-rose-200 dark:border-rose-800",
  },
  7: {
    label: "HSK 7",
    description: "Advanced — academic & professional mastery",
    color: "text-fuchsia-600 dark:text-fuchsia-400",
    bg: "bg-fuchsia-50 dark:bg-fuchsia-950/40",
    border: "border-fuchsia-200 dark:border-fuchsia-800",
  },
};

export function HskLevelsPage() {
  const navigate = useNavigate();
  const [counts, setCounts] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchWordPool()
      .then((pool) => {
        const c: Record<number, number> = {};
        for (const entry of pool) {
          c[entry.hsk] = (c[entry.hsk] ?? 0) + 1;
        }
        setCounts(c);
      })
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false));
  }, []);

  const levels = Object.keys(LEVEL_META).map(Number);

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl font-bold">HSK Vocabulary</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Browse all words by HSK level
        </p>
      </div>

      {loading && (
        <div className="flex justify-center py-16">
          <Loader2 className="size-7 animate-spin text-muted-foreground" />
        </div>
      )}

      {error && (
        <p className="text-center text-destructive text-sm">{error}</p>
      )}

      {!loading && !error && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {levels.map((level) => {
            const meta = LEVEL_META[level];
            const count = counts[level];
            if (!count) return null; // skip levels with no data

            return (
              <Card
                key={level}
                onClick={() => navigate(`/vocab-list/${level}`)}
                className={`cursor-pointer border-2 transition-all hover:shadow-lg hover:-translate-y-0.5 ${meta.border}`}
              >
                <CardContent className="flex items-center gap-4 p-5">
                  {/* Icon */}
                  <div
                    className={`size-12 rounded-xl ${meta.bg} flex items-center justify-center shrink-0`}
                  >
                    <BookMarked className={`size-6 ${meta.color}`} />
                  </div>

                  {/* Text */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className={`font-bold text-lg ${meta.color}`}>
                        {meta.label}
                      </span>
                      <Badge variant="secondary" className="text-xs">
                        {count.toLocaleString()} words
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground leading-snug">
                      {meta.description}
                    </p>
                  </div>

                  <ChevronRight className="size-4 text-muted-foreground shrink-0" />
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
