"use client";

import { useId, useRef, useState } from "react";
import type { z } from "zod";
import { fieldText } from "@/content/field-labels";
import {
  elementOf,
  emptyValue,
  enumOptions,
  kindOf,
  recordParts,
  shapeOf,
  stringFormat,
  unionOptions,
  unwrap,
  type FieldError,
} from "@/content/form-model";
import { enumLabels } from "@/content/registry";

export type Option = { value: string; label: string };

export type EditorContext = {
  errors: FieldError[];
  /** Picks for fields that point to other content (a member's industries and regions). */
  refs: Record<string, Option[]>;
  /** The id field is read-only once the item exists. */
  idLocked: boolean;
  onIdEdited: () => void;
};

type FieldProps = {
  schema: z.ZodType;
  path: string[];
  value: unknown;
  onChange: (value: unknown) => void;
  ctx: EditorContext;
};

/** Stable DOM id for a field path, used by the error summary links. */
export const fieldDomId = (path: string) => `field-${path.replaceAll(".", "-") || "root"}`;

const pathKey = (path: string[]) => path.join(".");
/** Label of a field; an item of a list gets its number: "Абзаци, № 2". */
const labelOf = (path: string[]) => {
  const text = fieldText(pathKey(path));
  const last = path.at(-1);
  return last && /^\d+$/.test(last) ? { ...text, label: `${text.label}, № ${Number(last) + 1}`, hint: undefined } : text;
};
const enumLabel = (value: string) => enumLabels[value] ?? value;

function ownErrors(ctx: EditorContext, path: string[]) {
  const key = pathKey(path);
  return ctx.errors.filter((error) => error.path === key).map((error) => error.message);
}

function ErrorText({ id, messages }: { id: string; messages: string[] }) {
  if (!messages.length) return null;
  return (
    <p className="cms-error" id={id}>
      {messages.join(". ")}
    </p>
  );
}

function Hint({ id, text }: { id: string; text?: string }) {
  return text ? (
    <p className="cms-hint" id={id}>
      {text}
    </p>
  ) : null;
}

const describedBy = (...ids: (string | false | undefined)[]) => ids.filter(Boolean).join(" ") || undefined;

/** Renders one field of any content schema. */
export function Field(props: FieldProps) {
  const { schema, path } = props;
  const name = path.at(-1) ?? "";
  if (name === "order") return null; // set by the move buttons in the list
  if ((name === "industries" || name === "regions") && props.ctx.refs[name]) return <RefChecklist {...props} />;

  switch (kindOf(schema)) {
    case "localized":
      return <LocalizedField {...props} />;
    case "media":
      return <MediaField {...props} />;
    case "object":
      return <ObjectField {...props} />;
    case "array":
      return <ArrayField {...props} />;
    case "record":
      return <RecordField {...props} />;
    case "union":
      return <UnionField {...props} />;
    case "boolean":
      return <BooleanField {...props} />;
    case "enum":
      return <EnumField {...props} />;
    case "number":
    case "string":
      return <TextField {...props} />;
    default:
      return null;
  }
}

/* ---------- Leaf fields ---------- */

function TextField({ schema, path, value, onChange, ctx }: FieldProps) {
  const id = fieldDomId(pathKey(path));
  const text = labelOf(path);
  const errors = ownErrors(ctx, path);
  const { optional } = unwrap(schema);
  const isNumber = kindOf(schema) === "number";
  const format = stringFormat(schema);
  const isId = path.length === 1 && (path[0] === "id" || path[0] === "code");
  const type = isNumber ? "number" : format === "url" ? "url" : format === "email" ? "email" : format === "date" ? "date" : "text";

  return (
    <div className="cms-field">
      <label htmlFor={id}>
        {text.label}
        {!optional && <span aria-hidden="true"> *</span>}
      </label>
      <input
        id={id}
        type={type}
        value={value === undefined || value === null ? "" : String(value)}
        readOnly={isId && ctx.idLocked}
        required={!optional}
        inputMode={isNumber ? "numeric" : undefined}
        spellCheck={isId || format ? false : undefined}
        aria-invalid={errors.length > 0 || undefined}
        aria-describedby={describedBy(text.hint && `${id}-hint`, errors.length > 0 && `${id}-error`)}
        onChange={(event) => {
          if (isId) ctx.onIdEdited();
          onChange(isNumber ? (event.target.value === "" ? undefined : Number(event.target.value)) : event.target.value);
        }}
      />
      <Hint id={`${id}-hint`} text={isId && ctx.idLocked ? "Ідентифікатор не змінюється після створення." : text.hint} />
      <ErrorText id={`${id}-error`} messages={errors} />
    </div>
  );
}

