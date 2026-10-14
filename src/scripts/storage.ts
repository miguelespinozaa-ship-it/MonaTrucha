export function readStored<T>(
  key: string,
  fallback: T,
  validate: (value: unknown) => value is T,
): T {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(key) || 'null');
    return validate(value) ? value : fallback;
  } catch {
    return fallback;
  }
}
export function writeStored(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}
export const stringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((s) => typeof s === 'string');
export interface ConsentState {
  version: 1;
  ads: boolean;
  analytics: boolean;
  savedAt: number;
}
export function isConsent(value: unknown): value is ConsentState {
  return (
    typeof value === 'object' &&
    value !== null &&
    'version' in value &&
    value.version === 1 &&
    'ads' in value &&
    typeof value.ads === 'boolean' &&
    'analytics' in value &&
    typeof value.analytics === 'boolean' &&
    'savedAt' in value &&
    typeof value.savedAt === 'number' &&
    Date.now() - value.savedAt < 180 * 86400000
  );
}
