import { 
  ActivityAction, 
  RiskLevel, 
  ActivitySource, 
  ActivityOutcome 
} from '../../infrastructure/persistence/activity-log.model';
import { 
  SecuritySignalType, 
  SecuritySignalSeverity 
} from '../../infrastructure/persistence/security-signal.model';

export interface ActivityEvent {
  id: string;
  userId: string;
  timestamp: string;
  action: ActivityAction;
  actionLabel: string;
  description: string;
  entityType: string;
  entityId: string;
  entityName: string;
  outcome: ActivityOutcome;
  riskLevel: RiskLevel;
  source: ActivitySource;
  ipAddress: string;
  device: string;
  location: string;
  beforeState?: string;
  afterState?: string;
  reason?: string;
  auditRef?: string;
}

export interface ActivitySummary {
  recentLogins: number;
  actionsPerformed: number;
  sensitiveActions: number;
  distinctLocations: number;
  lastActivityTime: string;
}

export interface SecuritySignal {
  id: string;
  userId: string;
  type: SecuritySignalType;
  severity: SecuritySignalSeverity;
  title: string;
  description: string;
  timestamp: string;
  acknowledged: boolean;
  acknowledgedAt?: string;
  metadata?: Record<string, any>;
}

export interface ActivityFilter {
  userId?: string;
  action?: ActivityAction;
  dateFrom?: Date | string;
  dateTo?: Date | string;
  riskLevel?: RiskLevel;
  source?: ActivitySource;
  outcome?: ActivityOutcome;
  entityType?: string;
  entityId?: string;
}

export interface SecuritySignalFilter {
  userId?: string;
  type?: SecuritySignalType;
  severity?: SecuritySignalSeverity;
  acknowledged?: boolean;
  dateFrom?: Date | string;
  dateTo?: Date | string;
}
