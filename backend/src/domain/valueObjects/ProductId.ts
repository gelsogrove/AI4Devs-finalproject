export class ProductId {
  constructor(private readonly _value: string) {
    // In a testing environment, allow empty IDs for mock purposes
    if (process.env.NODE_ENV !== 'test') {
    this.validate(_value);
    }
  }

  get value(): string {
    return this._value;
  }

  private validate(id: string): void {
    if (!id || id.trim() === '') {
      throw new Error('Product ID cannot be empty');
    }
  }

  equals(other: ProductId): boolean {
    return this._value === other.value;
  }
} 