/**
 * Turns the zod content schemas into admin form fields (client and server).
 * The admin forms are generated from the same schemas that validate content,
 * so a new field in schema.ts shows up in the admin panel without extra code.
 */
import type { z } from "zod";

type Def = {
  type: string;
  shape?: Record<string, z.ZodType>;
  element?: z.ZodType;
  innerType?: z.ZodType;
  defaultValue?: unknown;
  entries?: Record<string, string>;
  values?: unknown[];
  keyType?: z.ZodType;
  valueType?: z.ZodType;
  options?: z.ZodType[];
  discriminator?: string;
  format?: string;
  in?: z.ZodType;
};

export const defOf = (schema: z.ZodType) => (schema as unknown as { _zod: { def: Def } })._zod.def;

/** Strips optional/default wrappers. */
export function unwrap(schema: z.ZodType): { base: z.ZodType; optional: boolean; defaultValue?: unknown } {
  let current = schema;
  let optional = false;
  let defaultValue: unknown;
  for (;;) {
    const def = defOf(current);
    if (def.type === "optional" || def.type === "nullable") {
      optional = true;
      current = def.innerType!;
    } else if (def.type === "default" || def.type === "prefault") {
      const value = def.defaultValue;
      defaultValue = typeof value === "function" ? (value as () => unknown)() : value;
      current = def.innerType!;
    } else if (def.type === "pipe") {
      current = def.in!;
    } else {
      return { base: current, optional, defaultValue };
    }
  }
}

export type FieldKind =
  | "localized"
  | "media"
  | "object"
  | "array"
  | "string"
  | "number"
  | "boolean"
  | "enum"
  | "record"
  | "union"
  | "literal"
  | "unknown";

export function kindOf(schema: z.ZodType): FieldKind {
  const def = defOf(unwrap(schema).base);
  switch (def.type) {
    case "object": {
      const keys = Object.keys(def.shape ?? {});
      if (keys.length === 2 && keys.includes("uk") && keys.includes("it")) return "localized";
      if (keys.includes("src") && keys.includes("width") && keys.includes("height")) return "media";
      return "object";
    }
    case "array":
    case "string":
    case "number":
    case "boolean":
    case "enum":
    case "record":
    case "union":
    case "literal":
      return def.type as FieldKind;
    default:
      return "unknown";
  }
}

export const shapeOf = (schema: z.ZodType) => defOf(unwrap(schema).base).shape ?? {};
export const elementOf = (schema: z.ZodType) => defOf(unwrap(schema).base).element!;
export const enumOptions = (schema: z.ZodType) => Object.values(defOf(unwrap(schema).base).entries ?? {});
export const stringFormat = (schema: z.ZodType) => defOf(unwrap(schema).base).format;

/** Options of a discriminated union, keyed by the discriminator value ("paragraph", "list"…). */
export function unionOptions(schema: z.ZodType) {
  const def = defOf(unwrap(schema).base);
  const discriminator = def.discriminator ?? "type";
  const options = (def.options ?? []).map((option) => {
    const literal = defOf(shapeOf(option)[discriminator]);
    return { value: String(literal.values?.[0]), schema: option };
  });
  return { discriminator, options };
}

export function recordParts(schema: z.ZodType) {
  const def = defOf(unwrap(schema).base);
  return { keys: enumOptions(def.keyType!), value: def.valueType! };
}

/** An empty value for a new field or list item. */
export function emptyValue(schema: z.ZodType): unknown {
  const { base, optional, defaultValue } = unwrap(schema);
  if (defaultValue !== undefined) return structuredClone(defaultValue);
  const kind = kindOf(base);
  if (optional && (kind === "media" || kind === "object" || kind === "record")) return undefined;
  switch (kind) {
    case "localized":
      return { uk: "", it: "" };
    case "object":
      return Object.fromEntries(Object.entries(shapeOf(base)).map(([key, field]) => [key, emptyValue(field)]));
    case "array":
      return [];
    case "string":
      return "";
    case "number":
      return 0;
    case "boolean":
      return false;
    case "enum":
      return enumOptions(base)[0];
    case "literal":
      return defOf(base).values?.[0];
    case "union": {
      const { options } = unionOptions(base);
      return emptyValue(options[0].schema);
    }
    case "record":
      return {};
    default:
      return undefined;
  }
}

