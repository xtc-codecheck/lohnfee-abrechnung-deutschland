import { useMemo } from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Area,
  AreaChart,
  ReferenceLine,
  Legend
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SalaryCurvePoint } from '@/utils/net-to-gross-calculation';

interface SalaryCurveChartProps {
  data: SalaryCurvePoint[];
  currentGross?: number;
  height?: number;
}

export function SalaryCurveChart({ data, currentGross, height = 300 }: SalaryCurveChartProps) {
  const formattedData = useMemo(() => 
    data.map(point => ({
      ...point,
      gross: Math.round(point.gross),
      net: Math.round(point.net),
      taxes: Math.round(point.taxes),
      socialContributions: Math.round(point.socialContributions),
      netPercentage: Math.round(point.netPercentage * 10) / 10,
      marginalTaxRate: Math.round(point.marginalTaxRate * 10) / 10,
    }))
  , [data]);

  const formatCurrency = (value: number) => 
    `${value.toLocaleString('de-DE')} €`;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const point = payload[0].payload;
      return (
        <div className="bg-background border border-border rounded-lg shadow-lg p-3 text-sm">
          <p className="font-bold text-foreground mb-2">
            Brutto: {formatCurrency(point.gross)}
          </p>
          <div className="space-y-1">
            <p className="text-primary flex justify-between gap-4">
              <span>Netto:</span>
              <span className="font-medium">{formatCurrency(point.net)}</span>
            </p>
            <p className="text-muted-foreground flex justify-between gap-4">
              <span>Steuern:</span>
              <span>-{formatCurrency(point.taxes)}</span>
            </p>
            <p className="text-muted-foreground flex justify-between gap-4">
              <span>Sozialabgaben:</span>
              <span>-{formatCurrency(point.socialContributions)}</span>
            </p>
            <div className="border-t border-border pt-1 mt-2">
              <p className="text-muted-foreground flex justify-between gap-4">
                <span>Netto-Quote:</span>
                <span>{point.netPercentage}%</span>
              </p>
              <p className="text-destructive flex justify-between gap-4">
                <span>Grenzbelastung:</span>
                <span>{point.marginalTaxRate}%</span>
              </p>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Brutto-Netto-Kurve</CardTitle>
        <CardDescription>
          Visualisierung: Wie entwickelt sich das Netto bei steigendem Brutto?
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <AreaChart data={formattedData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorNet" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorGross" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0.2}/>
                <stop offset="95%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="gross" 
              tickFormatter={(value) => `${(value/1000).toFixed(0)}k`}
              className="text-xs fill-muted-foreground"
            />
            <YAxis 
              tickFormatter={(value) => `${(value/1000).toFixed(0)}k`}
              className="text-xs fill-muted-foreground"
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            
            {currentGross && (
              <ReferenceLine 
                x={currentGross} 
                stroke="hsl(var(--primary))" 
                strokeDasharray="5 5"
                label={{ value: 'Aktuell', position: 'top', className: 'fill-primary text-xs' }}
              />
            )}
            
            <Area
              type="monotone"
              dataKey="gross"
              stroke="hsl(var(--muted-foreground))"
              strokeWidth={1}
              fillOpacity={1}
              fill="url(#colorGross)"
              name="Brutto"
            />
            <Area
              type="monotone"
              dataKey="net"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorNet)"
              name="Netto"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

interface MarginalRateChartProps {
  data: SalaryCurvePoint[];
  currentGross?: number;
  height?: number;
}

export function MarginalRateChart({ data, currentGross, height = 200 }: MarginalRateChartProps) {
  const formattedData = useMemo(() => 
    data.slice(1).map(point => ({ // Skip first point (no marginal rate)
      gross: Math.round(point.gross),
      marginalTaxRate: Math.round(point.marginalTaxRate * 10) / 10,
      netPercentage: Math.round(point.netPercentage * 10) / 10,
    }))
  , [data]);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Grenzbelastung</CardTitle>
        <CardDescription>
          Wie viel % vom nächsten Euro gehen an Steuern & Sozialabgaben?
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <LineChart data={formattedData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="gross" 
              tickFormatter={(value) => `${(value/1000).toFixed(0)}k`}
              className="text-xs fill-muted-foreground"
            />
            <YAxis 
              domain={[0, 60]}
              tickFormatter={(value) => `${value}%`}
              className="text-xs fill-muted-foreground"
            />
            <Tooltip 
              formatter={(value: number) => [`${value}%`, 'Grenzbelastung']}
              labelFormatter={(label) => `Brutto: ${label.toLocaleString('de-DE')} €`}
            />
            
            {currentGross && (
              <ReferenceLine 
                x={currentGross} 
                stroke="hsl(var(--primary))" 
                strokeDasharray="5 5"
              />
            )}
            
            <ReferenceLine y={50} stroke="hsl(var(--destructive))" strokeDasharray="3 3" />
            
            <Line
              type="monotone"
              dataKey="marginalTaxRate"
              stroke="hsl(var(--destructive))"
              strokeWidth={2}
              dot={false}
              name="Grenzbelastung %"
            />
          </LineChart>
        </ResponsiveContainer>
        <p className="text-xs text-muted-foreground text-center mt-2">
          Rote Linie = 50% Grenze (jeder 2. Euro geht an den Staat)
        </p>
      </CardContent>
    </Card>
  );
}