function BooleanField({ path, value, onChange, ctx }: FieldProps) {
  const id = fieldDomId(pathKey(path));
  const text = labelOf(path);
  const errors = ownErrors(ctx, path);
  return (
    <div className="cms-field cms-check">
      <input id={id} type="checkbox" checked={Boolean(value)} onChange={(event) => onChange(event.target.checked)} />
      <label htmlFor={id}>{text.label}</label>
      <ErrorText id={`${id}-error`} messages={errors} />
    </div>
  );
}

function EnumField({ schema, path, value, onChange, ctx }: FieldProps) {
  const id = fieldDomId(pathKey(path));
  const text = labelOf(path);
  const errors = ownErrors(ctx, path);
  return (
    <div className="cms-field">
      <label htmlFor={id}>{text.label}</label>
      <select
        id={id}
        value={String(value ?? "")}
        aria-invalid={errors.length > 0 || undefined}
        aria-describedby={describedBy(text.hint && `${id}-hint`, errors.length > 0 && `${id}-error`)}
        onChange={(event) => onChange(event.target.value)}
      >
        {enumOptions(schema).map((option) => (
          <option key={option} value={option}>
            {enumLabel(option)}
          </option>
        ))}
      </select>
      <Hint id={`${id}-hint`} text={text.hint} />
      <ErrorText id={`${id}-error`} messages={errors} />
    </div>
  );
}

/** Ukrainian and Italian side by side. */
function LocalizedField({ schema, path, value, onChange, ctx }: FieldProps) {
  const id = fieldDomId(pathKey(path));
  const text = labelOf(path);
  const { optional } = unwrap(schema);
  const current = (value ?? { uk: "", it: "" }) as { uk?: string; it?: string };
  const groupErrors = ownErrors(ctx, path);

  return (
    <fieldset className="cms-localized" id={id} aria-describedby={describedBy(text.hint && `${id}-hint`)}>
      <legend>
        {text.label}
        {!optional && <span aria-hidden="true"> *</span>}
        {optional && <span className="cms-optional"> — необов’язково</span>}
      </legend>
      <Hint id={`${id}-hint`} text={text.hint} />
      <div className="cms-languages">
        {(["uk", "it"] as const).map((language) => {
          const inputId = `${id}-${language}`;
          const errors = ownErrors(ctx, [...path, language]);
          return (
            <div className="cms-field" key={language}>
              <label htmlFor={inputId}>
                <span className="cms-lang" aria-hidden="true">
                  {language === "uk" ? "UA" : "IT"}
                </span>
                {language === "uk" ? "Українською" : "Італійською"}
              </label>
              <textarea
                id={inputId}
                lang={language}
                rows={text.long ? 3 : 1}
                value={current[language] ?? ""}
                aria-invalid={errors.length > 0 || undefined}
                aria-describedby={describedBy(errors.length > 0 && `${inputId}-error`)}
                onChange={(event) => onChange({ uk: current.uk ?? "", it: current.it ?? "", [language]: event.target.value })}
              />
              <ErrorText id={`${inputId}-error`} messages={errors} />
            </div>
          );
        })}
      </div>
      <ErrorText id={`${id}-error`} messages={groupErrors} />
    </fieldset>
  );
}

/* ---------- Images ---------- */

type MediaValue = { src: string; width: number; height: number; alt?: { uk: string; it: string } };

