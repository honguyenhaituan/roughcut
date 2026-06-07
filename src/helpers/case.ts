// Convert snake_case API payloads to camelCase (and back) without pulling in an
// extra dependency. Mirrors the `humps` behaviour used by larger apps.

type Json = unknown;

function toCamel(key: string): string {
  return key.replace(/_([a-z0-9])/g, (_, c: string) => c.toUpperCase());
}

function toSnake(key: string): string {
  return key.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
}

function mapKeys(value: Json, transform: (key: string) => string): Json {
  if (Array.isArray(value)) {
    return value.map((item) => mapKeys(item, transform));
  }
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, Json>).map(([key, val]) => [
        transform(key),
        mapKeys(val, transform),
      ]),
    );
  }
  return value;
}

export function camelizeKeys<T = unknown>(value: unknown): T {
  return mapKeys(value, toCamel) as T;
}

export function snakeizeKeys<T = unknown>(value: unknown): T {
  return mapKeys(value, toSnake) as T;
}
