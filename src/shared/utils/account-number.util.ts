/**
 * Utility for generating unique account numbers
 */
export class AccountNumberUtil {
  /**
   * Generates a unique 10-digit account number
   * Format: XXXXXXXXXX (10 digits)
   */
  static generateAccountNumber(): string {
    // Generate 10 random digits
    const digits = Array.from({ length: 10 }, () => Math.floor(Math.random() * 10));
    
    // Ensure the first digit is not 0 (for better formatting)
    if (digits[0] === 0) {
      digits[0] = Math.floor(Math.random() * 9) + 1;
    }
    
    return digits.join('');
  }

  /**
   * Validates if a string is a valid 10-digit account number
   */
  static isValidAccountNumber(accountNumber: string): boolean {
    return /^\d{10}$/.test(accountNumber);
  }

  /**
   * Formats account number for display (adds spaces for readability)
   * Example: "3447838348" -> "3447 8383 48"
   */
  static formatAccountNumber(accountNumber: string): string {
    if (!this.isValidAccountNumber(accountNumber)) {
      return accountNumber;
    }
    
    return accountNumber.replace(/(\d{4})(\d{4})(\d{2})/, '$1 $2 $3');
  }

  /**
   * Generates account number and ensures it doesn't exist in the provided list
   */
  static async generateUniqueAccountNumber(
    existingAccountNumbers: string[] = []
  ): Promise<string> {
    let accountNumber: string;
    let attempts = 0;
    const maxAttempts = 100;

    do {
      accountNumber = this.generateAccountNumber();
      attempts++;
      
      if (attempts >= maxAttempts) {
        throw new Error('Failed to generate unique account number after maximum attempts');
      }
    } while (existingAccountNumbers.includes(accountNumber));

    return accountNumber;
  }
}
