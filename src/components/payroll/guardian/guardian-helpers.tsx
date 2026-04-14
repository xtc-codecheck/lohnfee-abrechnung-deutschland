import { Badge } from '@/components/ui/badge';
import {
  TrendingUp,
  Clock,
  AlertCircle,
  AlertTriangle,
  Users,
  Activity,
} from 'lucide-react';

export const getSeverityColor = (severity: string) => {
  switch (severity) {
    case 'critical': return 'bg-red-500';
    case 'high': return 'bg-orange-500';
    case 'medium': return 'bg-yellow-500';
    case 'low': return 'bg-blue-500';
    default: return 'bg-muted';
  }
};

export const getSeverityBadge = (severity: string) => {
  switch (severity) {
    case 'critical': return <Badge variant="destructive">Kritisch</Badge>;
    case 'high': return <Badge className="bg-orange-500 hover:bg-orange-600">Hoch</Badge>;
    case 'medium': return <Badge className="bg-yellow-500 text-black hover:bg-yellow-600">Mittel</Badge>;
    case 'low': return <Badge variant="secondary">Niedrig</Badge>;
    default: return <Badge variant="outline">Unbekannt</Badge>;
  }
};

export const getAnomalyIcon = (type: string) => {
  switch (type) {
    case 'salary-spike':
    case 'salary-drop':
      return <TrendingUp className="h-4 w-4" />;
    case 'overtime-excessive':
      return <Clock className="h-4 w-4" />;
    case 'minimum-wage-violation':
      return <AlertCircle className="h-4 w-4" />;
    case 'working-time-violation':
      return <AlertTriangle className="h-4 w-4" />;
    case 'duplicate-entry':
    case 'missing-entry':
      return <Users className="h-4 w-4" />;
    default:
      return <Activity className="h-4 w-4" />;
  }
};
