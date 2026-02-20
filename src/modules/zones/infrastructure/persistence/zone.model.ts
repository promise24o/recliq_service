import { Schema, Document, Types } from 'mongoose';
import { ZoneStatus, SLATier, CoverageLevel, DemandIntensity, LatLng, PickupWindow, ZonePerformance } from '../../domain/types/zone.types';

export interface ZoneDocument extends Document {
  _id: Types.ObjectId;
  name: string;
  city: string;
  state: string;
  description: string;
  boundary: {
    polygon: LatLng[];
    center: LatLng;
    areaKm2: number;
  };
  status: ZoneStatus;
  coverageLevel: CoverageLevel;
  activeAgents: number;
  totalAgents: number;
  pricingRuleId: string;
  pricingRuleName: string;
  slaTier: SLATier;
  pickupAvailability: PickupWindow[];
  dropoffEligible: boolean;
  avgPickupsPerDay: number;
  avgDropoffsPerDay: number;
  demandIntensity: DemandIntensity;
  coverageGapPercent: number;
  enterpriseClients: string[];
  contractOverrides: number;
  performance: ZonePerformance;
  version: number;
  createdBy: string;
  lastChangedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export const ZoneSchema = new Schema<ZoneDocument>({
  name: { type: String, required: true, trim: true },
  city: { type: String, required: true, trim: true },
  state: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  boundary: {
    polygon: [{
      lat: { type: Number, required: true },
      lng: { type: Number, required: true }
    }],
    center: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true }
    },
    areaKm2: { type: Number, required: true, min: 0 }
  },
  status: { type: String, enum: Object.values(['active', 'inactive', 'pending']), default: 'active' },
  coverageLevel: { type: String, enum: Object.values(['high', 'medium', 'low', 'critical']), required: true },
  activeAgents: { type: Number, default: 0, min: 0 },
  totalAgents: { type: Number, required: true, min: 0 },
  pricingRuleId: { type: String, required: true },
  pricingRuleName: { type: String, required: true },
  slaTier: { type: String, enum: Object.values(['platinum', 'gold', 'silver', 'bronze']), required: true },
  pickupAvailability: [{
    day: { type: String, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true }
  }],
  dropoffEligible: { type: Boolean, default: false },
  avgPickupsPerDay: { type: Number, default: 0, min: 0 },
  avgDropoffsPerDay: { type: Number, default: 0, min: 0 },
  demandIntensity: { type: String, enum: Object.values(['high', 'medium', 'low']), required: true },
  coverageGapPercent: { type: Number, default: 0, min: 0, max: 100 },
  enterpriseClients: [{ type: String }],
  contractOverrides: { type: Number, default: 0, min: 0 },
  performance: {
    avgPickupTimeMins: { type: Number, default: 0, min: 0 },
    completionRatePercent: { type: Number, default: 0, min: 0, max: 100 },
    agentIdlePercent: { type: Number, default: 0, min: 0, max: 100 },
    slaCompliancePercent: { type: Number, default: 0, min: 0, max: 100 },
    utilizationPercent: { type: Number, default: 0, min: 0, max: 100 }
  },
  version: { type: Number, default: 1 },
  createdBy: { type: String, required: true },
  lastChangedBy: { type: String }
}, { 
  timestamps: true,
});

// Add indexes for efficient queries
ZoneSchema.index({ city: 1, status: 1 });
ZoneSchema.index({ state: 1 });
ZoneSchema.index({ coverageLevel: 1 });
ZoneSchema.index({ 'boundary.center': '2dsphere' }); // For geospatial queries
