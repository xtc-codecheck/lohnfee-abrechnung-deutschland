import { ReactNode, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Menu, X, LogOut, User, ChevronDown, Settings, Building2, LayoutGrid, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";
import { useTenant } from "@/contexts/tenant-context";
import { DarkModeToggle } from "@/components/ui/dark-mode-toggle";
import { CookieConsent, openCookieConsent } from "@/components/system/cookie-consent";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuPortal,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";

interface MainLayoutProps {
  children: ReactNode;
}

const primaryNavItems = [
  { path: "/dashboard", label: "Dashboard" },
  { path: "/employees", label: "Mitarbeiter" },
  { path: "/payroll", label: "Abrechnung" },
  { path: "/time-tracking", label: "Zeiterfassung" },
];

const secondaryNavItems = [
  { path: "/meldewesen", label: "Meldewesen", group: "Compliance" },
  { path: "/steuerberater", label: "Steuerberater", group: "Compliance" },
  { path: "/travel", label: "Reisekosten", group: "Operativ" },
  { path: "/autolohn", label: "Autolohn", group: "Operativ" },
] as const;

export function MainLayout({ children }: MainLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, roles, signOut } = useAuth();
  const { tenants, currentTenant, switchTenant } = useTenant();

  const isActive = (path: string) => location.pathname === path;
  const isSecondaryActive = secondaryNavItems.some((i) => isActive(i.path));

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
            <nav className="hidden md:flex items-center gap-1" aria-label="Hauptnavigation">
              {primaryNavItems.map((item) => (
                <button
                  key={item.path}
                  onClick={() => handleNavigation(item.path)}
                  aria-current={isActive(item.path) ? "page" : undefined}
                  className={`px-3 py-2 rounded-md text-sm transition-colors ${
                    isActive(item.path)
                      ? "text-primary font-medium bg-primary/5"
                      : "text-muted-foreground hover:text-primary hover:bg-muted"
                  }`}
                >
                  {item.label}
                </button>
              ))}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className={`px-3 py-2 rounded-md text-sm inline-flex items-center gap-1 transition-colors ${
                      isSecondaryActive
                        ? "text-primary font-medium bg-primary/5"
                        : "text-muted-foreground hover:text-primary hover:bg-muted"
                    }`}
                    aria-label="Weitere Bereiche"
                  >
                    Mehr <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56 bg-popover">
                  <DropdownMenuLabel className="text-xs text-muted-foreground">Compliance</DropdownMenuLabel>
                  {secondaryNavItems.filter(i => i.group === "Compliance").map(item => (
                    <DropdownMenuItem key={item.path} onClick={() => handleNavigation(item.path)}>
                      {item.label}
                      {isActive(item.path) && <Check className="ml-auto h-4 w-4" />}
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel className="text-xs text-muted-foreground">Operativ</DropdownMenuLabel>
                  {secondaryNavItems.filter(i => i.group === "Operativ").map(item => (
                    <DropdownMenuItem key={item.path} onClick={() => handleNavigation(item.path)}>
                      {item.label}
                      {isActive(item.path) && <Check className="ml-auto h-4 w-4" />}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <div className="flex items-center gap-1 ml-3 pl-3 border-l border-border">
                <DarkModeToggle />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      className="inline-flex items-center gap-2 px-2 py-1.5 rounded-md text-sm hover:bg-muted transition-colors"
                      aria-label="Profilmenü öffnen"
                    >
                      <div className="h-7 w-7 rounded-full bg-gradient-primary flex items-center justify-center text-primary-foreground text-xs font-medium" aria-hidden="true">
                        {user?.email?.[0]?.toUpperCase() ?? <User className="h-3.5 w-3.5" />}
                      </div>
                      <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-64 bg-popover">
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col gap-1">
                        <span className="text-sm font-medium truncate">{user?.email}</span>
                        <div className="flex items-center gap-2">
                          {roles.length > 0 && (
                            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                              {roles[0]}
                            </span>
                          )}
                          {currentTenant && (
                            <span className="text-xs text-muted-foreground truncate">{currentTenant.name}</span>
                          )}
                        </div>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuGroup>
                      <DropdownMenuItem onClick={() => navigate("/portal")}>
                        <LayoutGrid className="mr-2 h-4 w-4" /> Mein Portal
                      </DropdownMenuItem>
                      {tenants.length > 1 && (
                        <DropdownMenuSub>
                          <DropdownMenuSubTrigger>
                            <Building2 className="mr-2 h-4 w-4" /> Mandant wechseln
                          </DropdownMenuSubTrigger>
                          <DropdownMenuPortal>
                            <DropdownMenuSubContent className="bg-popover">
                              {tenants.map(t => (
                                <DropdownMenuItem key={t.id} onClick={() => switchTenant(t.id)}>
                                  {t.name}
                                  {currentTenant?.id === t.id && <Check className="ml-auto h-4 w-4" />}
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuSubContent>
                          </DropdownMenuPortal>
                        </DropdownMenuSub>
                      )}
                      <DropdownMenuItem onClick={() => navigate("/settings")}>
                        <Settings className="mr-2 h-4 w-4" /> Einstellungen
                      </DropdownMenuItem>
                    </DropdownMenuGroup>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={signOut} className="text-destructive focus:text-destructive">
                      <LogOut className="mr-2 h-4 w-4" /> Abmelden
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
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
              <div className="flex flex-col space-y-1">
                {primaryNavItems.map((item) => (
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
                <div className="px-4 pt-3 pb-1 text-xs uppercase tracking-wide text-muted-foreground">Weitere</div>
                {secondaryNavItems.map((item) => (
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

                <div className="border-t border-border mt-3 pt-3 space-y-1">
                  <div className="flex items-center gap-2 px-4 pb-2">
                    <div className="h-8 w-8 rounded-full bg-gradient-primary flex items-center justify-center text-primary-foreground text-xs font-medium">
                      {user?.email?.[0]?.toUpperCase() ?? <User className="h-4 w-4" />}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-medium truncate">{user?.email}</span>
                      {currentTenant && <span className="text-xs text-muted-foreground truncate">{currentTenant.name}</span>}
                    </div>
                  </div>

                  {tenants.length > 1 && (
                    <div className="px-4 py-2">
                      <div className="text-xs text-muted-foreground mb-1">Mandant</div>
                      <div className="flex flex-col gap-1">
                        {tenants.map(t => (
                          <button
                            key={t.id}
                            onClick={() => { switchTenant(t.id); setMobileMenuOpen(false); }}
                            className={`text-left text-sm px-2 py-1.5 rounded inline-flex items-center justify-between ${
                              currentTenant?.id === t.id ? "bg-primary/10 text-primary" : "hover:bg-muted"
                            }`}
                          >
                            <span className="truncate">{t.name}</span>
                            {currentTenant?.id === t.id && <Check className="h-4 w-4" />}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <button
                    onClick={() => handleNavigation("/portal")}
                    className="w-full text-left flex items-center gap-2 px-4 py-3 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                  >
                    <LayoutGrid className="h-4 w-4" /> Mein Portal
                  </button>
                  <button
                    onClick={() => handleNavigation("/settings")}
                    className="w-full text-left flex items-center gap-2 px-4 py-3 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                  >
                    <Settings className="h-4 w-4" /> Einstellungen
                  </button>

                  <div className="flex items-center justify-between px-4 py-2">
                    <span className="text-sm text-muted-foreground">Erscheinungsbild</span>
                    <DarkModeToggle />
                  </div>

                  <button
                    onClick={() => { signOut(); setMobileMenuOpen(false); }}
                    className="w-full flex items-center gap-2 px-4 py-3 text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                    aria-label="Abmelden"
                  >
                    <LogOut className="h-4 w-4" aria-hidden="true" />
                    Abmelden
                  </button>
                </div>
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
