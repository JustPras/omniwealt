/**
 * High-Precision Decimal & Financial Money Utility
 * Avoids IEEE-754 floating-point inaccuracies (e.g. 0.1 + 0.2 !== 0.3)
 * Uses fixed-point integer scaling with 4 decimal places (factor = 10,000)
 */

export class Decimal {
  private static readonly SCALE = 10000n; // 4 decimal places
  private readonly scaledValue: bigint;

  constructor(value: number | string | bigint | Decimal = 0) {
    if (value instanceof Decimal) {
      this.scaledValue = value.scaledValue;
      return;
    }

    if (typeof value === 'bigint') {
      this.scaledValue = value * Decimal.SCALE;
      return;
    }

    if (typeof value === 'number') {
      if (isNaN(value) || !isFinite(value)) {
        this.scaledValue = 0n;
        return;
      }
      // Round to 4 decimal places before converting to BigInt to avoid float drift
      const fixedStr = value.toFixed(4);
      const [intPart, decPart = '0000'] = fixedStr.split('.');
      const normalizedDec = decPart.padEnd(4, '0').slice(0, 4);
      const isNegative = fixedStr.startsWith('-');
      const sign = isNegative ? -1n : 1n;
      const absInt = intPart.replace('-', '');
      this.scaledValue = sign * (BigInt(absInt) * Decimal.SCALE + BigInt(normalizedDec));
      return;
    }

    if (typeof value === 'string') {
      const clean = value.trim().replace(/,/g, '');
      if (!clean || clean === '-' || isNaN(Number(clean))) {
        this.scaledValue = 0n;
        return;
      }
      const isNegative = clean.startsWith('-');
      const absStr = clean.replace('-', '');
      const parts = absStr.split('.');
      const intPart = parts[0] || '0';
      const decPart = (parts[1] || '').padEnd(4, '0').slice(0, 4);
      const sign = isNegative ? -1n : 1n;
      this.scaledValue = sign * (BigInt(intPart) * Decimal.SCALE + BigInt(decPart));
      return;
    }

    this.scaledValue = 0n;
  }

  static fromScaled(scaled: bigint): Decimal {
    const d = new Decimal(0);
    (d as any).scaledValue = scaled;
    return d;
  }

  plus(other: Decimal | number | string): Decimal {
    const o = other instanceof Decimal ? other : new Decimal(other);
    return Decimal.fromScaled(this.scaledValue + o.scaledValue);
  }

  minus(other: Decimal | number | string): Decimal {
    const o = other instanceof Decimal ? other : new Decimal(other);
    return Decimal.fromScaled(this.scaledValue - o.scaledValue);
  }

  times(other: Decimal | number | string): Decimal {
    const o = other instanceof Decimal ? other : new Decimal(other);
    const prod = (this.scaledValue * o.scaledValue) / Decimal.SCALE;
    return Decimal.fromScaled(prod);
  }

  dividedBy(other: Decimal | number | string): Decimal {
    const o = other instanceof Decimal ? other : new Decimal(other);
    if (o.scaledValue === 0n) {
      throw new Error('Division by zero in Decimal calculation');
    }
    const div = (this.scaledValue * Decimal.SCALE) / o.scaledValue;
    return Decimal.fromScaled(div);
  }

  abs(): Decimal {
    return this.scaledValue < 0n
      ? Decimal.fromScaled(-this.scaledValue)
      : Decimal.fromScaled(this.scaledValue);
  }

  equals(other: Decimal | number | string): boolean {
    const o = other instanceof Decimal ? other : new Decimal(other);
    return this.scaledValue === o.scaledValue;
  }

  isZero(): boolean {
    return this.scaledValue === 0n;
  }

  isPositive(): boolean {
    return this.scaledValue > 0n;
  }

  isNegative(): boolean {
    return this.scaledValue < 0n;
  }

  greaterThan(other: Decimal | number | string): boolean {
    const o = other instanceof Decimal ? other : new Decimal(other);
    return this.scaledValue > o.scaledValue;
  }

  lessThan(other: Decimal | number | string): boolean {
    const o = other instanceof Decimal ? other : new Decimal(other);
    return this.scaledValue < o.scaledValue;
  }

  toNumber(): number {
    return Number(this.scaledValue) / 10000;
  }

  toCents(): bigint {
    return this.scaledValue / 100n; // 2 decimal places in cents
  }

  toFixed(decimals: number = 2): string {
    const num = this.toNumber();
    return num.toFixed(decimals);
  }

  toString(): string {
    return this.toFixed(2);
  }
}

export function toDecimal(val: number | string | Decimal | undefined | null): Decimal {
  if (val === undefined || val === null) return new Decimal(0);
  return val instanceof Decimal ? val : new Decimal(val);
}
