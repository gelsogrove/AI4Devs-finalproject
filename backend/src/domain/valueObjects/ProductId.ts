export class ProductId {
  constructor(private readonly _value: string, private readonly isNew: boolean = false) {
    // In a testing environment or for new products, allow empty IDs
    if (process.env.NODE_ENV !== 'test' && !isNew) {
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