function MediaField({ schema, path, value, onChange, ctx }: FieldProps) {
  const id = fieldDomId(pathKey(path));
  const text = labelOf(path);
  const { optional } = unwrap(schema);
  const media = value as MediaValue | undefined;
  const hasImage = Boolean(media?.src);
  const inputRef = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<{ busy: boolean; error?: string }>({ busy: false });
  const errors = ctx.errors.filter((error) => error.path.startsWith(pathKey(path)) && !error.path.includes(".alt"));
  const altSchema = shapeOf(schema).alt;

  async function upload(file: File) {
    setState({ busy: true });
    const body = new FormData();
    body.set("file", file);
    try {
      const response = await fetch("/admin/api/upload", { method: "POST", body });
      const result = (await response.json()) as { src?: string; width?: number; height?: number; error?: string };
      if (!response.ok || !result.src) throw new Error(result.error ?? "Не вдалося завантажити файл.");
      onChange({ src: result.src, width: result.width, height: result.height, ...(media?.alt ? { alt: media.alt } : {}) });
      setState({ busy: false });
    } catch (error) {
      setState({ busy: false, error: error instanceof Error ? error.message : "Не вдалося завантажити файл." });
    } finally {
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <fieldset className="cms-media" id={id}>
      <legend>
        {text.label}
        {!optional && <span aria-hidden="true"> *</span>}
      </legend>
      <div className="cms-media-row">
        <div className="cms-media-preview">
          {hasImage ? (
            // eslint-disable-next-line @next/next/no-img-element -- preview of an arbitrary uploaded file
            <img src={media!.src} alt="" />
          ) : (
            <span>Немає зображення</span>
          )}
        </div>
        <div className="cms-media-actions">
          <input
            ref={inputRef}
            id={`${id}-file`}
            className="visually-hidden"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
            tabIndex={-1}
            aria-hidden="true"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void upload(file);
            }}
          />
          <button type="button" className="cms-button" disabled={state.busy} onClick={() => inputRef.current?.click()}>
            {state.busy ? "Завантаження…" : hasImage ? "Замінити зображення" : "Завантажити зображення"}
          </button>
          {optional && hasImage && (
            <button type="button" className="cms-button cms-button-quiet" onClick={() => onChange(undefined)}>
              Прибрати
            </button>
          )}
          {hasImage && (
            <p className="cms-hint">
              {media!.width} × {media!.height} px
            </p>
          )}
          <p className="cms-hint">JPG, PNG, WebP до 15 МБ. Велике фото зменшиться до 2400 px.</p>
          <div role="status" className="cms-error">
            {state.error}
          </div>
          <ErrorText id={`${id}-error`} messages={errors.length ? ["Завантажте зображення"] : []} />
        </div>
      </div>
      {hasImage && altSchema && (
        <Field
          schema={altSchema}
          path={[...path, "alt"]}
          value={media!.alt}
          onChange={(alt) => onChange({ ...media!, alt })}
          ctx={ctx}
        />
      )}
    </fieldset>
  );
}

/* ---------- Groups ---------- */

function ObjectField({ schema, path, value, onChange, ctx }: FieldProps) {
  const id = fieldDomId(pathKey(path));
  const text = labelOf(path);
  const { optional } = unwrap(schema);
  const current = value as Record<string, unknown> | undefined;
  const errors = ownErrors(ctx, path);
  const fields = Object.entries(shapeOf(schema)).map(([key, field]) => (
    <Field
      key={key}
      schema={field}
      path={[...path, key]}
      value={current?.[key]}
      onChange={(next) => onChange({ ...current, [key]: next })}
      ctx={ctx}
    />
  ));

  if (path.length === 0) return <div className="cms-fields">{fields}</div>;

  return (
    <fieldset className="cms-group" id={id} aria-describedby={describedBy(text.hint && `${id}-hint`)}>
      <legend>{text.label}</legend>
      <Hint id={`${id}-hint`} text={text.hint} />
      {current === undefined ? (
        <button type="button" className="cms-button cms-button-quiet" onClick={() => onChange(emptyValue(unwrap(schema).base))}>
          + Додати: {text.label.toLowerCase()}
        </button>
      ) : (
        <>
          <div className="cms-fields">{fields}</div>
          {optional && (
            <button type="button" className="cms-button cms-button-quiet" onClick={() => onChange(undefined)}>
              Прибрати: {text.label.toLowerCase()}
            </button>
          )}
        </>
      )}
      <ErrorText id={`${id}-error`} messages={errors} />
    </fieldset>
  );
}

function ArrayField({ schema, path, value, onChange, ctx }: FieldProps) {
  const id = fieldDomId(pathKey(path));
  const text = labelOf(path);
  const element = elementOf(schema);
  const items = Array.isArray(value) ? value : [];
  const errors = ownErrors(ctx, path);
  const simple = ["string", "number"].includes(kindOf(element));
  const headingId = useId();

  const update = (index: number, next: unknown) => onChange(items.map((item, i) => (i === index ? next : item)));
  const remove = (index: number) => onChange(items.filter((_, i) => i !== index));
  const move = (index: number, offset: number) => {
    const next = [...items];
    [next[index], next[index + offset]] = [next[index + offset], next[index]];
    onChange(next);
  };

  return (
    <fieldset className="cms-group" id={id} aria-describedby={describedBy(text.hint && `${id}-hint`, errors.length > 0 && `${id}-error`)}>
      <legend id={headingId}>
        {text.label} <span className="cms-count">({items.length})</span>
      </legend>
      <Hint id={`${id}-hint`} text={text.hint} />
      <ErrorText id={`${id}-error`} messages={errors} />
      <ol className={simple ? "cms-list cms-list-simple" : "cms-list"}>
        {items.map((item, index) => (
          <li key={index} className="cms-list-item">
            <div className="cms-list-body">
              <Field schema={element} path={[...path, String(index)]} value={item} onChange={(next) => update(index, next)} ctx={ctx} />
            </div>
            <div className="cms-list-tools" role="group" aria-label={`${text.label}, пункт ${index + 1}`}>
              <button type="button" className="cms-icon" disabled={index === 0} onClick={() => move(index, -1)} aria-label="Вище">
                ↑
              </button>
              <button
                type="button"
                className="cms-icon"
                disabled={index === items.length - 1}
                onClick={() => move(index, 1)}
                aria-label="Нижче"
              >
                ↓
              </button>
              <button type="button" className="cms-icon cms-icon-danger" onClick={() => remove(index)} aria-label="Видалити пункт">
                ×
              </button>
            </div>
          </li>
        ))}
      </ol>
      <button type="button" className="cms-button cms-button-quiet" onClick={() => onChange([...items, emptyValue(element)])}>
        + Додати пункт
      </button>
    </fieldset>
  );
}

