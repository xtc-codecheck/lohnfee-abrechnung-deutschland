import { ReactNode } from "react";
import { useNavigate, useLocation } from "react-router-dom";

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  
  const isActive = (path: string) => location.pathname === path;

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
              <button 
                onClick={() => navigate("/")}
                className={`transition-colors ${
                  isActive("/") 
                    ? "text-primary font-medium" 
                    : "text-muted-foreground hover:text-primary"
                }`}
              >
                Dashboard
              </button>
              <button 
                onClick={() => navigate("/employees")}
                className={`transition-colors ${
                  isActive("/employees") 
                    ? "text-primary font-medium" 
                    : "text-muted-foreground hover:text-primary"
                }`}
              >
                Mitarbeiter
              </button>
              <button 
                onClick={() => navigate("/payroll")}
                className={`transition-colors ${
                  isActive("/payroll") 
                    ? "text-primary font-medium" 
                    : "text-muted-foreground hover:text-primary"
                }`}
              >
                Abrechnung
              </button>
              <button 
                onClick={() => navigate("/autolohn")}
                className={`transition-colors ${
                  isActive("/autolohn") 
                    ? "text-primary font-medium" 
                    : "text-muted-foreground hover:text-primary"
                }`}
              >
                Autolohn
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