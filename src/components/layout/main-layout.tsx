import { ReactNode } from "react";

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border shadow-card">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="h-8 w-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-lg">L</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">LohnPro</h1>
                <p className="text-sm text-muted-foreground">Lohnabrechnungssoftware</p>
              </div>
            </div>
            <nav className="flex items-center space-x-6">
              <button className="text-foreground hover:text-primary transition-colors">
                Dashboard
              </button>
              <button className="text-muted-foreground hover:text-primary transition-colors">
                Mitarbeiter
              </button>
              <button className="text-muted-foreground hover:text-primary transition-colors">
                Abrechnung
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {children}
      </main>
    </div>
  );
}