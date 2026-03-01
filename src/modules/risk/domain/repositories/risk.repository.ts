import { RiskEvent, RiskEventType, RiskState } from '../types/risk.types';

export interface IRiskRepository {
  createRiskEvent(riskEvent: RiskEvent): Promise<void>;
  getRiskEventsByUserId(userId: string): Promise<RiskEvent[]>;
  getAllRiskEvents(): Promise<RiskEvent[]>;
  getRiskEventsByType(type: RiskEventType): Promise<RiskEvent[]>;
  getRiskEventsByDateRange(startDate: Date, endDate: Date): Promise<RiskEvent[]>;
  updateRiskEvent(id: string, updates: Partial<RiskEvent>): Promise<RiskEvent | null>;
  deleteRiskEvent(id: string): Promise<void>;
  getRiskUsersByState(riskState: RiskState): Promise<string[]>;
  getExpiringSuspensions(days: number): Promise<RiskEvent[]>;
}
