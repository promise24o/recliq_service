export enum VehicleType {
  MOTORCYCLE = 'motorcycle',
  TRICYCLE = 'tricycle',
  CAR = 'car',
  MINI_TRUCK = 'mini_truck',
  TRUCK = 'truck',
  SPECIALIZED_RECYCLING = 'specialized_recycling'
}

export enum FuelType {
  PETROL = 'petrol',
  DIESEL = 'diesel',
  ELECTRIC = 'electric',
  HYBRID = 'hybrid'
}

export enum DocumentType {
  REGISTRATION = 'registration',
  INSURANCE = 'insurance',
  ROADWORTHINESS = 'roadworthiness',
  INSPECTION_CERTIFICATE = 'inspection_certificate'
}

export enum DocumentStatus {
  PENDING = 'pending',
  VERIFIED = 'verified',
  REJECTED = 'rejected'
}

export enum VehicleStatus {
  PENDING = 'pending',
  UNDER_REVIEW = 'under_review',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  UNDER_MAINTENANCE = 'under_maintenance',
  TEMPORARILY_UNAVAILABLE = 'temporarily_unavailable'
}

export enum MaterialType {
  PET = 'PET',
  METALS = 'Metals',
  MIXED = 'Mixed',
  E_WASTE = 'E-waste',
  ORGANIC = 'Organic',
  PAPER = 'Paper',
  PLASTIC = 'Plastic',
  GLASS = 'Glass',
  TEXTILES = 'Textiles',
  BATTERIES = 'Batteries'
}


export const VEHICLE_TYPE_LABELS = {
  [VehicleType.MOTORCYCLE]: 'Motorcycle',
  [VehicleType.TRICYCLE]: 'Tricycle (Keke)',
  [VehicleType.CAR]: 'Car',
  [VehicleType.MINI_TRUCK]: 'Mini Truck',
  [VehicleType.TRUCK]: 'Truck',
  [VehicleType.SPECIALIZED_RECYCLING]: 'Specialized Recycling Truck'
};

export const FUEL_TYPE_LABELS = {
  [FuelType.PETROL]: 'Petrol',
  [FuelType.DIESEL]: 'Diesel',
  [FuelType.ELECTRIC]: 'Electric',
  [FuelType.HYBRID]: 'Hybrid'
};

export const DOCUMENT_TYPE_LABELS = {
  [DocumentType.REGISTRATION]: 'Vehicle Registration',
  [DocumentType.INSURANCE]: 'Insurance',
  [DocumentType.ROADWORTHINESS]: 'Roadworthiness Certificate',
  [DocumentType.INSPECTION_CERTIFICATE]: 'Inspection Certificate'
};

export const MATERIAL_TYPE_LABELS = {
  [MaterialType.PET]: 'PET Plastic',
  [MaterialType.METALS]: 'Metals',
  [MaterialType.MIXED]: 'Mixed Waste',
  [MaterialType.E_WASTE]: 'E-waste',
  [MaterialType.ORGANIC]: 'Organic',
  [MaterialType.PAPER]: 'Paper',
  [MaterialType.PLASTIC]: 'Plastic',
  [MaterialType.GLASS]: 'Glass',
  [MaterialType.TEXTILES]: 'Textiles',
  [MaterialType.BATTERIES]: 'Batteries'
};

export const VEHICLE_CAPACITY_LIMITS = {
  [VehicleType.MOTORCYCLE]: { min: 10, max: 50 },
  [VehicleType.TRICYCLE]: { min: 50, max: 200 },
  [VehicleType.CAR]: { min: 100, max: 500 },
  [VehicleType.MINI_TRUCK]: { min: 500, max: 1500 },
  [VehicleType.TRUCK]: { min: 1000, max: 5000 },
  [VehicleType.SPECIALIZED_RECYCLING]: { min: 2000, max: 10000 }
};

export const ENTERPRISE_ELIGIBILITY_RULES = {
  MIN_LOAD_WEIGHT: 500,
  REQUIRED_VERIFIED_DOCUMENTS: 1,
  MUST_BE_ACTIVE: true,
  MUST_NOT_BE_UNDER_MAINTENANCE: true
};
