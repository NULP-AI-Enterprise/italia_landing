"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { saveItemAction, savePageAction, type SaveResult } from "@/app/admin/content/actions";
import { cleanValue, slugify, toFieldErrors, type FieldError } from "@/content/form-model";
import { fieldText } from "@/content/field-labels";
import { collectionDef, pageDef, type CollectionKey, type PageKey } from "@/content/registry";
import { Field, fieldDomId, type Option } from "./fields";

type Target =
  | { mode: "page"; page: PageKey }
  | { mode: "item"; collection: CollectionKey; originalId: string | null };

type ContentEditorProps = Target & {
  initial: unknown;
  refs: Record<string, Option[]>;
  /** Where the list of items is, after creating or for "back". */
  backHref: string;
  siteHref: string;
};

type Status = { kind: "idle" } | { kind: "saved" } | { kind: "error"; message: string };

/** "title.uk" -> "Заголовок (українською)", "body.2.it" -> "Абзаци тексту, пункт 3 (італійською)" */
function errorLabel(path: string) {
  const parts = path.split(".");
  const language = parts.at(-1) === "uk" ? "українською" : parts.at(-1) === "it" ? "італійською" : "";
  const fieldPath = language ? parts.slice(0, -1) : parts;
  const index = fieldPath.at(-1)?.match(/^\d+$/) ? Number(fieldPath.pop()) + 1 : null;
  const label = fieldText(fieldPath.join(".")).label;
  return `${label}${index ? `, пункт ${index}` : ""}${language ? ` (${language})` : ""}`;
}

/** Form for one content document or collection item, generated from its schema. */
export function ContentEditor(props: ContentEditorProps) {
  const router = useRouter();
  const schema = props.mode === "page" ? pageDef(props.page).schema : collectionDef(props.collection).item;
  const def = props.mode === "item" ? collectionDef(props.collection) : null;
  const isNew = props.mode === "item" && props.originalId === null;

  const [value, setValue] = useState(props.initial);
  const [errors, setErrors] = useState<FieldError[]>([]);
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [dirty, setDirty] = useState(false);
  const [idEdited, setIdEdited] = useState(!isNew);
  const [pending, startTransition] = useTransition();
  const summaryRef = useRef<HTMLDivElement>(null);
  const savedRef = useRef<HTMLParagraphElement>(null);

  // Warn before leaving with unsaved changes.
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const change = (next: unknown) => {
    // A new item gets its id from the title until the id is typed by hand.
    if (isNew && def && !idEdited && next && typeof next === "object") {
      const record = next as Record<string, unknown>;
      const title = record[def.titleKey];
      const source = typeof title === "string" ? title : (title as { uk?: string } | undefined)?.uk;
      next = { ...record, [def.idKey]: slugify(source ?? "") };
    }
    setValue(next);
    setDirty(true);
    if (status.kind === "saved") setStatus({ kind: "idle" });
  };

  const showErrors = (list: FieldError[], message: string) => {
    setErrors(list);
    setStatus({ kind: "error", message });
    requestAnimationFrame(() => summaryRef.current?.focus());
  };

  const save = () => {
    const cleaned = cleanValue(schema, value);
    const check = schema.safeParse(cleaned);
    if (!check.success) {
      showErrors(toFieldErrors(check.error.issues), "Не збережено: виправте позначені поля.");
      return;
    }
    startTransition(async () => {
      const json = JSON.stringify(cleaned);
      let result: SaveResult;
      try {
        result =
          props.mode === "page"
            ? await savePageAction(props.page, json)
            : await saveItemAction(props.collection, props.originalId, json);
      } catch {
        result = { ok: false, message: "Не вдалося зберегти. Перевірте з’єднання і спробуйте ще раз.", errors: [] };
      }
      if (!result.ok) {
        showErrors(result.errors, result.message);
        return;
      }
      setErrors([]);
      setDirty(false);
      if (isNew && props.mode === "item" && result.id) {
        router.replace(`${props.backHref}/${result.id}?created=1`);
        return;
      }
      setStatus({ kind: "saved" });
      router.refresh();
      requestAnimationFrame(() => savedRef.current?.focus());
    });
  };

  const ctx = { errors, refs: props.refs, idLocked: !isNew, onIdEdited: () => setIdEdited(true) };

  return (
    <form
      className="cms-editor"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        save();
      }}
    >
      <div className="cms-toolbar">
        <a className="cms-back" href={props.backHref}>
          ← {props.mode === "page" ? "До контенту" : "До списку"}
        </a>
        <div className="cms-toolbar-status" aria-live="polite">
          {pending ? "Зберігаємо…" : dirty ? "Є незбережені зміни" : ""}
        </div>
        <a className="cms-button cms-button-quiet" href={props.siteHref} target="_blank" rel="noopener noreferrer">
          Переглянути на сайті<span className="visually-hidden"> (відкривається в новій вкладці)</span>
        </a>
        <button type="submit" className="btn" disabled={pending}>
          {pending ? "Зберігаємо…" : isNew ? "Створити" : "Зберегти"}
        </button>
      </div>

      {status.kind === "saved" && (
        <p className="admin-notice" role="status" tabIndex={-1} ref={savedRef}>
          Збережено. Сайт оновлено.
        </p>
      )}
      {status.kind === "error" && (
        <div className="admin-alert cms-summary" role="alert" tabIndex={-1} ref={summaryRef}>
          <p>{status.message}</p>
          {errors.length > 0 && (
            <ul>
              {errors.map((error) => (
                <li key={`${error.path}-${error.message}`}>
                  <a href={`#${fieldDomId(error.path)}`}>
                    {error.path ? `${errorLabel(error.path)}: ` : ""}
                    {error.message}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <p className="cms-hint">
        Поля з * обов’язкові. Кожен текст заповнюється двома мовами. Жирний: &lt;b&gt;текст&lt;/b&gt;, курсив:
        &lt;i&gt;текст&lt;/i&gt;.
      </p>

      <Field schema={schema} path={[]} value={value} onChange={change} ctx={ctx} />

      <div className="cms-footer">
        <button type="submit" className="btn" disabled={pending}>
          {pending ? "Зберігаємо…" : isNew ? "Створити" : "Зберегти"}
        </button>
      </div>
    </form>
  );
}