const isBlank = (value: unknown): boolean => {
  if (value === undefined || value === null) return true;
  if (typeof value === "string") return value.trim() === "";
  if (typeof value === "object" && !Array.isArray(value)) return Object.values(value).every(isBlank);
  return false;
};

/**
 * Prepares form state for validation: an optional field left empty is removed
 * instead of failing ("" is not a valid URL, an empty quote is no quote).
 */
export function cleanValue(schema: z.ZodType, value: unknown): unknown {
  const { base, optional } = unwrap(schema);
  const kind = kindOf(base);
  if (optional && kind !== "boolean" && kind !== "number" && isBlank(value)) return undefined;
  if (value === undefined || value === null) return value;
  switch (kind) {
    case "object":
    case "media":
    case "localized": {
      if (typeof value !== "object") return value;
      const shape = shapeOf(base);
      const result: Record<string, unknown> = {};
      for (const [key, field] of Object.entries(shape)) {
        const cleaned = cleanValue(field, (value as Record<string, unknown>)[key]);
        if (cleaned !== undefined) result[key] = cleaned;
      }
      return result;
    }
    case "array":
      return Array.isArray(value) ? value.map((item) => cleanValue(elementOf(base), item)) : value;
    case "union": {
      const { discriminator, options } = unionOptions(base);
      const option = options.find((o) => o.value === (value as Record<string, unknown>)[discriminator]);
      return option ? cleanValue(option.schema, value) : value;
    }
    case "record": {
      const { value: valueSchema } = recordParts(base);
      return Object.fromEntries(
        Object.entries(value as Record<string, unknown>).map(([key, item]) => [key, cleanValue(valueSchema, item)]),
      );
    }
    case "string":
      return typeof value === "string" ? value.trim() : value;
    default:
      return value;
  }
}

/* ---------- Errors ---------- */

export type FieldError = { path: string; message: string };

type Issue = z.core.$ZodIssue;

/** Plain Ukrainian messages for editors. */
export function describeIssue(issue: Issue): string {
  switch (issue.code) {
    case "too_small":
      if (issue.origin === "array") return "Додайте хоча б один пункт";
      if (issue.origin === "string") return "Заповніть поле";
      return `Не менше ніж ${issue.minimum}`;
    case "too_big":
      return "Занадто довге значення";
    case "invalid_type":
      return "Заповніть поле";
    case "invalid_format":
      switch (issue.format) {
        case "url":
          return "Повна адреса сайту, наприклад https://example.com";
        case "email":
          return "Е-мейл, наприклад name@company.com";
        case "date":
          return "Дата у форматі РРРР-ММ-ДД";
        case "starts_with": {
          const prefix = (issue as { prefix?: string }).prefix ?? "";
          return prefix === "/media/" ? "Завантажте зображення" : `Має починатися з «${prefix}»`;
        }
        default:
          return issue.message.startsWith("Invalid") ? "Неправильний формат" : issue.message;
      }
    case "invalid_value":
    case "invalid_union":
      return "Виберіть значення зі списку";
    default:
      return issue.message;
  }
}

export const pathKey = (path: PropertyKey[]) => path.map(String).join(".");

export function toFieldErrors(issues: Issue[], prefix: PropertyKey[] = []): FieldError[] {
  return issues.map((issue) => ({ path: pathKey([...prefix, ...issue.path]), message: describeIssue(issue) }));
}

/* ---------- Ids ---------- */

const cyrillic: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "h", ґ: "g", д: "d", е: "e", є: "ie", ж: "zh", з: "z", и: "y", і: "i", ї: "i",
  й: "i", к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "kh",
  ц: "ts", ч: "ch", ш: "sh", щ: "shch", ь: "", ю: "iu", я: "ia", ы: "y", э: "e", ё: "io", ъ: "",
};

/** "Асоціація Rebuild 2026" -> "asotsiatsiia-rebuild-2026" */
export function slugify(value: string) {
  return value
    .toLowerCase()
    .split("")
    .map((char) => cyrillic[char] ?? char)
    .join("")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    .replace(/-+$/, "");
}
