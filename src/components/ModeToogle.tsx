import * as React from "react";
import { Moon, Sun } from "lucide-react";

import { Button } from "@/components/ui/button";

export function ModeToggle() {
  const [isDark, setIsDark] = React.useState(false);

  React.useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

  function changeTheme() {
    const nextIsDark = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", nextIsDark);
    setIsDark(nextIsDark);
    try {
      localStorage.setItem("theme", nextIsDark ? "dark" : "light");
    } catch {
      // Theme changes work even when browser storage is unavailable.
    }
  }
  return (
    <Button variant="outline" size="icon" type="button" onClick={changeTheme} aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}>
      {isDark ? <Sun className="h-5 w-5" aria-hidden="true" /> : <Moon className="h-5 w-5" aria-hidden="true" />}
    </Button>
  );
}
