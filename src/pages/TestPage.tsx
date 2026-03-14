import { useState, useRef } from "react";
import {
  ClipboardList,
  Loader2,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Volume2,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { fetchWordPool, buildVocabWord } from "@/lib/api";
import { isPinyinCorrect } from "@/lib/pinyin";
import { speak } from "@/lib/tts";
import type { VocabularyWord, TestStatus, TestQuestion } from "@/types";

const WORD_COUNT_OPTIONS = [5, 10, 15, 20];

export function TestPage() {
  const [status, setStatus] = useState<TestStatus>("idle");
  const [wordCount, setWordCount] = useState(10);
  const [building, setBuilding] = useState(false);
  const [buildError, setBuildError] = useState<string | null>(null);

  const [questions, setQuestions] = useState<TestQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [inputValue, setInputValue] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  async function handleCreateTest() {
    setBuilding(true);
    setBuildError(null);
    try {
      const pool = fetchWordPool();
      // Pick random unique indices
      const indices = new Set<number>();
      while (indices.size < Math.min(wordCount, pool.length)) {
        indices.add(Math.floor(Math.random() * pool.length));
      }

      // Build vocab words (synchronous now)
      const words: VocabularyWord[] = [...indices].map((i) =>
        buildVocabWord(pool[i], pool[i].id)
      );

      const qs: TestQuestion[] = words.map((w) => ({
        word: w,
        userAnswer: "",
        isCorrect: null,
      }));

      setQuestions(qs);
      setCurrentIdx(0);
      setInputValue("");
      setSubmitted(false);
      setStatus("running");
      setTimeout(() => inputRef.current?.focus(), 100);
    } catch (e) {
      setBuildError(String(e));
    } finally {
      setBuilding(false);
    }
  }

  function handleSubmitAnswer(e: React.FormEvent) {
    e.preventDefault();
    if (submitted || !inputValue.trim()) return;

    const current = questions[currentIdx];
    const correct = isPinyinCorrect(inputValue.trim(), current.word.pinyin);

    setQuestions((prev) =>
      prev.map((q, i) =>
        i === currentIdx
          ? { ...q, userAnswer: inputValue.trim(), isCorrect: correct }
          : q
      )
    );
    setSubmitted(true);
  }

  function handleNext() {
    if (currentIdx + 1 >= questions.length) {
      setStatus("finished");
    } else {
      setCurrentIdx((i) => i + 1);
      setInputValue("");
      setSubmitted(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }

  function handleRetake() {
    setStatus("idle");
    setQuestions([]);
    setCurrentIdx(0);
    setInputValue("");
    setSubmitted(false);
  }

  const score = questions.filter((q) => q.isCorrect === true).length;

  // ─── Idle ──────────────────────────────────────────────────────────────────
  if (status === "idle") {
    return (
      <div className="flex flex-col items-center gap-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Test Mode</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Create a random test and practice your pinyin
          </p>
        </div>

        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ClipboardList className="size-5" />
              Create a new test
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Word count selector */}
            <div className="space-y-2">
              <p className="text-sm font-medium">Number of words</p>
              <div className="flex gap-2">
                {WORD_COUNT_OPTIONS.map((n) => (
                  <Button
                    key={n}
                    variant={wordCount === n ? "default" : "outline"}
                    size="sm"
                    className="flex-1"
                    onClick={() => setWordCount(n)}
                  >
                    {n}
                  </Button>
                ))}
              </div>
            </div>

            {buildError && (
              <p className="text-sm text-destructive">{buildError}</p>
            )}

            <Button
              className="w-full gap-2"
              onClick={handleCreateTest}
              disabled={building}
              size="lg"
            >
              {building ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Building test…
                </>
              ) : (
                <>
                  <ClipboardList className="size-4" />
                  Start Test ({wordCount} words)
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ─── Running ───────────────────────────────────────────────────────────────
  if (status === "running") {
    const current = questions[currentIdx];
    const progress = Math.round(((currentIdx) / questions.length) * 100);

    return (
      <div className="flex flex-col items-center gap-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Test in Progress</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Question {currentIdx + 1} of {questions.length}
          </p>
        </div>

        {/* Progress */}
        <div className="w-full max-w-lg space-y-1.5">
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{currentIdx} answered</span>
            <span>{questions.length - currentIdx} remaining</span>
          </div>
        </div>

        {/* Question card */}
        <Card className="w-full max-w-lg">
          <CardContent className="flex flex-col items-center gap-6 py-10 px-8">
            {/* Hanzi */}
            <div className="flex flex-col items-center gap-2">
              <div className="text-8xl font-bold leading-none">
                {current.word.hanzi}
              </div>
              <Badge variant="outline" className="text-xs">
                HSK {current.word.hskLevel}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5 text-muted-foreground"
                onClick={() => speak(current.word.hanzi)}
              >
                <Volume2 className="size-3.5" />
                Listen
              </Button>
            </div>

            {/* Input */}
            <form onSubmit={handleSubmitAnswer} className="w-full space-y-3">
              <Input
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Type pinyin… (e.g. nǐ hǎo or ni hao)"
                disabled={submitted}
                className={
                  submitted
                    ? current.isCorrect
                      ? "border-green-500"
                      : "border-destructive"
                    : ""
                }
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
              />
              {!submitted && (
                <Button
                  type="submit"
                  className="w-full"
                  disabled={!inputValue.trim()}
                >
                  Submit
                </Button>
              )}
            </form>

            {/* Feedback */}
            {submitted && (
              <div className="flex flex-col items-center gap-2 text-center">
                {current.isCorrect ? (
                  <div className="flex items-center gap-2 text-green-600 dark:text-green-400 font-semibold">
                    <CheckCircle2 className="size-5" />
                    Correct!
                  </div>
                ) : (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-destructive font-semibold justify-center">
                      <XCircle className="size-5" />
                      Incorrect
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Correct:{" "}
                      <span className="font-semibold text-foreground">
                        {current.word.pinyin}
                      </span>
                    </p>
                  </div>
                )}
                <p className="text-sm text-muted-foreground">
                  {current.word.vietnamese}
                </p>
                <Button onClick={handleNext} className="gap-2 mt-1">
                  {currentIdx + 1 >= questions.length ? (
                    "See Results"
                  ) : (
                    <>
                      Next <ChevronRight className="size-4" />
                    </>
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // ─── Finished ──────────────────────────────────────────────────────────────
  const percentage = Math.round((score / questions.length) * 100);
  const grade =
    percentage >= 90
      ? "Excellent! 🏆"
      : percentage >= 70
        ? "Good job! 👍"
        : percentage >= 50
          ? "Keep practicing! 💪"
          : "Don't give up! 📚";

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Test Results</h1>
        <p className="text-muted-foreground text-sm mt-1">{grade}</p>
      </div>

      {/* Score card */}
      <Card className="w-full max-w-lg">
        <CardContent className="flex flex-col items-center gap-4 py-8">
          <div className="text-6xl font-bold">
            {score}
            <span className="text-3xl text-muted-foreground font-normal">
              /{questions.length}
            </span>
          </div>
          <Progress value={percentage} className="w-full h-3" />
          <p className="text-muted-foreground text-sm">{percentage}% correct</p>
        </CardContent>
      </Card>

      {/* Answer review */}
      <div className="w-full max-w-lg space-y-2">
        <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
          Review
        </h2>
        {questions.map((q, i) => (
          <Card
            key={i}
            className={
              q.isCorrect
                ? "border-green-500/40 bg-green-50/30 dark:bg-green-950/20"
                : "border-destructive/40 bg-red-50/30 dark:bg-red-950/20"
            }
          >
            <CardContent className="flex items-center gap-4 py-3 px-4">
              {q.isCorrect ? (
                <CheckCircle2 className="size-5 text-green-600 dark:text-green-400 shrink-0" />
              ) : (
                <XCircle className="size-5 text-destructive shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold">{q.word.hanzi}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-6 text-muted-foreground"
                    onClick={() => speak(q.word.hanzi)}
                  >
                    <Volume2 className="size-3.5" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  {q.word.vietnamese}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-medium text-green-700 dark:text-green-400">
                  {q.word.pinyin}
                </p>
                {!q.isCorrect && (
                  <p className="text-xs text-destructive line-through">
                    {q.userAnswer}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Separator className="w-full max-w-lg" />

      <div className="flex gap-3">
        <Button onClick={handleRetake} variant="outline" className="gap-2">
          <RefreshCw className="size-4" /> New Test
        </Button>
        <Button
          onClick={() => {
            setWordCount(questions.length);
            handleRetake();
            setTimeout(handleCreateTest, 50);
          }}
          className="gap-2"
        >
          <RefreshCw className="size-4" /> Retake Same
        </Button>
      </div>
    </div>
  );
}
