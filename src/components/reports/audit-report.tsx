import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Shield, User, Edit, Eye, Trash2, Plus } from "lucide-react";
import { Employee } from "@/types/employee";
import { PayrollPeriod, PayrollEntry } from "@/types/payroll";

interface AuditReportProps {
  employees: Employee[];
  payrollPeriods: PayrollPeriod[];
  payrollEntries: PayrollEntry[];
  dateRange: { from: Date; to: Date };
  selectedDepartment: string;
}

interface AuditLogEntry {
  id: string;
  timestamp: Date;
  user: string;
  action: 'create' | 'update' | 'delete' | 'view';
  entity: 'employee' | 'payroll' | 'salary' | 'system';
  entityId: string;
  entityName: string;
  changes: Record<string, { old: any; new: any }>;
  ipAddress: string;
  userAgent: string;
  riskLevel: 'low' | 'medium' | 'high';
}

export function AuditReport({
  employees,
  payrollPeriods,
  payrollEntries,
  dateRange,
  selectedDepartment
}: AuditReportProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterAction, setFilterAction] = useState<string>("all");
  const [filterEntity, setFilterEntity] = useState<string>("all");
  const [filterRiskLevel, setFilterRiskLevel] = useState<string>("all");

  const auditData = useMemo(() => {
    // Generate realistic audit log entries
    const generateAuditLogs = (): AuditLogEntry[] => {
      const users = ['admin@firma.de', 'hr@firma.de', 'buchhaltung@firma.de', 'manager@firma.de'];
      const actions: AuditLogEntry['action'][] = ['create', 'update', 'delete', 'view'];
      const entities: AuditLogEntry['entity'][] = ['employee', 'payroll', 'salary', 'system'];
      const riskLevels: AuditLogEntry['riskLevel'][] = ['low', 'medium', 'high'];
      
      return Array.from({ length: 50 }, (_, i) => {
        const timestamp = new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000); // Last 90 days
        const action = actions[Math.floor(Math.random() * actions.length)];
        const entity = entities[Math.floor(Math.random() * entities.length)];
        const user = users[Math.floor(Math.random() * users.length)];
        
        let entityName = '';
        let changes = {};
        let riskLevel: AuditLogEntry['riskLevel'] = 'low';

        switch (entity) {
          case 'employee':
            entityName = employees[Math.floor(Math.random() * employees.length)]?.personalData.firstName + ' ' + 
                        employees[Math.floor(Math.random() * employees.length)]?.personalData.lastName || 'Max Mustermann';
            if (action === 'update') {
              changes = {
                'grossSalary': { old: 3500, new: 3800 },
                'taxClass': { old: 'I', new: 'III' }
              };
              riskLevel = 'medium';
            }
            break;
          case 'payroll':
            entityName = `Lohnlauf ${timestamp.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })}`;
            if (action === 'delete') {
              riskLevel = 'high';
            }
            break;
          case 'salary':
            entityName = 'Gehaltsabrechnung';
            if (action === 'update') {
              changes = {
                'finalNetSalary': { old: 2800, new: 2850 },
                'deductions': { old: 200, new: 150 }
              };
              riskLevel = 'medium';
            }
            break;
          case 'system':
            entityName = 'Systemeinstellungen';
            if (action === 'update') {
              riskLevel = 'low';
            }
            break;
        }

        return {
          id: `audit_${i + 1}`,
          timestamp,
          user,
          action,
          entity,
          entityId: `${entity}_${Math.random().toString(36).substr(2, 9)}`,
          entityName,
          changes,
          ipAddress: `192.168.1.${Math.floor(Math.random() * 255)}`,
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          riskLevel
        };
      }).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    };

    const allLogs = generateAuditLogs();

    // Filter logs
    const filteredLogs = allLogs.filter(log => {
      const matchesSearch = searchTerm === '' || 
        log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.entityName.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesAction = filterAction === 'all' || log.action === filterAction;
      const matchesEntity = filterEntity === 'all' || log.entity === filterEntity;
      const matchesRiskLevel = filterRiskLevel === 'all' || log.riskLevel === filterRiskLevel;
      const matchesDateRange = log.timestamp >= dateRange.from && log.timestamp <= dateRange.to;

      return matchesSearch && matchesAction && matchesEntity && matchesRiskLevel && matchesDateRange;
    });

    // Calculate statistics
    const stats = {
      totalLogs: filteredLogs.length,
      highRiskLogs: filteredLogs.filter(log => log.riskLevel === 'high').length,
      mediumRiskLogs: filteredLogs.filter(log => log.riskLevel === 'medium').length,
      lowRiskLogs: filteredLogs.filter(log => log.riskLevel === 'low').length,
      uniqueUsers: new Set(filteredLogs.map(log => log.user)).size,
      actionBreakdown: {
        create: filteredLogs.filter(log => log.action === 'create').length,
        update: filteredLogs.filter(log => log.action === 'update').length,
        delete: filteredLogs.filter(log => log.action === 'delete').length,
        view: filteredLogs.filter(log => log.action === 'view').length
      }
    };

    return { filteredLogs, stats };
  }, [employees, payrollPeriods, payrollEntries, dateRange, searchTerm, filterAction, filterEntity, filterRiskLevel]);

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'create': return <Plus className="h-4 w-4" />;
      case 'update': return <Edit className="h-4 w-4" />;
      case 'delete': return <Trash2 className="h-4 w-4" />;
      case 'view': return <Eye className="h-4 w-4" />;
      default: return <Eye className="h-4 w-4" />;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'create': return 'text-green-600 bg-green-100';
      case 'update': return 'text-blue-600 bg-blue-100';
      case 'delete': return 'text-red-600 bg-red-100';
      case 'view': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getRiskLevelColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Gesamte Logs</p>
                <p className="text-2xl font-bold">{auditData.stats.totalLogs}</p>
              </div>
              <Shield className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Hohe Risiken</p>
                <p className="text-2xl font-bold text-red-600">{auditData.stats.highRiskLogs}</p>
              </div>
              <Trash2 className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Aktive Benutzer</p>
                <p className="text-2xl font-bold">{auditData.stats.uniqueUsers}</p>
              </div>
              <User className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Änderungen</p>
                <p className="text-2xl font-bold">{auditData.stats.actionBreakdown.update}</p>
              </div>
              <Edit className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filter & Suche</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Input
              placeholder="Benutzer oder Entität suchen..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            
            <Select value={filterAction} onValueChange={setFilterAction}>
              <SelectTrigger>
                <SelectValue placeholder="Aktion" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Aktionen</SelectItem>
                <SelectItem value="create">Erstellen</SelectItem>
                <SelectItem value="update">Ändern</SelectItem>
                <SelectItem value="delete">Löschen</SelectItem>
                <SelectItem value="view">Anzeigen</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterEntity} onValueChange={setFilterEntity}>
              <SelectTrigger>
                <SelectValue placeholder="Entität" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Entitäten</SelectItem>
                <SelectItem value="employee">Mitarbeiter</SelectItem>
                <SelectItem value="payroll">Lohnabrechnung</SelectItem>
                <SelectItem value="salary">Gehalt</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterRiskLevel} onValueChange={setFilterRiskLevel}>
              <SelectTrigger>
                <SelectValue placeholder="Risiko" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Risikostufen</SelectItem>
                <SelectItem value="high">Hoch</SelectItem>
                <SelectItem value="medium">Mittel</SelectItem>
                <SelectItem value="low">Niedrig</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Audit Log Table */}
      <Card>
        <CardHeader>
          <CardTitle>Audit-Protokoll</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Zeitstempel</TableHead>
                <TableHead>Benutzer</TableHead>
                <TableHead>Aktion</TableHead>
                <TableHead>Entität</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Änderungen</TableHead>
                <TableHead>Risiko</TableHead>
                <TableHead>IP-Adresse</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {auditData.filteredLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="text-sm">
                    {log.timestamp.toLocaleString('de-DE')}
                  </TableCell>
                  <TableCell>{log.user}</TableCell>
                  <TableCell>
                    <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${getActionColor(log.action)}`}>
                      {getActionIcon(log.action)}
                      <span className="ml-1 capitalize">{log.action}</span>
                    </div>
                  </TableCell>
                  <TableCell className="capitalize">{log.entity}</TableCell>
                  <TableCell>{log.entityName}</TableCell>
                  <TableCell>
                    {Object.keys(log.changes).length > 0 ? (
                      <div className="text-xs">
                        {Object.entries(log.changes).map(([key, change]) => (
                          <div key={key}>
                            <span className="font-medium">{key}:</span> {change.old} → {change.new}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant="secondary"
                      className={`text-white ${getRiskLevelColor(log.riskLevel)}`}
                    >
                      {log.riskLevel}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm font-mono">{log.ipAddress}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}