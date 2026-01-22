import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Car, Zap, Fuel, FileText, TrendingDown, CheckCircle2 } from 'lucide-react';
import { compareCarMethods, VehicleType, CompanyCarResult } from '@/utils/company-car-calculation';

export function CompanyCarConfigurator() {
  const [listPrice, setListPrice] = useState(45000);
  const [vehicleType, setVehicleType] = useState<VehicleType>('electric');
  const [distanceToWork, setDistanceToWork] = useState(25);
  const [workDaysPerMonth, setWorkDaysPerMonth] = useState(20);
  const [monthlyVehicleCosts, setMonthlyVehicleCosts] = useState(800);
  const [yearlyPrivateKm, setYearlyPrivateKm] = useState(5000);
  const [yearlyBusinessKm, setYearlyBusinessKm] = useState(15000);

  const comparison = useMemo(() => {
    return compareCarMethods({
      listPrice,
      vehicleType,
      distanceToWork,
      workDaysPerMonth,
      monthlyVehicleCosts,
      yearlyPrivateKm,
      yearlyBusinessKm,
    });
  }, [listPrice, vehicleType, distanceToWork, workDaysPerMonth, monthlyVehicleCosts, yearlyPrivateKm, yearlyBusinessKm]);

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(value);

  const getVehicleIcon = (type: VehicleType) => {
    switch (type) {
      case 'electric': return <Zap className="h-4 w-4 text-green-500" />;
      case 'hybrid': return <Fuel className="h-4 w-4 text-blue-500" />;
      default: return <Car className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Car className="h-5 w-5" />
            Dienstwagen-Konfigurator
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Bruttolistenpreis (€)</Label>
              <Input type="number" value={listPrice} onChange={(e) => setListPrice(Number(e.target.value))} />
            </div>
            <div>
              <Label>Fahrzeugtyp</Label>
              <Select value={vehicleType} onValueChange={(v) => setVehicleType(v as VehicleType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="combustion">Verbrenner</SelectItem>
                  <SelectItem value="hybrid">Plug-in-Hybrid</SelectItem>
                  <SelectItem value="electric">Elektrofahrzeug</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Entfernung Wohnung-Arbeit (km)</Label>
              <Input type="number" value={distanceToWork} onChange={(e) => setDistanceToWork(Number(e.target.value))} />
            </div>
          </div>

          {/* Fahrtenbuch-Daten */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
            <div>
              <Label>Monatliche Fahrzeugkosten (€)</Label>
              <Input type="number" value={monthlyVehicleCosts} onChange={(e) => setMonthlyVehicleCosts(Number(e.target.value))} />
            </div>
            <div>
              <Label>Private km/Jahr</Label>
              <Input type="number" value={yearlyPrivateKm} onChange={(e) => setYearlyPrivateKm(Number(e.target.value))} />
            </div>
            <div>
              <Label>Dienstliche km/Jahr</Label>
              <Input type="number" value={yearlyBusinessKm} onChange={(e) => setYearlyBusinessKm(Number(e.target.value))} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Methodenvergleich */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {comparison.methods.map((method) => (
          <MethodCard key={method.method} method={method} formatCurrency={formatCurrency} />
        ))}
      </div>

      {/* Empfehlung */}
      <Card className="border-primary bg-primary/5">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-6 w-6 text-primary mt-1" />
            <div>
              <h3 className="font-semibold text-lg">Empfehlung</h3>
              <p className="text-muted-foreground">{comparison.recommendation.reason}</p>
              {comparison.recommendation.yearlySavings > 0 && (
                <Badge variant="secondary" className="mt-2">
                  <TrendingDown className="h-3 w-3 mr-1" />
                  Bis zu {formatCurrency(comparison.recommendation.yearlySavings)} Ersparnis/Jahr
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function MethodCard({ method, formatCurrency }: { method: CompanyCarResult; formatCurrency: (v: number) => string }) {
  return (
    <Card className={method.isRecommended ? 'border-primary ring-2 ring-primary/20' : ''}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{method.methodName}</CardTitle>
          {method.isRecommended && <Badge>Empfohlen</Badge>}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-3xl font-bold text-primary">{formatCurrency(method.netCostPerMonth)}<span className="text-sm font-normal text-muted-foreground">/Monat</span></div>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between"><span>Geldwerter Vorteil:</span><span>{formatCurrency(method.monthlyBenefitValue)}</span></div>
          <div className="flex justify-between"><span>+ Arbeitsweg:</span><span>{formatCurrency(method.commuteBenefit)}</span></div>
          <div className="flex justify-between font-medium border-t pt-1"><span>Gesamt/Monat:</span><span>{formatCurrency(method.totalMonthlyBenefit)}</span></div>
        </div>
      </CardContent>
    </Card>
  );
}
