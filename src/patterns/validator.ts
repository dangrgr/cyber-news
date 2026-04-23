// JSON Schema validator — minimal draft-2020-12 subset we actually use:
// `type`, `properties`, `required`, `additionalProperties`, `items`, `enum`.
// No `$ref`, no `format`, no `oneOf`/`anyOf`/`allOf` — when we need them, add
// them with tests. Keeps us off a dependency for ~150 LOC.

export type JsonValue =
  | null
  | boolean
  | number
  | string
  | JsonValue[]
  | { [k: string]: JsonValue };

export interface JsonSchema {
  type?: JsonType | JsonType[];
  properties?: Record<string, JsonSchema>;
  required?: string[];
  additionalProperties?: boolean | JsonSchema;
  items?: JsonSchema;
  enum?: ReadonlyArray<JsonValue>;
}

type JsonType = "null" | "boolean" | "number" | "integer" | "string" | "array" | "object";

export interface ValidationError {
  path: string;
  message: string;
}

export function validate(schema: JsonSchema, value: JsonValue): ValidationError[] {
  const errors: ValidationError[] = [];
  walk(schema, value, "$", errors);
  return errors;
}

function walk(schema: JsonSchema, value: JsonValue, path: string, errors: ValidationError[]): void {
  if (schema.type !== undefined) {
    const allowed = Array.isArray(schema.type) ? schema.type : [schema.type];
    if (!allowed.some((t) => matchesType(t, value))) {
      errors.push({ path, message: `expected type ${allowed.join("|")}, got ${jsonTypeOf(value)}` });
      return; // further checks don't apply if the type is wrong
    }
  }

  if (schema.enum !== undefined) {
    if (!schema.enum.some((e) => deepEqual(e, value))) {
      errors.push({ path, message: `value not in enum: ${JSON.stringify(value)}` });
    }
  }

  if (Array.isArray(value) && schema.items !== undefined) {
    for (let i = 0; i < value.length; i++) {
      walk(schema.items, value[i] as JsonValue, `${path}[${i}]`, errors);
    }
  }

  if (isPlainObject(value)) {
    const props = schema.properties ?? {};
    const required = schema.required ?? [];
    for (const key of required) {
      if (!(key in value)) {
        errors.push({ path: `${path}.${key}`, message: "required" });
      }
    }
    for (const [key, child] of Object.entries(value)) {
      if (key in props) {
        walk(props[key]!, child, `${path}.${key}`, errors);
      } else if (schema.additionalProperties === false) {
        errors.push({ path: `${path}.${key}`, message: "additional property not allowed" });
      } else if (typeof schema.additionalProperties === "object" && schema.additionalProperties !== null) {
        walk(schema.additionalProperties, child, `${path}.${key}`, errors);
      }
    }
  }
}

function matchesType(t: JsonType, v: JsonValue): boolean {
  switch (t) {
    case "null": return v === null;
    case "boolean": return typeof v === "boolean";
    case "number": return typeof v === "number" && Number.isFinite(v);
    case "integer": return typeof v === "number" && Number.isInteger(v);
    case "string": return typeof v === "string";
    case "array": return Array.isArray(v);
    case "object": return isPlainObject(v);
  }
}

function jsonTypeOf(v: JsonValue): JsonType {
  if (v === null) return "null";
  if (Array.isArray(v)) return "array";
  if (typeof v === "object") return "object";
  if (typeof v === "boolean") return "boolean";
  if (typeof v === "number") return "number";
  return "string";
}

function isPlainObject(v: JsonValue): v is { [k: string]: JsonValue } {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function deepEqual(a: JsonValue, b: JsonValue): boolean {
  if (a === b) return true;
  if (a === null || b === null) return false;
  if (typeof a !== typeof b) return false;
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (!deepEqual(a[i] as JsonValue, b[i] as JsonValue)) return false;
    }
    return true;
  }
  if (isPlainObject(a) && isPlainObject(b)) {
    const ak = Object.keys(a);
    const bk = Object.keys(b);
    if (ak.length !== bk.length) return false;
    for (const k of ak) if (!deepEqual(a[k]!, b[k]!)) return false;
    return true;
  }
  return false;
}
