export class Price {
  constructor(private readonly _amount: number) {
    this.validate(_amount);
  }

  get amount(): number {
    return this._amount;
  }

  private validate(amount: number): void {
    if (isNaN(amount)) {
      throw new Error('Price must be a number');
    }

    if (amount < 0) {
      throw new Error('Price cannot be negative');
    }

    // Ensure price has maximum 2 decimal places
    const decimalPlaces = ((amount.toString().split('.')[1] || '').length);
    if (decimalPlaces > 2) {
      throw new Error('Price cannot have more than 2 decimal places');
    }
  }

  add(other: Price): Price {
    return new Price(this._amount + other.amount);
  }

  subtract(other: Price): Price {
    const result = this._amount - other.amount;
    return new Price(result);
  }

  multiply(factor: number): Price {
    return new Price(this._amount * factor);
  }

  equals(other: Price): boolean {
    return this._amount === other.amount;
  }

  toString(): string {
    return this._amount.toFixed(2);
  }

  // Format price for display with currency symbol
  format(currencySymbol = '€'): string {
    return `${currencySymbol}${this._amount.toFixed(2)}`;
  }
} 