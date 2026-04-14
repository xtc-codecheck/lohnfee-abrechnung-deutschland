import { AlertCircle, RefreshCw, WifiOff } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

interface NetworkErrorAlertProps {
  error: Error | string | null;
  onRetry?: () => void;
  context?: string;
}

export function NetworkErrorAlert({ error, onRetry, context }: NetworkErrorAlertProps) {
  if (!error) return null;

  const message = typeof error === 'string' ? error : error.message;
  const isTimeout = message.toLowerCase().includes('timeout') || message.toLowerCase().includes('aborted');
  const isNetwork = message.toLowerCase().includes('fetch') || message.toLowerCase().includes('network') || message.toLowerCase().includes('failed to fetch');

  let title = "Fehler aufgetreten";
  let description = message;
  let Icon = AlertCircle;

  if (isTimeout) {
    title = "Zeitüberschreitung";
    description = "Die Anfrage hat zu lange gedauert. Bitte prüfen Sie Ihre Internetverbindung und versuchen Sie es erneut.";
    Icon = WifiOff;
  } else if (isNetwork) {
    title = "Verbindungsproblem";
    description = "Es konnte keine Verbindung zum Server hergestellt werden. Bitte prüfen Sie Ihre Internetverbindung.";
    Icon = WifiOff;
  } else if (message.includes('permission') || message.includes('policy')) {
    title = "Keine Berechtigung";
    description = "Sie haben keine Berechtigung für diese Aktion. Bitte kontaktieren Sie Ihren Administrator.";
  }

  if (context) {
    description = `${context}: ${description}`;
  }

  return (
    <Alert variant="destructive" className="animate-fade-in">
      <Icon className="h-4 w-4" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription className="flex items-center justify-between">
        <span>{description}</span>
        {onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry} className="ml-4 shrink-0">
            <RefreshCw className="h-3 w-3 mr-1" />
            Erneut versuchen
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}
