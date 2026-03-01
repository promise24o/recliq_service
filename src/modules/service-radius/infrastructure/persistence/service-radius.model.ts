import { Schema, Document, Types } from 'mongoose';

export interface ServiceRadiusDocument extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  radius: number; // in kilometers (1-30)
  autoExpandRadius: boolean;
  restrictDuringPeakHours: boolean;
  serviceZones: string[]; // zone IDs
  currentLocation?: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
  createdAt: Date;
  updatedAt: Date;
}

export const ServiceRadiusSchema = new Schema<ServiceRadiusDocument>(
  {
    userId: { 
      type: Schema.Types.ObjectId, 
      ref: 'User', 
      required: true,
      unique: true,
      index: true 
    },
    radius: { 
      type: Number, 
      required: true,
      default: 5,
      min: 1,
      max: 30 
    },
    autoExpandRadius: { 
      type: Boolean, 
      default: false 
    },
    restrictDuringPeakHours: { 
      type: Boolean, 
      default: false 
    },
    serviceZones: [{ 
      type: String 
    }],
    currentLocation: {
      type: { type: String, enum: ['Point'] },
      coordinates: { type: [Number] }
    }
  },
  {
    timestamps: true,
    collection: 'service_radius'
  }
);

// Create geospatial index for location-based queries
ServiceRadiusSchema.index({ currentLocation: '2dsphere' });
