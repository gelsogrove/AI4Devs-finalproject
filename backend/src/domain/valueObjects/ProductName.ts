export class ProductName {
  constructor(private readonly _value: string) {
    this.validate(_value);
  }

  get value(): string {
    return this._value;
  }

  private validate(name: string): void {
    if (!name || name.trim() === '') {
      throw new Error('Product name cannot be empty');
    }

    if (name.length < 3) {
      throw new Error('Product name must be at least 3 characters long');
    }

    if (name.length > 100) {
      throw new Error('Product name cannot exceed 100 characters');
    }
  }

  equals(other: ProductName): boolean {
    return this._value === other.value;
  }
} 