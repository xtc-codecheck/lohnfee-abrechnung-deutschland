/**
 * HelpTooltip – Kontextuelle Hilfe für steuerliche Laien
 * 
 * Zeigt ein (?) Icon neben Labels an. Beim Hover/Klick erscheint
 * eine verständliche Erklärung des Fachbegriffs.
 */

import { HelpCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface HelpTooltipProps {
  /** Kurze, laienverständliche Erklärung */
  content: string;
  /** Optionaler Beispieltext */
  example?: string;
  /** Optionaler Hinweis ("Wo finde ich das?") */
  hint?: string;
  /** CSS-Klasse für das Icon */
  className?: string;
  /** Icon-Größe */
  size?: "sm" | "md";
}

export function HelpTooltip({
  content,
  example,
  hint,
  className,
  size = "sm",
}: HelpTooltipProps) {
  const iconSize = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";

  return (
    <Tooltip delayDuration={200}>
      <TooltipTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex items-center justify-center rounded-full text-muted-foreground hover:text-primary transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            className
          )}
          aria-label="Hilfe anzeigen"
        >
          <HelpCircle className={iconSize} />
        </button>
      </TooltipTrigger>
      <TooltipContent
        side="top"
        align="start"
        className="max-w-xs p-3 space-y-1.5"
      >
        <p className="text-sm leading-relaxed">{content}</p>
        {example && (
          <p className="text-xs text-muted-foreground italic">
            💡 Beispiel: {example}
          </p>
        )}
        {hint && (
          <p className="text-xs text-muted-foreground">
            📌 {hint}
          </p>
        )}
      </TooltipContent>
    </Tooltip>
  );
}

/**
 * LabelWithHelp – Label + HelpTooltip in einer Zeile
 */
interface LabelWithHelpProps {
  htmlFor?: string;
  children: React.ReactNode;
  help: string;
  example?: string;
  hint?: string;
  required?: boolean;
}

export function LabelWithHelp({
  htmlFor,
  children,
  help,
  example,
  hint,
  required,
}: LabelWithHelpProps) {
  return (
    <div className="flex items-center gap-1.5">
      <label
        htmlFor={htmlFor}
        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
      >
        {children}
        {required && "*"}
      </label>
      <HelpTooltip content={help} example={example} hint={hint} />
    </div>
  );
}
