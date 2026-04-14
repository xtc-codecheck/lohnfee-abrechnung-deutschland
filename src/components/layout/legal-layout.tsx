import { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { DarkModeToggle } from "@/components/ui/dark-mode-toggle";
import { ArrowLeft } from "lucide-react";

interface LegalLayoutProps {
  children: ReactNode;
}

export function LegalLayout({ children }: LegalLayoutProps) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-lg">
        <div className="container mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/")} className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
                <span className="text-lg font-bold text-primary-foreground">L</span>
              </div>
              <span className="text-xl font-bold">LohnPro</span>
            </button>
          </div>
          <div className="flex items-center gap-3">
            <DarkModeToggle />
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Zurück
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card py-8">
        <div className="container mx-auto px-6">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded bg-primary">
                <span className="text-sm font-bold text-primary-foreground">L</span>
              </div>
              <span className="text-sm font-medium">LohnPro</span>
            </div>
            <nav className="flex flex-wrap justify-center gap-6 text-sm">
              <button onClick={() => navigate("/impressum")} className="text-muted-foreground hover:text-primary transition-colors">Impressum</button>
              <button onClick={() => navigate("/datenschutz")} className="text-muted-foreground hover:text-primary transition-colors">Datenschutz</button>
              <button onClick={() => navigate("/agb")} className="text-muted-foreground hover:text-primary transition-colors">AGB</button>
              <button onClick={() => navigate("/kontakt")} className="text-muted-foreground hover:text-primary transition-colors">Kontakt</button>
              <button onClick={() => navigate("/hilfe")} className="text-muted-foreground hover:text-primary transition-colors">Hilfe</button>
            </nav>
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} LohnPro. Alle Rechte vorbehalten.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