/** Per-group settings, e.g. people per row for each team group. */
function RecordField({ schema, path, value, onChange, ctx }: FieldProps) {
  const id = fieldDomId(pathKey(path));
  const text = labelOf(path);
  const { keys, value: valueSchema } = recordParts(schema);
  const current = (value ?? {}) as Record<string, unknown>;
  return (
    <fieldset className="cms-group" id={id}>
      <legend>{text.label}</legend>
      <Hint id={`${id}-hint`} text={text.hint} />
      {keys.map((key) => (
        <div key={key} className="cms-subgroup">
          <p className="cms-subtitle">{enumLabel(key)}</p>
          <Field
            schema={valueSchema}
            path={[...path, key]}
            value={current[key] ?? emptyValue(valueSchema)}
            onChange={(next) => onChange({ ...current, [key]: next })}
            ctx={ctx}
          />
        </div>
      ))}
    </fieldset>
  );
}

/** A block of a given type (paragraph, list…); changing the type starts the block afresh. */
function UnionField({ schema, path, value, onChange, ctx }: FieldProps) {
  const { discriminator, options } = unionOptions(schema);
  const current = (value ?? {}) as Record<string, unknown>;
  const option = options.find((o) => o.value === current[discriminator]) ?? options[0];
  const id = fieldDomId(pathKey([...path, discriminator]));
  return (
    <div className="cms-union">
      <div className="cms-field">
        <label htmlFor={id}>{labelOf([...path, discriminator]).label}</label>
        <select
          id={id}
          value={option.value}
          onChange={(event) => {
            const next = options.find((o) => o.value === event.target.value);
            if (next) onChange(emptyValue(next.schema));
          }}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {enumLabel(o.value)}
            </option>
          ))}
        </select>
      </div>
      {Object.entries(shapeOf(option.schema))
        .filter(([key]) => key !== discriminator)
        .map(([key, field]) => (
          <Field
            key={key}
            schema={field}
            path={[...path, key]}
            value={current[key]}
            onChange={(next) => onChange({ ...current, [discriminator]: option.value, [key]: next })}
            ctx={ctx}
          />
        ))}
    </div>
  );
}

/** Checkboxes for references to other content (industries, regions). */
function RefChecklist({ path, value, onChange, ctx }: FieldProps) {
  const name = path.at(-1)!;
  const id = fieldDomId(pathKey(path));
  const text = labelOf(path);
  const selected = new Set(Array.isArray(value) ? (value as string[]) : []);
  const options = ctx.refs[name];
  const errors = ownErrors(ctx, path);
  const groups =
    name === "regions"
      ? [
          { title: "Україна", items: options.filter((o) => o.value.startsWith("UA")) },
          { title: "Італія", items: options.filter((o) => o.value.startsWith("IT")) },
        ]
      : [{ title: "", items: options }];

  const toggle = (option: string, on: boolean) => {
    const next = new Set(selected);
    if (on) next.add(option);
    else next.delete(option);
    // Keep the order of the list, not of the clicks.
    onChange(options.map((o) => o.value).filter((v) => next.has(v)));
  };

  return (
    <fieldset className="cms-group" id={id}>
      <legend>
        {text.label} <span className="cms-count">({selected.size})</span>
      </legend>
      {groups.map((group) => (
        <div key={group.title || "all"}>
          {group.title && <p className="cms-subtitle">{group.title}</p>}
          <ul className="cms-checklist">
            {group.items.map((option) => {
              const optionId = `${id}-${option.value}`;
              return (
                <li key={option.value}>
                  <input
                    id={optionId}
                    type="checkbox"
                    checked={selected.has(option.value)}
                    onChange={(event) => toggle(option.value, event.target.checked)}
                  />
                  <label htmlFor={optionId}>{option.label}</label>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
      <ErrorText id={`${id}-error`} messages={errors} />
    </fieldset>
  );
}
