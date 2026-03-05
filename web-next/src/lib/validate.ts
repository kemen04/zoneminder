/** Returns true if value is a string of digits (valid ZM database ID) */
export function isNumericId(val: unknown): val is string {
  return typeof val === 'string' && /^\d+$/.test(val)
}
