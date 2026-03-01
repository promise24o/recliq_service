import type { VehicleDetailsDocument } from '../../infrastructure/persistence/vehicle-details.model';

export interface IVehicleDetailsRepository {
  findById(id: string): Promise<VehicleDetailsDocument | null>;
  findByUserId(userId: string): Promise<VehicleDetailsDocument | null>;
  create(userId: string, data: any): Promise<VehicleDetailsDocument>;
  update(userId: string, data: any): Promise<VehicleDetailsDocument>;
  updateStatus(userId: string, isActive: boolean, isUnderMaintenance: boolean): Promise<VehicleDetailsDocument>;
  addDocument(userId: string, document: any): Promise<VehicleDetailsDocument>;
  updateDocumentStatus(userId: string, documentIndex: number, status: string, reason?: string): Promise<VehicleDetailsDocument>;
  updateApprovalStatus(userId: string, status: string, approvedBy: string, reason?: string): Promise<VehicleDetailsDocument>;
  updateEnterpriseEligibility(userId: string, isEligible: boolean): Promise<VehicleDetailsDocument>;
  findByStatus(page: number, limit: number, status?: string): Promise<{ vehicles: VehicleDetailsDocument[], total: number }>;
  delete(userId: string): Promise<void>;
}
