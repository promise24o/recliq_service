export class Phone {
  private constructor(private readonly value: string) {}

  static create(phone: string): Phone {
    if (!this.isValid(phone)) {
      throw new Error('Invalid phone number format');
    }
    return new Phone(this.normalize(phone));
  }

  static isValid(phone: string): boolean {
    // Nigerian phone number validation
    const phoneRegex = /^(\+234|0)[789]\d{9}$/;
    return phoneRegex.test(phone);
  }

  private static normalize(phone: string): string {
    if (phone.startsWith('0')) {
      return '+234' + phone.slice(1);
    }
    return phone;
  }

  getValue(): string {
    return this.value;
  }
}