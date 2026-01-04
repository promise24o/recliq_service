import { Injectable } from '@nestjs/common';

@Injectable()
export class ReferralCodeUtil {
  private static readonly CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  private static readonly CODE_LENGTH = 6;

  /**
   * Generate a unique 6-character alphanumeric referral code in all caps
   * @returns A 6-character string like 'A1B2C3'
   */
  static generateReferralCode(): string {
    let code = '';
    for (let i = 0; i < ReferralCodeUtil.CODE_LENGTH; i++) {
      const randomIndex = Math.floor(Math.random() * ReferralCodeUtil.CHARS.length);
      code += ReferralCodeUtil.CHARS[randomIndex];
    }
    return code;
  }

  /**
   * Generate multiple unique referral codes
   * @param count Number of codes to generate
   * @returns Array of unique referral codes
   */
  static generateMultipleReferralCodes(count: number): string[] {
    const codes = new Set<string>();
    
    while (codes.size < count) {
      codes.add(ReferralCodeUtil.generateReferralCode());
    }
    
    return Array.from(codes);
  }

  /**
   * Validate if a string is a valid referral code format
   * @param code The code to validate
   * @returns True if valid, false otherwise
   */
  static isValidReferralCode(code: string): boolean {
    if (!code || code.length !== ReferralCodeUtil.CODE_LENGTH) {
      return false;
    }
    
    // Check if all characters are valid alphanumeric characters
    const validPattern = /^[A-Z0-9]+$/;
    return validPattern.test(code);
  }
}
