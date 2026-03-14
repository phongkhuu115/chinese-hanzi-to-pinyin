import { useState } from "react";
import { Volume2, ChevronRight, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useVocabulary } from "@/hooks/useVocabulary";
import { speak } from "@/lib/tts";

export function RandomVocabPage() {
  const { word, loading, error, next, poolLoading } = useVocabulary();
  const [revealed, setRevealed] = useState(false);

  function handleNext() {
    setRevealed(false);
    next();
  }

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

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Random Vocab</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Click the card to reveal details
        </p>
      </div>

      {/* Flashcard */}
      <div
        className="w-full max-w-lg cursor-pointer select-none"
        onClick={() => !loading && setRevealed(true)}
      >
        <Card className="min-h-72 transition-all duration-200 hover:shadow-md">
          <CardContent className="flex flex-col items-center justify-center gap-4 py-10 px-8 min-h-72">
            {loading ? (
              <div className="flex flex-col items-center gap-4 w-full">
                <Skeleton className="h-20 w-40 rounded-lg" />
                <Skeleton className="h-5 w-32 rounded" />
                <Skeleton className="h-4 w-48 rounded" />
              </div>
            ) : word ? (
              <>
                {/* Hanzi */}
                <div className="text-8xl font-bold tracking-tight leading-none">
                  {word.hanzi}
                </div>

                {/* HSK badge */}
                <Badge variant="outline" className="text-xs">
                  HSK {word.hskLevel}
                </Badge>

                {/* Audio button — always visible */}
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    speak(word.hanzi);
                  }}
                >
                  <Volume2 className="size-4" />
                  Pronounce
                </Button>

                {/* Revealed details */}
                {revealed && (
                  <>
                    <Separator className="w-full" />

                    {/* Pinyin */}
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                        Pinyin
                      </p>
                      <p className="text-2xl font-medium text-primary">
                        {word.pinyin}
                      </p>
                    </div>

                    {/* Vietnamese */}
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                        Tiếng Việt
                      </p>
                      <p className="text-lg font-medium">{word.vietnamese}</p>
                    </div>

                    {/* English */}
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                        English
                      </p>
                      <p className="text-base text-muted-foreground">
                        {word.english}
                      </p>
                    </div>

                    {/* Radicals */}
                    {word.radicals.length > 0 && (
                      <div className="text-center w-full">
                        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
                          Radical Analysis
                        </p>
                        <div className="flex flex-wrap justify-center gap-2">
                          {word.radicals.map((r, i) => (
                            <div
                              key={i}
                              className="flex flex-col items-center bg-muted rounded-lg px-3 py-2 min-w-12"
                            >
                              <span className="text-xl font-bold">{r.char}</span>
                              <span className="text-xs text-muted-foreground">
                                {r.pinyin}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {r.meaning}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}

                {!revealed && (
                  <p className="text-sm text-muted-foreground animate-pulse">
                    Tap to reveal
                  </p>
                )}
              </>
            ) : null}
          </CardContent>
        </Card>
      </div>

      {/* Next button */}
      <Button
        size="lg"
        onClick={handleNext}
        disabled={loading}
        className="gap-2 min-w-36"
      >
        {loading ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <>
            Next word <ChevronRight className="size-4" />
          </>
        )}
      </Button>
    </div>
  );
}
