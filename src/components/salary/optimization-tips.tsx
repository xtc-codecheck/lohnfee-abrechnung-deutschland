import { 
  Gift, Train, Wifi, Baby, PiggyBank, Bike, 
  UtensilsCrossed, Home, Coins, Heart, Lightbulb,
  ChevronRight, TrendingUp
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { OptimizationTip } from '@/utils/net-to-gross-calculation';
import { cn } from '@/lib/utils';

interface OptimizationTipsProps {
  tips: OptimizationTip[];
  onTipClick?: (tip: OptimizationTip) => void;
}

const iconMap: Record<string, React.ComponentType<any>> = {
  Gift,
  Train,
  Wifi,
  Baby,
  PiggyBank,
  Bike,
  UtensilsCrossed,
  Home,
  Coins,
  Heart,
};

const categoryColors: Record<OptimizationTip['category'], string> = {
  'tax-free': 'bg-green-500/10 text-green-600 border-green-500/20',
  'social-security': 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  'deductible': 'bg-orange-500/10 text-orange-600 border-orange-500/20',
  'benefit': 'bg-purple-500/10 text-purple-600 border-purple-500/20',
};

const categoryLabels: Record<OptimizationTip['category'], string> = {
  'tax-free': 'Steuerfrei',
  'social-security': 'SV-frei',
  'deductible': 'Absetzbar',
  'benefit': 'Benefit',
};

const difficultyColors: Record<OptimizationTip['difficulty'], string> = {
  easy: 'bg-green-500/10 text-green-600',
  medium: 'bg-yellow-500/10 text-yellow-600',
  hard: 'bg-red-500/10 text-red-600',
};

const difficultyLabels: Record<OptimizationTip['difficulty'], string> = {
  easy: 'Einfach',
  medium: 'Mittel',
  hard: 'Aufwändig',
};

export function OptimizationTips({ tips, onTipClick }: OptimizationTipsProps) {
  const totalSavings = tips.reduce((sum, tip) => sum + tip.potentialSavings, 0);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-yellow-500" />
              Optimierungspotenzial
            </CardTitle>
            <CardDescription>
              Entdecke legale Möglichkeiten, mehr Netto vom Brutto zu behalten
            </CardDescription>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Mögliche Ersparnis/Jahr</p>
            <p className="text-2xl font-bold text-primary">
              bis zu {totalSavings.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {tips.slice(0, 6).map((tip) => {
            const IconComponent = iconMap[tip.icon] || Gift;
            
            return (
              <div
                key={tip.id}
                className={cn(
                  "flex items-start gap-4 p-4 rounded-lg border transition-all cursor-pointer",
                  "hover:bg-accent hover:border-primary/30"
                )}
                onClick={() => onTipClick?.(tip)}
              >
                <div className={cn(
                  "flex-shrink-0 p-2 rounded-lg",
                  categoryColors[tip.category]
                )}>
                  <IconComponent className="h-5 w-5" />
                </div>
                
                <div className="flex-grow min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-foreground">{tip.title}</h4>
                    <Badge variant="outline" className={cn("text-xs", categoryColors[tip.category])}>
                      {categoryLabels[tip.category]}
                    </Badge>
                    <Badge variant="outline" className={cn("text-xs", difficultyColors[tip.difficulty])}>
                      {difficultyLabels[tip.difficulty]}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {tip.description}
                  </p>
                </div>
                
                <div className="flex-shrink-0 text-right">
                  <p className="text-sm font-medium text-primary flex items-center gap-1">
                    <TrendingUp className="h-4 w-4" />
                    +{tip.potentialSavings.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                  </p>
                  <p className="text-xs text-muted-foreground">pro Jahr</p>
                </div>
                
                <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-2" />
              </div>
            );
          })}
        </div>
        
        {tips.length > 6 && (
          <Button variant="ghost" className="w-full mt-4">
            Alle {tips.length} Tipps anzeigen
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

// Kompakte Version für Sidebar oder kleine Bereiche
export function OptimizationTipsCompact({ tips }: { tips: OptimizationTip[] }) {
  return (
    <div className="space-y-2">
      <h4 className="font-medium text-sm flex items-center gap-2">
        <Lightbulb className="h-4 w-4 text-yellow-500" />
        Top Spartipps
      </h4>
      {tips.slice(0, 3).map((tip) => {
        const IconComponent = iconMap[tip.icon] || Gift;
        
        return (
          <div
            key={tip.id}
            className="flex items-center gap-2 p-2 rounded-md bg-muted/50 text-sm"
          >
            <IconComponent className="h-4 w-4 text-primary flex-shrink-0" />
            <span className="truncate flex-grow">{tip.title}</span>
            <span className="text-xs font-medium text-primary flex-shrink-0">
              +{Math.round(tip.potentialSavings)}€
            </span>
          </div>
        );
      })}
    </div>
  );
}
