/**
 * Utilities for sanitizing and restoring Firestore data.
 * Does NOT import server-only or firebase-admin so it can be safely used in tests or standalone scripts.
 */

/**
 * Recursively sanitizes data before writing to Firestore:
 * 1. Strips any keys with undefined values (or replaces with null).
 * 2. Un-nests any array directly inside an array (e.g. [[...]] -> [{ __isNestedArray: true, items: [...] }])
 *    so it can be restored on read.
 */
export function sanitizeForFirestore<T>(data: T): T {
  if (data === undefined) {
    return null as any;
  }
  if (data === null || typeof data !== 'object') {
    return data;
  }
  if (Array.isArray(data)) {
    return data.map((item) => {
      if (Array.isArray(item)) {
        return { __isNestedArray: true, items: sanitizeForFirestore(item) };
      }
      return sanitizeForFirestore(item);
    }) as any;
  }
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) {
      if (Array.isArray(value)) {
        result[key] = value.map((item) => {
          if (Array.isArray(item)) {
            return { __isNestedArray: true, items: sanitizeForFirestore(item) };
          }
          return sanitizeForFirestore(item);
        });
      } else {
        result[key] = sanitizeForFirestore(value);
      }
    }
  }
  return result as T;
}

/**
 * Restores data read from Firestore back to its exact original shape,
 * un-wrapping any nested arrays wrapped during sanitization.
 */
export function restoreFromFirestore<T>(data: T): T {
  if (data === null || typeof data !== 'object') {
    return data;
  }
  if (Array.isArray(data)) {
    return data.map((item) => restoreFromFirestore(item)) as any;
  }
  const obj = data as Record<string, any>;
  if (obj.__isNestedArray === true && Array.isArray(obj.items)) {
    return restoreFromFirestore(obj.items) as any;
  }
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      result[key] = restoreFromFirestore(value);
    }
  }
  return result as T;
}

