import { Schema, Document, Types } from 'mongoose';
import { LatLng } from '../../domain/types/zone.types';

export interface CityDocument extends Document {
  _id: Types.ObjectId;
  name: string;
  state: string;
  center: LatLng;
  isActive: boolean;
  timezone: string;
  createdBy: string;
  lastChangedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export const CitySchema = new Schema<CityDocument>({
  name: { type: String, required: true, trim: true, unique: true },
  state: { type: String, required: true, trim: true },
  center: {
    lat: { type: Number, required: true, min: -90, max: 90 },
    lng: { type: Number, required: true, min: -180, max: 180 }
  },
  isActive: { type: Boolean, default: true },
  timezone: { type: String, required: true, default: 'Africa/Lagos' },
  createdBy: { type: String, required: true },
  lastChangedBy: { type: String }
}, { 
  timestamps: true,
});

// Add indexes for efficient queries
CitySchema.index({ name: 1 });
CitySchema.index({ state: 1 });
CitySchema.index({ isActive: 1 });
CitySchema.index({ center: '2dsphere' }); // For geospatial queries
