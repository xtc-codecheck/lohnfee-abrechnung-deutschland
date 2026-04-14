import { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PayrollSubViewWrapperProps {
  title: string;
  description: string;
  onBack: () => void;
  children: ReactNode;
}

export function PayrollSubViewWrapper({ title, description, onBack, children }: PayrollSubViewWrapperProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{title}</h1>
          <p className="text-muted-foreground">{description}</p>
        </div>
        <Button onClick={onBack} variant="outline">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Zurück zum Dashboard
        </Button>
      </div>
      {children}
    </div>
  );
}
