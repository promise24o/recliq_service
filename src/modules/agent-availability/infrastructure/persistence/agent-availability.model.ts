import { Schema, Document, Types } from 'mongoose';

export interface TimeSlot {
  startTime: string;
  endTime: string;
}

export interface DaySchedule {
  enabled: boolean;
  timeSlots: TimeSlot[];
}

export interface WeeklySchedule {
  monday: DaySchedule;
  tuesday: DaySchedule;
  wednesday: DaySchedule;
  thursday: DaySchedule;
  friday: DaySchedule;
  saturday: DaySchedule;
  sunday: DaySchedule;
}

export interface AvailabilityInsights {
  avgWeeklyEarnings: number;
  peakHoursStart: string;
  peakHoursEnd: string;
  totalHoursPerWeek: number;
  lastUpdated: Date;
}

export interface AgentAvailabilityDocument extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  agentId: string;
  agentName: string;
  isOnline: boolean;
  currentLocation?: {
    lat: number;
    lng: number;
  };
  city?: string;
  zone?: string;
  rating?: number;
  vehicleType?: string;
  weeklySchedule: WeeklySchedule;
  availableForEnterpriseJobs: boolean;
  autoGoOnlineDuringSchedule: boolean;
  insights: AvailabilityInsights;
  createdAt: Date;
  updatedAt: Date;
}

const TimeSlotSchema = new Schema({
  startTime: { type: String, required: true },
  endTime: { type: String, required: true }
}, { _id: false });

const DayScheduleSchema = new Schema({
  enabled: { type: Boolean, default: false },
  timeSlots: { type: [TimeSlotSchema], default: [] }
}, { _id: false });

const WeeklyScheduleSchema = new Schema({
  monday: { type: DayScheduleSchema, default: { enabled: false, timeSlots: [] } },
  tuesday: { type: DayScheduleSchema, default: { enabled: false, timeSlots: [] } },
  wednesday: { type: DayScheduleSchema, default: { enabled: false, timeSlots: [] } },
  thursday: { type: DayScheduleSchema, default: { enabled: false, timeSlots: [] } },
  friday: { type: DayScheduleSchema, default: { enabled: false, timeSlots: [] } },
  saturday: { type: DayScheduleSchema, default: { enabled: false, timeSlots: [] } },
  sunday: { type: DayScheduleSchema, default: { enabled: false, timeSlots: [] } }
}, { _id: false });

const AvailabilityInsightsSchema = new Schema({
  avgWeeklyEarnings: { type: Number, default: 0 },
  peakHoursStart: { type: String, default: '18:00' },
  peakHoursEnd: { type: String, default: '20:00' },
  totalHoursPerWeek: { type: Number, default: 0 },
  lastUpdated: { type: Date, default: Date.now }
}, { _id: false });

export const AgentAvailabilitySchema = new Schema<AgentAvailabilityDocument>({
  userId: { type: Schema.Types.ObjectId, required: true, unique: true, index: true },
  agentId: { type: String, required: true, index: true },
  agentName: { type: String, required: true },
  isOnline: { type: Boolean, default: false, index: true },
  currentLocation: {
    lat: { type: Number },
    lng: { type: Number }
  },
  city: { type: String, index: true },
  zone: { type: String, index: true },
  rating: { type: Number, default: 0 },
  vehicleType: { type: String },
  weeklySchedule: { type: WeeklyScheduleSchema, required: true },
  availableForEnterpriseJobs: { type: Boolean, default: false },
  autoGoOnlineDuringSchedule: { type: Boolean, default: false },
  insights: { type: AvailabilityInsightsSchema, default: {} }
}, {
  timestamps: true,
  collection: 'agent_availability'
});

AgentAvailabilitySchema.index({ isOnline: 1, city: 1, zone: 1 });
AgentAvailabilitySchema.index({ currentLocation: '2dsphere' });
