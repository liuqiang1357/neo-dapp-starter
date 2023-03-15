import BigNumber from 'bignumber.js';
import { $enum } from 'ts-enum-util';

export function parseBoolean(value: string | null | undefined): boolean | null {
  if (value === 'true') {
    return true;
  }
  if (value === 'false') {
    return false;
  }
  return null;
}

export function parseNumber(value: string | null | undefined): number | null {
  if (value == null) {
    return null;
  }
  const num = new BigNumber(value);
  return num.isNaN() ? null : num.toNumber();
}

export function parseString(value: string | null | undefined): string | null {
  if (value == null) {
    return null;
  }
  return String(value);
}

export function parseEnum<E extends string | number>(
  e: Record<string, E>,
  value: string | null | undefined,
): E | null {
  return $enum(e).isValue(value) ? value : null;
}
