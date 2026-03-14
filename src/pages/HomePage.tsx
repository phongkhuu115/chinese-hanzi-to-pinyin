import { Link } from "react-router-dom";
import {
  BookOpen,
  PenLine,
  ClipboardList,
  Grid2x2,
  ArrowRight,
  Library,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const practiceFeatures = [
  {
    to: "/vocab",
    icon: BookOpen,
    title: "Random Vocab",
    description:
      "Flashcards with Hanzi, Pinyin, Vietnamese meaning, radical breakdown, and audio.",
    cta: "Start exploring",
    color: "text-blue-500",
    bg: "bg-blue-50 dark:bg-blue-950/30",
    border: "hover:border-blue-300 dark:hover:border-blue-700",
  },
  {
    to: "/pinyin",
    icon: PenLine,
    title: "Pinyin Practice",
    description:
      "Given a Hanzi word, type its Pinyin. Words never repeat in a session.",
    cta: "Start practicing",
    color: "text-violet-500",
    bg: "bg-violet-50 dark:bg-violet-950/30",
    border: "hover:border-violet-300 dark:hover:border-violet-700",
  },
  {
    to: "/test",
    icon: ClipboardList,
    title: "Test Mode",
    description:
      "Create a random test with up to 20 words. Get scored and review answers.",
    cta: "Create a test",
    color: "text-emerald-500",
    bg: "bg-emerald-50 dark:bg-emerald-950/30",
    border: "hover:border-emerald-300 dark:hover:border-emerald-700",
  },
];

const referenceFeatures = [
  {
    to: "/chart",
    icon: Grid2x2,
    title: "Pinyin Chart",
    description:
      "Interactive initials × finals table. Click any cell to hear its pronunciation with your chosen tone.",
    cta: "Open chart",
    color: "text-orange-500",
    bg: "bg-orange-50 dark:bg-orange-950/30",
    border: "hover:border-orange-300 dark:hover:border-orange-700",
  },
  {
    to: "/vocab-list",
    icon: Library,
    title: "HSK Vocabulary",
    description:
      "Browse all HSK 1–7 words grouped by level. Click any card to hear it pronounced.",
    cta: "Browse vocab",
    color: "text-teal-500",
    bg: "bg-teal-50 dark:bg-teal-950/30",
    border: "hover:border-teal-300 dark:hover:border-teal-700",
  },
];

function FeatureCard({
  to,
  icon: Icon,
  title,
  description,
  cta,
  color,
  bg,
  border,
}: (typeof practiceFeatures)[number]) {
  return (
    <Card
      className={`flex flex-col hover:shadow-md transition-all ${border}`}
    >
      <CardHeader className="pb-2">
        <div
          className={`size-10 rounded-lg ${bg} flex items-center justify-center mb-2`}
        >
          <Icon className={`size-5 ${color}`} />
        </div>
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription className="text-sm leading-relaxed">
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent className="mt-auto pt-0">
        <Button
          asChild
          variant="outline"
          size="sm"
          className="gap-1.5 w-full"
        >
          <Link to={to}>
            {cta} <ArrowRight className="size-3.5" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

export function HomePage() {
  return (
    <div className="flex flex-col items-center gap-12">
      {/* Hero */}
      <div className="text-center space-y-3 pt-4">
        <h1 className="text-5xl font-bold tracking-tight">
          汉字{" "}
          <span className="text-muted-foreground font-light">学习</span>
        </h1>
        <p className="text-xl text-muted-foreground max-w-md">
          Learn Chinese Mandarin — Hanzi, Pinyin, and Vietnamese meanings in
          one place.
        </p>
      </div>

      {/* Practice section */}
      <div className="w-full space-y-3">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
            Practice
          </h2>
          <div className="flex-1 h-px bg-border" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {practiceFeatures.map((f) => (
            <FeatureCard key={f.to} {...f} />
          ))}
        </div>
      </div>

      {/* Reference section */}
      <div className="w-full space-y-3">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
            Reference
          </h2>
          <div className="flex-1 h-px bg-border" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {referenceFeatures.map((f) => (
            <FeatureCard key={f.to} {...f} />
          ))}
        </div>
      </div>

      {/* Footer note */}
      <p className="text-xs text-muted-foreground text-center">
        Vocabulary sourced from HSK word lists · Translations via{" "}
        <a
          href="https://mymemory.translated.net"
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-2 hover:text-foreground transition-colors"
        >
          MyMemory API
        </a>
      </p>
    </div>
  );
}
