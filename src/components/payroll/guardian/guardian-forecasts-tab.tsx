import { ChevronRight, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { SalaryForecast } from '@/types/payroll-guardian';
import { Employee } from '@/types/employee';

interface GuardianForecastsTabProps {
  employees: Employee[];
  forecasts: SalaryForecast[];
  selectedEmployee: string | null;
  onSelectEmployee: (id: string) => void;
}

export function GuardianForecastsTab({ employees, forecasts, selectedEmployee, onSelectEmployee }: GuardianForecastsTabProps) {
  const selectedForecast = selectedEmployee
    ? forecasts.find(f => f.employeeId === selectedEmployee)
    : null;

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {/* Employee List */}
      <Card className="md:col-span-1">
        <CardHeader>
          <CardTitle className="text-lg">Mitarbeiter</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px]">
            {employees.map(employee => (
              <div
                key={employee.id}
                className={`p-3 rounded-lg cursor-pointer transition-colors mb-2 ${
                  selectedEmployee === employee.id
                    ? 'bg-primary/10 border border-primary'
                    : 'hover:bg-muted'
                }`}
                onClick={() => onSelectEmployee(employee.id)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">
                      {employee.personalData.firstName} {employee.personalData.lastName}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {employee.employmentData.position}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            ))}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Forecast Detail */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="text-lg">
            {selectedForecast ? `Prognose: ${selectedForecast.employeeName}` : 'Wählen Sie einen Mitarbeiter'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {selectedForecast ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">Aktuelles Gehalt</p>
                  <p className="text-2xl font-bold">
                    {selectedForecast.currentSalary.toLocaleString('de-DE')} €
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Marktposition</p>
                  <p className="text-lg font-semibold">
                    {selectedForecast.marketComparison.percentile}. Perzentil
                  </p>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-3">5-Jahres-Prognose</h4>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={selectedForecast.projections.slice(0, 5)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="year" />
                      <YAxis tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`} />
                      <Tooltip formatter={(value: number) => [`${value.toLocaleString('de-DE')} €`, 'Prognose']} />
                      <Line
                        type="monotone"
                        dataKey="projectedSalary"
                        stroke="hsl(var(--primary))"
                        strokeWidth={2}
                        dot={{ fill: 'hsl(var(--primary))' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-3">Karriere-Meilensteine</h4>
                <div className="space-y-2">
                  {selectedForecast.careerPath.slice(0, 3).map((milestone, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{milestone.event}</p>
                        <p className="text-sm text-muted-foreground">Jahr {milestone.year}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-green-600 font-medium">
                          +{milestone.salaryImpact.toLocaleString('de-DE')} €
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {(milestone.probability * 100).toFixed(0)}% Wahrscheinlichkeit
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-3">Optimierungspotenzial</h4>
                <div className="space-y-2">
                  {selectedForecast.optimizationPotential.slice(0, 3).map((opt, idx) => (
                    <div key={idx} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-medium">{opt.title}</p>
                        <Badge variant="outline">
                          +{opt.potentialSaving.toLocaleString('de-DE')} €/Jahr
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{opt.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="h-[500px] flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <BarChart3 className="h-12 w-12 mx-auto mb-4" />
                <p>Wählen Sie einen Mitarbeiter aus der Liste,</p>
                <p>um dessen Gehaltsprognose zu sehen.</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
