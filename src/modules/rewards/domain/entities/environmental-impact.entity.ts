export class EnvironmentalImpact {
  constructor(
    public readonly userId: string,
    public totalKgRecycled: number = 0,
    public co2SavedKg: number = 0,
    public treesEquivalent: number = 0,
    public carbonScore: string = 'F',
    public lastUpdatedAt: Date = new Date(),
  ) {}

  // CO2 conversion factors per material type (kg CO2 saved per kg recycled)
  private static readonly CO2_CONVERSION_FACTORS: { [materialType: string]: number } = {
    plastic: 2.5,
    paper: 1.5,
    glass: 0.3,
    metal: 6.0,
    organic: 0.5,
    electronic: 8.0,
    textile: 3.0,
    default: 2.0,
  };

  // Trees equivalent: 1 tree absorbs ~22kg CO2 per year
  private static readonly CO2_PER_TREE = 22;

  addRecycledWeight(weight: number, materialType: string = 'default'): void {
    this.totalKgRecycled += weight;
    
    // Calculate CO2 savings based on material type
    const co2Factor = EnvironmentalImpact.CO2_CONVERSION_FACTORS[materialType] || 
                     EnvironmentalImpact.CO2_CONVERSION_FACTORS.default;
    const co2Saved = weight * co2Factor;
    this.co2SavedKg += co2Saved;
    
    // Update trees equivalent
    this.treesEquivalent = Math.floor(this.co2SavedKg / EnvironmentalImpact.CO2_PER_TREE);
    
    // Update carbon score
    this.updateCarbonScore();
    
    this.lastUpdatedAt = new Date();
  }

  private updateCarbonScore(): void {
    // Carbon score based on total CO2 saved
    if (this.co2SavedKg >= 500) {
      this.carbonScore = 'A+';
    } else if (this.co2SavedKg >= 300) {
      this.carbonScore = 'A';
    } else if (this.co2SavedKg >= 200) {
      this.carbonScore = 'B+';
    } else if (this.co2SavedKg >= 100) {
      this.carbonScore = 'B';
    } else if (this.co2SavedKg >= 50) {
      this.carbonScore = 'C+';
    } else if (this.co2SavedKg >= 25) {
      this.carbonScore = 'C';
    } else if (this.co2SavedKg >= 10) {
      this.carbonScore = 'D+';
    } else if (this.co2SavedKg >= 5) {
      this.carbonScore = 'D';
    } else {
      this.carbonScore = 'F';
    }
  }

  // Calculate water saved (liters per kg recycled)
  getWaterSaved(): number {
    // Average water saved per kg of recycled material
    const waterPerKg = 100; // liters
    return Math.round(this.totalKgRecycled * waterPerKg);
  }

  // Calculate energy saved (kWh per kg recycled)
  getEnergySaved(): number {
    // Average energy saved per kg of recycled material
    const energyPerKg = 3.5; // kWh
    return Math.round(this.totalKgRecycled * energyPerKg);
  }

  // Calculate landfill space saved (cubic meters per kg recycled)
  getLandfillSpaceSaved(): number {
    // Average landfill space saved per kg
    const spacePerKg = 0.003; // cubic meters
    return Math.round(this.totalKgRecycled * spacePerKg * 100) / 100;
  }

  static create(userId: string): EnvironmentalImpact {
    return new EnvironmentalImpact(userId);
  }
}
