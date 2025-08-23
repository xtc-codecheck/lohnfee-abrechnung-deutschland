import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface PageHeaderProps {
  title: string;
  description?: string;
  children?: ReactNode;
  onBack?: () => void;
}

export function PageHeader({ title, description, children, onBack }: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between pb-6 border-b border-border">
      <div className="flex items-center gap-4">
        {onBack && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Zurück
          </Button>
        )}
        <div>
          <h1 className="text-3xl font-bold text-foreground">{title}</h1>
          {description && (
            <p className="text-muted-foreground mt-2">{description}</p>
          )}
        </div>
      </div>
      {children && <div className="flex items-center gap-4">{children}</div>}
    </div>
  );
}