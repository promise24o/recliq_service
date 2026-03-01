import { Schema, Document, Types } from 'mongoose';

import { DocumentStatus, VehicleStatus } from '../../domain/constants/vehicle.constants';

export interface VehicleDocument {
  documentType: string;
  documentUrl: string;
  status: DocumentStatus;
  uploadedAt: Date;
  verifiedAt?: Date;
  rejectionReason?: string;
}

export interface VehicleDetailsDocument extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  vehicleType: 'motorcycle' | 'tricycle' | 'car' | 'mini_truck' | 'truck' | 'specialized_recycling';
  maxLoadWeight: number;
  maxLoadVolume?: number;
  materialCompatibility: string[];
  plateNumber: string;
  vehicleColor: string;
  registrationExpiryDate: Date;
  insuranceExpiryDate?: Date;
  documents: VehicleDocument[];
  fuelType: 'petrol' | 'diesel' | 'electric' | 'hybrid';
  status: VehicleStatus;
  isActive: boolean;
  isUnderMaintenance: boolean;
  isEnterpriseEligible: boolean;
  approvedAt?: Date;
  approvedBy?: Types.ObjectId;
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const VehicleDocumentSchema = new Schema({
  documentType: { type: String, required: true },
  documentUrl: { type: String, required: true },
  status: { type: String, enum: Object.values(DocumentStatus), default: DocumentStatus.PENDING },
  uploadedAt: { type: Date, default: Date.now },
  verifiedAt: { type: Date },
  rejectionReason: { type: String }
}, { _id: false });

export const VehicleDetailsSchema = new Schema<VehicleDetailsDocument>({
  userId: { type: Schema.Types.ObjectId, required: true, unique: true, index: true },
  vehicleType: { 
    type: String, 
    enum: ['motorcycle', 'tricycle', 'car', 'mini_truck', 'truck', 'specialized_recycling'], 
    required: true 
  },
  maxLoadWeight: { type: Number, required: true, min: 1 },
  maxLoadVolume: { type: Number, min: 0 },
  materialCompatibility: { type: [String], default: [] },
  plateNumber: { type: String, required: true },
  vehicleColor: { type: String, required: true },
  registrationExpiryDate: { type: Date, required: true },
  insuranceExpiryDate: { type: Date },
  documents: { type: [VehicleDocumentSchema], default: [] },
  fuelType: { 
    type: String, 
    enum: ['petrol', 'diesel', 'electric', 'hybrid'], 
    default: 'petrol' 
  },
  status: { 
    type: String, 
    enum: Object.values(VehicleStatus), 
    default: VehicleStatus.PENDING 
  },
  isActive: { type: Boolean, default: true },
  isUnderMaintenance: { type: Boolean, default: false },
  isEnterpriseEligible: { type: Boolean, default: false },
  approvedAt: { type: Date },
  approvedBy: { type: Schema.Types.ObjectId },
  rejectionReason: { type: String }
}, {
  timestamps: true,
  collection: 'vehicle_details'
});
