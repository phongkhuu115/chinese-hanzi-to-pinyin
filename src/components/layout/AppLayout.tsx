import { NavLink, Outlet } from "react-router-dom";
import { BookOpen, PenLine, ClipboardList, Grid2x2, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/theme-provider";
import { VoiceSelector } from "@/components/VoiceSelector";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/vocab", label: "Random Vocab", icon: BookOpen },
  { to: "/pinyin", label: "Pinyin Practice", icon: PenLine },
  { to: "/test", label: "Test", icon: ClipboardList },
  { to: "/chart", label: "Pinyin Chart", icon: Grid2x2 },
];

export function AppLayout() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="min-h-svh bg-background text-foreground flex flex-col">
      {/* Header */}
      <header className="border-b border-border sticky top-0 z-50 bg-background/80 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          {/* Logo */}
          <NavLink to="/" className="flex items-center gap-2 shrink-0">
            <span className="text-xl font-bold tracking-tight">
              汉字<span className="text-muted-foreground font-normal text-base ml-1">学习</span>
            </span>
          </NavLink>

          {/* Nav */}
          <nav className="flex items-center gap-1">
            {navItems.map(({ to, label, icon: Icon }) => (
              <NavLink key={to} to={to}>
                {({ isActive }) => (
                  <Button
                    variant={isActive ? "secondary" : "ghost"}
                    size="sm"
                    className={cn("gap-1.5", isActive && "font-medium")}
                  >
                    <Icon className="size-4" />
                    <span className="hidden sm:inline">{label}</span>
                  </Button>
                )}
              </NavLink>
            ))}
          </nav>

          {/* Right side controls */}
          <div className="flex items-center gap-2 shrink-0">
            <VoiceSelector />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              aria-label="Toggle theme"
            >
              {theme === "dark" ? (
                <Sun className="size-4" />
              ) : (
                <Moon className="size-4" />
              )}
            </Button>
          </div>
        </div>
      </header>

      {/* Page content */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
