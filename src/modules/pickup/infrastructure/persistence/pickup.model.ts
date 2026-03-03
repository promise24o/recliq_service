import { Schema, Document, Types } from 'mongoose';
import { PickupMode, MatchType, WasteType, PickupStatus, MatchingEventType, Coordinates, PickupPricing, MatchingEvent, AgentDetails } from '../../domain/types/pickup.types';

export interface PickupDocument extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  userName: string;
  userPhone: string;
  city: string;
  zone: string;
  pickupMode: PickupMode;
  matchType: MatchType;
  wasteType: WasteType;
  estimatedWeight: number;
  actualWeight?: number;
  status: PickupStatus;
  assignedAgentId?: Types.ObjectId;
  assignedAgentName?: string;
  assignedAgentDetails?: AgentDetails; // Populated from ref
  slaDeadline: Date;
  pricing: PickupPricing;
  coordinates: Coordinates;
  address: string;
  notes?: string;
  matchingTimeline: MatchingEvent[];
  failureReason?: string;
  delayReason?: string;
  completedAt?: Date;
  cancelledAt?: Date;
  cancellationReason?: string;
  escalatedTo?: Types.ObjectId;
  escalatedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const MatchingEventSchema = new Schema({
  id: { type: String, required: true },
  type: {
    type: String,
    enum: ['matching_started', 'agent_notified', 'agent_accepted', 'agent_rejected', 'agent_declined', 'reassigned', 'timeout', 'user_cancelled'],
    required: true,
  },
  timestamp: { type: String, required: true },
  agentId: { type: String },
  agentName: { type: String },
  details: { type: String, required: true },
}, { _id: false });

export const PickupSchema = new Schema<PickupDocument>({
  userId: { type: Schema.Types.ObjectId, required: true, index: true, ref: 'User' },
  userName: { type: String, required: true },
  userPhone: { type: String, required: true },
  city: { type: String, required: true, index: true },
  zone: { type: String, required: true, index: true },
  pickupMode: {
    type: String,
    enum: ['pickup', 'dropoff'],
    required: true,
  },
  matchType: {
    type: String,
    enum: ['auto', 'user_selected'],
    required: true,
  },
  wasteType: {
    type: String,
    enum: ['plastic', 'paper', 'metal', 'glass', 'organic', 'e_waste', 'mixed'],
    required: true,
  },
  estimatedWeight: { type: Number, required: true, min: 0 },
  actualWeight: { type: Number, min: 0 },
  status: {
    type: String,
    enum: ['new', 'matching', 'pending_acceptance', 'assigned', 'agent_en_route', 'arrived', 'completed', 'cancelled', 'failed'],
    default: 'new',
    index: true,
  },
  assignedAgentId: { type: Schema.Types.ObjectId, index: true, ref: 'User' },
  assignedAgentName: { type: String },
  slaDeadline: { type: Date, required: true },
  pricing: {
    baseAmount: { type: Number, required: true, min: 0 },
    bonusAmount: { type: Number, default: 0, min: 0 },
    totalAmount: { type: Number, required: true, min: 0 },
    currency: { type: String, required: true, default: 'NGN' },
  },
  coordinates: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
  },
  address: { type: String, required: true },
  notes: { type: String },
  matchingTimeline: [MatchingEventSchema],
  failureReason: { type: String },
  delayReason: { type: String },
  completedAt: { type: Date },
  cancelledAt: { type: Date },
  cancellationReason: { type: String },
  escalatedTo: { type: Schema.Types.ObjectId, ref: 'User' },
  escalatedAt: { type: Date },
}, {
  timestamps: true,
});

PickupSchema.index({ status: 1, city: 1 });
PickupSchema.index({ status: 1, slaDeadline: 1 });
PickupSchema.index({ createdAt: -1 });
PickupSchema.index({ 'coordinates': '2dsphere' });
