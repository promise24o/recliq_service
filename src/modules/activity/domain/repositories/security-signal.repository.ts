import { SecuritySignalDocument } from '../../infrastructure/persistence/security-signal.model';
import { SecuritySignal, SecuritySignalFilter } from '../types/activity.types';

export interface ISecuritySignalRepository {
  create(securitySignal: Partial<SecuritySignalDocument>): Promise<SecuritySignalDocument>;
  findById(id: string): Promise<SecuritySignalDocument | null>;
  findByUser(userId: string, includeAcknowledged?: boolean): Promise<SecuritySignalDocument[]>;
  findByFilter(filter: SecuritySignalFilter, limit?: number, skip?: number): Promise<SecuritySignalDocument[]>;
  countByFilter(filter: SecuritySignalFilter): Promise<number>;
  acknowledgeSignal(id: string): Promise<SecuritySignalDocument | null>;
  acknowledgeAllSignals(userId: string): Promise<number>;
}
