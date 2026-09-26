// Snowflake ID decoding for IDs produced by `diva-lib-snowflake-id-generator`:
//
//   ((timestamp << (nodeIdBits + counterBits)) | (nodeId << counterBits) | counter) & Long.MAX_VALUE
//
// The ID is a signed 64-bit long: the top bit is always 0, the timestamp (in
// seconds) takes whatever is left after the node and counter bits.

export const ID_BITS = 64;
export const MAX_FIELD_BITS = 63;
/** Long.MAX_VALUE — the largest ID the generator can produce. */
export const MAX_ID = 9223372036854775807n;
export const MAX_ID_DIGITS = MAX_ID.toString().length;

export const DEFAULT_NODE_ID_BITS = 10;
export const DEFAULT_COUNTER_BITS = 12;

export interface SnowflakeLayout {
  nodeIdBits: number;
  counterBits: number;
}

export interface DecodedSnowflake {
  timestamp: bigint;
  nodeId: bigint;
  counter: bigint;
}

/** Bits left for the timestamp once the sign bit is reserved (may be negative). */
export function timestampBits({ nodeIdBits, counterBits }: SnowflakeLayout): number {
  return ID_BITS - 1 - nodeIdBits - counterBits;
}

export function isValidLayout(layout: SnowflakeLayout): boolean {
  return timestampBits(layout) >= 0;
}

/** Parses a decimal ID; `null` when it isn't a non-negative 64-bit long. */
export function parseId(input: string): bigint | null {
  const trimmed = input.trim();
  if (!/^\d+$/.test(trimmed)) return null;
  const id = BigInt(trimmed);
  return id <= MAX_ID ? id : null;
}

export function decodeSnowflake(id: bigint, { nodeIdBits, counterBits }: SnowflakeLayout): DecodedSnowflake {
  const counterMask = (1n << BigInt(counterBits)) - 1n;
  const nodeIdMask = (1n << BigInt(nodeIdBits)) - 1n;
  return {
    counter: id & counterMask,
    nodeId: (id >> BigInt(counterBits)) & nodeIdMask,
    timestamp: id >> BigInt(counterBits + nodeIdBits),
  };
}

/** Largest value a field of `bits` bits can hold. */
export function maxValue(bits: number): bigint {
  return (1n << BigInt(Math.max(0, bits))) - 1n;
}

/** How long a timestamp of `bits` bits (in seconds) lasts before it wraps, e.g. "~68 years". */
export function timestampRange(bits: number): string {
  const seconds = 2 ** Math.max(0, bits);
  const units: [number, string][] = [
    [365.25 * 24 * 3600, 'year'],
    [24 * 3600, 'day'],
    [3600, 'hour'],
    [60, 'minute'],
  ];
  for (const [size, unit] of units) {
    if (seconds >= size) return `~${plural(Math.round(seconds / size), unit)}`;
  }
  return `~${plural(seconds, 'second')}`;
}

function plural(count: number, unit: string): string {
  return `${count.toLocaleString('en-US')} ${unit}${count === 1 ? '' : 's'}`;
}
