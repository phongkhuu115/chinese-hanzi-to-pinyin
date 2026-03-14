import { useState, useEffect, useRef, useCallback } from "react";
import {
  CheckCircle2,
  XCircle,
  ChevronRight,
  Loader2,
  RefreshCw,
  Volume2,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchWordPool, buildVocabWord } from "@/lib/api";
import { isPinyinCorrect } from "@/lib/pinyin";
import { speak } from "@/lib/tts";
import { useVisitedWords } from "@/hooks/useSessionStorage";
import type { HskEntry, VocabularyWord } from "@/types";

type FeedbackState = "idle" | "correct" | "wrong";

export function PinyinAssertionPage() {
  const [pool, setPool] = useState<HskEntry[]>([]);
  const [poolLoading, setPoolLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentWord, setCurrentWord] = useState<VocabularyWord | null>(null);
  const [wordLoading, setWordLoading] = useState(false);

  const [input, setInput] = useState("");
  const [feedback, setFeedback] = useState<FeedbackState>("idle");
  const [allDone, setAllDone] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const { getVisited, markVisited, resetVisited, visitedCount } =
    useVisitedWords();

  // Load pool
  useEffect(() => {
    fetchWordPool()
      .then(setPool)
      .catch((e) => setError(String(e)))
      .finally(() => setPoolLoading(false));
  }, []);

  const pickNext = useCallback(
    async (currentPool: HskEntry[]) => {
      const visited = getVisited();
      const remaining = currentPool.filter((e) => !visited.includes(e.id));

      if (remaining.length === 0) {
        setAllDone(true);
        return;
      }

      const idx = Math.floor(Math.random() * remaining.length);
      const entry = remaining[idx];

      setWordLoading(true);
      setFeedback("idle");
      setInput("");
      try {
        const word = await buildVocabWord(entry, entry.id);
        setCurrentWord(word);
        setTimeout(() => inputRef.current?.focus(), 100);
      } catch (e) {
        setError(String(e));
      } finally {
        setWordLoading(false);
      }
    },
    [getVisited]
  );

  // Load first word once pool is ready
  useEffect(() => {
    if (pool.length > 0 && !currentWord && !wordLoading) {
      pickNext(pool);
    }
  }, [pool, currentWord, wordLoading, pickNext]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!currentWord || feedback !== "idle" || !input.trim()) return;

    const correct = isPinyinCorrect(input.trim(), currentWord.pinyin);
    setFeedback(correct ? "correct" : "wrong");
    markVisited(currentWord.id);
  }

  function handleNext() {
    setFeedback("idle");
    setInput("");
    pickNext(pool);
  }

  function handleReset() {
    resetVisited();
    setAllDone(false);
    setCurrentWord(null);
    setFeedback("idle");
    setInput("");
    pickNext(pool);
  }

  const visited = visitedCount();
  const total = pool.length;
  const progress = total > 0 ? Math.round((visited / total) * 100) : 0;

  if (poolLoading) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
        <p className="text-muted-foreground text-sm">Loading word pool…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
        <p className="text-destructive font-medium">Failed to load vocabulary</p>
        <p className="text-muted-foreground text-sm max-w-sm">{error}</p>
        <Button variant="outline" onClick={() => window.location.reload()}>
          <RefreshCw className="size-4 mr-2" /> Retry
        </Button>
      </div>
    );
  }

  if (allDone) {
    return (
      <div className="flex flex-col items-center justify-center gap-6 py-24 text-center">
        <div className="text-6xl">🎉</div>
        <h2 className="text-2xl font-bold">All words completed!</h2>
        <p className="text-muted-foreground">
          You've practiced all {total} words in this session.
        </p>
        <Button onClick={handleReset} className="gap-2">
          <RotateCcw className="size-4" /> Start over
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Pinyin Practice</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Type the pinyin for each word
        </p>
      </div>

      {/* Progress */}
      <div className="w-full max-w-lg space-y-1.5">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{visited} practiced</span>
          <span>{total - visited} remaining</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Card */}
      <Card className="w-full max-w-lg">
        <CardContent className="flex flex-col items-center gap-6 py-10 px-8">
          {wordLoading ? (
            <div className="flex flex-col items-center gap-4 w-full">
              <Skeleton className="h-24 w-36 rounded-lg" />
              <Skeleton className="h-10 w-full rounded-lg" />
            </div>
          ) : currentWord ? (
            <>
              {/* Hanzi */}
              <div className="flex flex-col items-center gap-2">
                <div className="text-8xl font-bold leading-none">
                  {currentWord.hanzi}
                </div>
                <Badge variant="outline" className="text-xs">
                  HSK {currentWord.hskLevel}
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1.5 text-muted-foreground"
                  onClick={() => speak(currentWord.hanzi)}
                >
                  <Volume2 className="size-3.5" />
                  Listen
                </Button>
              </div>

              {/* Input form */}
              <form onSubmit={handleSubmit} className="w-full space-y-3">
                <Input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type pinyin here… (e.g. xuéxí or xuexi)"
                  disabled={feedback !== "idle"}
                  className={
                    feedback === "correct"
                      ? "border-green-500 focus-visible:ring-green-500"
                      : feedback === "wrong"
                        ? "border-destructive focus-visible:ring-destructive"
                        : ""
                  }
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck={false}
                />
                {feedback === "idle" && (
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={!input.trim()}
                  >
                    Check
                  </Button>
                )}
              </form>

              {/* Feedback */}
              {feedback === "correct" && (
                <div className="flex flex-col items-center gap-2 text-center">
                  <div className="flex items-center gap-2 text-green-600 dark:text-green-400 font-semibold">
                    <CheckCircle2 className="size-5" />
                    Correct!
                  </div>
                  <p className="text-muted-foreground text-sm">
                    {currentWord.pinyin} — {currentWord.vietnamese}
                  </p>
                  <Button onClick={handleNext} className="gap-2 mt-1">
                    Next <ChevronRight className="size-4" />
                  </Button>
                </div>
              )}

              {feedback === "wrong" && (
                <div className="flex flex-col items-center gap-2 text-center">
                  <div className="flex items-center gap-2 text-destructive font-semibold">
                    <XCircle className="size-5" />
                    Not quite
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Correct answer:{" "}
                    <span className="font-semibold text-foreground">
                      {currentWord.pinyin}
                    </span>
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {currentWord.vietnamese}
                  </p>
                  <Button onClick={handleNext} variant="outline" className="gap-2 mt-1">
                    Next <ChevronRight className="size-4" />
                  </Button>
                </div>
              )}
            </>
          ) : null}
        </CardContent>
      </Card>

      {/* Reset session */}
      {visited > 0 && (
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground gap-1.5"
          onClick={handleReset}
        >
          <RotateCcw className="size-3.5" /> Reset session
        </Button>
      )}
    </div>
  );
}
