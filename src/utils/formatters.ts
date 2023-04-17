import BigNumber from 'bignumber.js';
import i18n from 'i18next';
import { UtfString } from 'utfstring';

export interface FormatEnumOptions {
  defaultValue?: string;
  ingoreMissing?: boolean;
}

export function formatEnum(
  type: string,
  value: number | string | (number | string)[] | null | undefined,
  { defaultValue, ingoreMissing = false }: FormatEnumOptions = {},
): string {
  if (value == null) {
    return '-';
  }
  const finalValue = Array.isArray(value) ? value.join('.') : value;
  if (i18n.exists(`enums.${type}.${finalValue}`)) {
    return i18n.t(`enums.${type}.${finalValue}`);
  }
  if (!ingoreMissing) {
    console.warn(`Enum path not found: ${`enums.${type}.${finalValue}`}`);
  }
  return String(defaultValue ?? finalValue);
}

export interface FormatNumberOptions {
  decimals?: number;
  roundingMode?: BigNumber.RoundingMode;
  prefix?: string;
  suffix?: string;
  asPercentage?: boolean;
  withSign?: boolean;
}

export function formatNumber(
  value: number | string | null | undefined,
  {
    decimals,
    roundingMode,
    prefix,
    suffix,
    asPercentage = false,
    withSign = false,
  }: FormatNumberOptions = {},
): string {
  if (value == null) {
    return '-';
  }
  const bn = new BigNumber(value).times(asPercentage ? 100 : 1);
  if (bn.isNaN()) {
    return '-';
  }
  const options = {
    prefix: (prefix ?? '') + (withSign && bn.gte(0) ? '+' : ''),
    decimalSeparator: '.',
    groupSeparator: ',',
    groupSize: 3,
    suffix: (asPercentage ? '%' : '') + (suffix ?? ''),
  };
  if (decimals != null) {
    return bn.dp(decimals, roundingMode).toFormat(options);
  }
  return bn.toFormat(options);
}

export interface FormatLongTextOptions {
  headTailLength?: number;
  headLength?: number;
  tailLength?: number;
}

export function formatLongText(
  value: string | null | undefined,
  { headTailLength = 8, headLength, tailLength }: FormatLongTextOptions = {},
): string {
  if (value == null) {
    return '-';
  }
  const string = new UtfString(value);
  const finalHeadLength = headLength ?? headTailLength;
  const finalTailLength = tailLength ?? headTailLength;

  if (string.length <= finalHeadLength + finalTailLength + 3) {
    return string.toString();
  }
  return `${string.slice(0, finalHeadLength)}...${string.slice(string.length - finalTailLength)}`;
}
