import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronLeft, Car, PiggyBank, TrendingUp } from "lucide-react";
import { useEmployees } from "@/contexts/employee-context";
import { TravelExpensesTab } from "./travel-expenses-tab";
import { PensionBenefitsTab } from "./pension-benefits-tab";

interface ExtendedCalculationsProps {
  onBack: () => void;
}

export function ExtendedCalculations({ onBack }: ExtendedCalculationsProps) {
  const { employees } = useEmployees();
  const [selectedEmployee, setSelectedEmployee] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={onBack}>
          <ChevronLeft className="h-4 w-4 mr-2" />
          Zurück
        </Button>
        <h1 className="text-3xl font-bold">Erweiterte Berechnungen</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Car className="h-4 w-4" />Reisekosten Dezember
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€1.245</div>
            <p className="text-xs text-muted-foreground">8 Abrechnungen</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <PiggyBank className="h-4 w-4" />bAV-Beiträge
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€2.400</div>
            <p className="text-xs text-muted-foreground">Monatlich gesamt</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />VL-Leistungen
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€600</div>
            <p className="text-xs text-muted-foreground">Monatlich gesamt</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="travel" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="travel">Reisekosten</TabsTrigger>
          <TabsTrigger value="pension">bAV</TabsTrigger>
          <TabsTrigger value="capital">VL</TabsTrigger>
        </TabsList>
        <TabsContent value="travel">
          <TravelExpensesTab
            employees={employees}
            selectedEmployee={selectedEmployee}
            onSelectEmployee={setSelectedEmployee}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
          />
        </TabsContent>
        <TabsContent value="pension">
          <PensionBenefitsTab />
        </TabsContent>
        <TabsContent value="capital">
          <PensionBenefitsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
