import { ReactNode, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Menu, X, LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";
import { TenantSwitcher } from "@/components/settings/tenant-switcher";
import { DarkModeToggle } from "@/components/ui/dark-mode-toggle";
import { CookieConsent, openCookieConsent } from "@/components/system/cookie-consent";

interface MainLayoutProps {
  children: ReactNode;
}

const navItems = [
  { path: "/dashboard", label: "Dashboard" },
  { path: "/employees", label: "Mitarbeiter" },
  { path: "/payroll", label: "Abrechnung" },
  { path: "/time-tracking", label: "Zeiterfassung" },
  { path: "/meldewesen", label: "Meldewesen" },
  { path: "/autolohn", label: "Autolohn" },
  { path: "/settings", label: "Einstellungen" },
];

export function MainLayout({ children }: MainLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, roles, signOut } = useAuth();

  const isActive = (path: string) => location.pathname === path;

  const handleNavigation = (path: string) => {
    navigate(path);
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Skip to content – Accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[100] focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:outline-none"
      >
        Zum Inhalt springen
      </a>

      {/* Header */}
      <header className="bg-card border-b border-border shadow-card sticky top-0 z-50" role="banner">
        <div className="container mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="h-8 w-8 bg-gradient-primary rounded-lg flex items-center justify-center" aria-hidden="true">
                <span className="text-primary-foreground font-bold text-lg">L</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">LohnPro</h1>
                <p className="text-sm text-muted-foreground hidden sm:block">Lohnabrechnungssoftware</p>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-6" aria-label="Hauptnavigation">
              {navItems.map((item) => (
                <button
                  key={item.path}
                  onClick={() => handleNavigation(item.path)}
                  aria-label={`Navigiere zu ${item.label}`}
                  aria-current={isActive(item.path) ? "page" : undefined}
                  className={`transition-colors ${
                    isActive(item.path)
                      ? "text-primary font-medium"
                      : "text-muted-foreground hover:text-primary"
                  }`}
                >
                  {item.label}
                </button>
              ))}
              <div className="flex items-center gap-2 ml-4 pl-4 border-l border-border">
                <TenantSwitcher />
                <DarkModeToggle />
                <User className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                <span className="text-sm text-muted-foreground truncate max-w-[150px]">
                  {user?.email}
                </span>
                {roles.length > 0 && (
                  <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full" role="status">
                    {roles[0]}
                  </span>
                )}
                <Button variant="ghost" size="icon" onClick={signOut} aria-label="Abmelden">
                  <LogOut className="h-4 w-4" aria-hidden="true" />
                </Button>
              </div>
            </nav>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? "Menü schließen" : "Menü öffnen"}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-nav"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <nav id="mobile-nav" className="md:hidden mt-4 pb-2 border-t border-border pt-4" aria-label="Mobile Navigation">
              <div className="flex flex-col space-y-2">
                {navItems.map((item) => (
                  <button
                    key={item.path}
                    onClick={() => handleNavigation(item.path)}
                    aria-current={isActive(item.path) ? "page" : undefined}
                    className={`text-left px-4 py-3 rounded-lg transition-colors ${
                      isActive(item.path)
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
                <div className="flex items-center justify-between px-4 pt-3 border-t border-border mt-2">
                  <TenantSwitcher />
                  <DarkModeToggle />
                </div>
                <div className="flex items-center gap-2 px-4 pt-2">
                  <User className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                  <span className="text-sm text-muted-foreground truncate flex-1">
                    {user?.email}
                  </span>
                </div>
                <button
                  onClick={() => { signOut(); setMobileMenuOpen(false); }}
                  className="flex items-center gap-2 px-4 py-3 text-destructive hover:bg-destructive/10 rounded-lg transition-colors mt-1"
                  aria-label="Abmelden"
                >
                  <LogOut className="h-4 w-4" aria-hidden="true" />
                  Abmelden
                </button>
              </div>
            </nav>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main id="main-content" className="container mx-auto px-4 sm:px-6 py-8 flex-1" role="main">
        {children}
      </main>

      {/* Footer – simplified: only legal/utility links */}
      <footer className="bg-card border-t border-border mt-auto" role="contentinfo">
        <div className="container mx-auto px-4 sm:px-6 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center space-x-2">
              <div className="h-6 w-6 bg-gradient-primary rounded flex items-center justify-center" aria-hidden="true">
                <span className="text-primary-foreground font-bold text-sm">L</span>
              </div>
              <span className="text-sm font-medium text-foreground">LohnPro</span>
            </div>
            
            <nav className="flex flex-wrap justify-center gap-4 text-sm" aria-label="Rechtliche Links">
              <button onClick={() => handleNavigation("/impressum")} className="text-muted-foreground hover:text-primary transition-colors">Impressum</button>
              <button onClick={() => handleNavigation("/datenschutz")} className="text-muted-foreground hover:text-primary transition-colors">Datenschutz</button>
              <button onClick={() => handleNavigation("/agb")} className="text-muted-foreground hover:text-primary transition-colors">AGB</button>
              <button onClick={() => handleNavigation("/kontakt")} className="text-muted-foreground hover:text-primary transition-colors">Kontakt</button>
              <button onClick={() => handleNavigation("/hilfe")} className="text-muted-foreground hover:text-primary transition-colors">Hilfe</button>
              <button onClick={openCookieConsent} className="text-muted-foreground hover:text-primary transition-colors">Cookie-Einstellungen</button>
            </nav>

            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} LohnPro. Alle Rechte vorbehalten.
            </p>
          </div>
        </div>
      </footer>
      <CookieConsent />
    </div>
  );
}
