import { Link } from "react-router-dom";
import { BookOpen, PenLine, ClipboardList, Grid2x2, ArrowRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const features = [
  {
    to: "/vocab",
    icon: BookOpen,
    title: "Random Vocab",
    description:
      "Explore flashcards with Hanzi, Pinyin, Vietnamese meaning, radical breakdown, and audio pronunciation.",
    cta: "Start exploring",
    color: "text-blue-500",
    bg: "bg-blue-50 dark:bg-blue-950/30",
  },
  {
    to: "/pinyin",
    icon: PenLine,
    title: "Pinyin Practice",
    description:
      "Given a Hanzi word, type its Pinyin. Words never repeat in a session — tracked via sessionStorage.",
    cta: "Start practicing",
    color: "text-violet-500",
    bg: "bg-violet-50 dark:bg-violet-950/30",
  },
  {
    to: "/test",
    icon: ClipboardList,
    title: "Test Mode",
    description:
      "Create a random test with up to 20 words. Get scored and review your answers at the end.",
    cta: "Create a test",
    color: "text-emerald-500",
    bg: "bg-emerald-50 dark:bg-emerald-950/30",
  },
  {
    to: "/chart",
    icon: Grid2x2,
    title: "Pinyin Chart",
    description:
      "Interactive initials × finals table. Click any cell to hear its pronunciation with your chosen tone.",
    cta: "Open chart",
    color: "text-orange-500",
    bg: "bg-orange-50 dark:bg-orange-950/30",
  },
];

export function HomePage() {
  return (
    <div className="flex flex-col items-center gap-12">
      {/* Hero */}
      <div className="text-center space-y-3 pt-4">
        <h1 className="text-5xl font-bold tracking-tight">
          汉字 <span className="text-muted-foreground font-light">学习</span>
        </h1>
        <p className="text-xl text-muted-foreground max-w-md">
          Learn Chinese Mandarin — Hanzi, Pinyin, and Vietnamese meanings in one place.
        </p>
      </div>

      {/* Feature cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
        {features.map(({ to, icon: Icon, title, description, cta, color, bg }) => (
          <Card
            key={to}
            className="flex flex-col hover:shadow-md transition-shadow"
          >
            <CardHeader className="pb-2">
              <div className={`size-10 rounded-lg ${bg} flex items-center justify-center mb-2`}>
                <Icon className={`size-5 ${color}`} />
              </div>
              <CardTitle className="text-base">{title}</CardTitle>
              <CardDescription className="text-sm leading-relaxed">
                {description}
              </CardDescription>
            </CardHeader>
            <CardContent className="mt-auto pt-0">
              <Button asChild variant="outline" size="sm" className="gap-1.5 w-full">
                <Link to={to}>
                  {cta} <ArrowRight className="size-3.5" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Footer note */}
      <p className="text-xs text-muted-foreground text-center">
        Vocabulary sourced from HSK word lists · Definitions via{" "}
        <a
          href="https://dict.minhqnd.com"
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-2 hover:text-foreground transition-colors"
        >
          dict.minhqnd.com
        </a>
      </p>
    </div>
  );
}
