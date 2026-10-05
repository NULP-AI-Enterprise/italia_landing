"use client";

import { unstable_isUnrecognizedActionError, useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState, useTransition } from "react";
import type { z } from "zod";
import { deleteItemAction, saveItemAction, savePageAction, type SaveResult } from "@/app/admin/content/actions";
import { fieldText } from "@/content/field-labels";
import {
  cleanValue,
  countMissing,
  isSimpleField,
  shapeOf,
  slugify,
  toFieldErrors,
  type FieldError,
} from "@/content/form-model";
import { collectionDef, pageDef, type CollectionKey, type PageKey } from "@/content/registry";
import { ConfirmButton } from "./ConfirmButton";
import { Field, fieldDomId, type Language, type Option } from "./fields";

type Target =
  | { mode: "page"; page: PageKey }
  | { mode: "item"; collection: CollectionKey; originalId: string | null };

type ContentEditorProps = Target & {
  initial: unknown;
  refs: Record<string, Option[]>;
  /** Where the list of items is, after creating or for "back". */
  backHref: string;
  siteHref: string;
  /** "Змінено 30 вер., Ірина" */
  lastSaved?: string;
  /** Title of the item, for the delete confirmation. */
  itemLabel?: string;
};

type Status =
  | { kind: "idle" }
  | { kind: "saved" }
  | { kind: "restored" }
  | { kind: "error"; message: string; reload?: boolean };
type Group = { title?: string; keys: string[]; collapsed?: boolean };

const LANGUAGE_MODES: { value: Language[]; label: string }[] = [
  { value: ["uk", "it"], label: "Обидві" },
  { value: ["uk"], label: "UA" },
  { value: ["it"], label: "IT" },
];

/** "title.uk" -> "Заголовок (українською)", "body.2.it" -> "Абзаци тексту, пункт 3 (італійською)" */
function errorLabel(path: string) {
  const parts = path.split(".");
  const language = parts.at(-1) === "uk" ? "українською" : parts.at(-1) === "it" ? "італійською" : "";
  const fieldPath = language ? parts.slice(0, -1) : parts;
  const index = fieldPath.at(-1)?.match(/^\d+$/) ? Number(fieldPath.pop()) + 1 : null;
  const label = fieldText(fieldPath.join(".")).label;
  return `${label}${index ? `, пункт ${index}` : ""}${language ? ` (${language})` : ""}`;
}

/**
 * Top-level fields in cards: simple fields together ("Основне"), every list,
 * image or group in its own card, search-engine texts last and folded.
 */
function groupFields(schema: z.ZodType, idKey: string | undefined, isNew: boolean): Group[] {
  const shape = shapeOf(schema);
  const keys = Object.keys(shape).filter(
    (key) => key !== "order" && key !== "published" && key !== "seo" && key !== idKey,
  );
  const groups: Group[] = [];
  for (const key of keys) {
    if (isSimpleField(shape[key])) {
      const last = groups.at(-1);
      if (last && last.title === undefined) last.keys.push(key);
      else groups.push({ keys: [key] });
    } else {
      groups.push({ title: fieldText(key).label, keys: [key] });
    }
  }
  if (groups[0] && groups[0].title === undefined) groups[0].title = "Основне";
  if ("seo" in shape) groups.push({ title: fieldText("seo").label, keys: ["seo"], collapsed: true });
  if (idKey && idKey in shape) groups.push({ title: "Ідентифікатор", keys: [idKey], collapsed: !isNew });
  return groups;
}

/** The unsaved form value kept in this browser tab, if it is valid JSON. */
function readDraft(key: string) {
  try {
    const draft = sessionStorage.getItem(key);
    return draft && JSON.parse(draft) ? draft : null;
  } catch {
    return null;
  }
}

/** Form for one content document or collection item, generated from its schema. */
export function ContentEditor(props: ContentEditorProps) {
  const router = useRouter();
  const formId = useId();
  const schema = props.mode === "page" ? pageDef(props.page).schema : collectionDef(props.collection).item;
  const def = props.mode === "item" ? collectionDef(props.collection) : null;
  const isNew = props.mode === "item" && props.originalId === null;
  const shape = shapeOf(schema);
  const hasPublished = "published" in shape;

  const [value, setValue] = useState(props.initial as Record<string, unknown>);
  const [errors, setErrors] = useState<FieldError[]>([]);
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [dirty, setDirty] = useState(false);
  const [idEdited, setIdEdited] = useState(!isNew);
  const [languages, setLanguages] = useState<Language[]>(["uk", "it"]);
  const [pending, startTransition] = useTransition();
  const summaryRef = useRef<HTMLDivElement>(null);
  const savedRef = useRef<HTMLParagraphElement>(null);
  const saveRef = useRef<() => void>(() => {});
  const reloadingRef = useRef(false);

  // Unsaved changes are kept in this browser tab, so a failed save (the site was being
  // updated, the connection dropped) or a reload does not lose what was typed.
  const draftKey = `cms-draft:${props.mode === "page" ? `page:${props.page}` : `${props.collection}:${props.originalId ?? "new"}`}`;
  const draftCheckedRef = useRef(false);
  useEffect(() => {
    // Only when the editor opens, not when a save refreshes `initial`
    if (draftCheckedRef.current) return;
    draftCheckedRef.current = true;
    const draft = readDraft(draftKey);
    if (!draft || draft === JSON.stringify(props.initial)) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sessionStorage is readable only after hydration
    setValue(JSON.parse(draft));
    setDirty(true);
    setStatus({ kind: "restored" });
  }, [draftKey, props.initial]);
  useEffect(() => {
    if (!dirty) return;
    try {
      sessionStorage.setItem(draftKey, JSON.stringify(value));
    } catch {}
  }, [dirty, value, draftKey]);
  const forgetDraft = () => {
    try {
      sessionStorage.removeItem(draftKey);
    } catch {}
  };
  const discardDraft = () => {
    forgetDraft();
    setValue(props.initial as Record<string, unknown>);
    setDirty(false);
    setErrors([]);
    setStatus({ kind: "idle" });
  };
  const reload = () => {
    reloadingRef.current = true;
    window.location.reload();
  };

  // Warn before leaving with unsaved changes.
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => {
      if (!reloadingRef.current) event.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  // Ctrl+S / Cmd+S saves.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        saveRef.current();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const change = (next: Record<string, unknown>) => {
    // A new item gets its id from the title until the id is typed by hand.
    if (isNew && def && !idEdited) {
      const title = next[def.titleKey];
      const source = typeof title === "string" ? title : (title as { uk?: string } | undefined)?.uk;
      next = { ...next, [def.idKey]: slugify(source ?? "") };
    }
    setValue(next);
    setDirty(true);
    if (status.kind === "saved" || status.kind === "restored") setStatus({ kind: "idle" });
  };
  const setField = (key: string, fieldValue: unknown) => change({ ...value, [key]: fieldValue });

  const showErrors = (list: FieldError[], message: string, reload?: boolean) => {
    setErrors(list);
    setStatus({ kind: "error", message, reload });
    requestAnimationFrame(() => summaryRef.current?.focus());
  };

  const save = () => {
    if (pending) return;
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
      } catch (error) {
        showErrors(
          [],
          unstable_isUnrecognizedActionError(error)
            ? "Не збережено: поки сторінка була відкрита, сайт оновився. Ваші зміни не загубились. Натисніть «Оновити сторінку», вони повернуться у форму, і збережіть ще раз."
            : "Не збережено: сервер не відповів. Можливо, сайт саме оновлюється, це до 2 хвилин. Ваші зміни не загубились: спробуйте зберегти ще раз трохи згодом.",
          true,
        );
        return;
      }
      if (!result.ok) {
        showErrors(result.errors, result.message);
        return;
      }
      forgetDraft();
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
  useEffect(() => {
    saveRef.current = save;
  });

  const ctx = {
    errors,
    languages,
    refs: props.refs,
    idLocked: !isNew,
    onIdEdited: () => setIdEdited(true),
  };
  const missing = countMissing(schema, value);
  const groups = groupFields(schema, def?.idKey, isNew);
  const statusText = pending ? "Зберігаємо…" : dirty ? "Є незбережені зміни" : status.kind === "saved" ? "Збережено" : "Без змін";

  return (
    <div className="ed">
      <form
        id={formId}
        className="ed-form"
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          save();
        }}
      >
        {status.kind === "saved" && (
          <p className="admin-notice" role="status" tabIndex={-1} ref={savedRef}>
            Збережено. Сайт оновлено.
          </p>
        )}
        {status.kind === "restored" && (
          <div className="admin-notice ed-restored" role="status">
            <p>
              Повернули зміни, які ще не були збережені. Перевірте їх і натисніть «{isNew ? "Створити" : "Зберегти"}».
            </p>
            <button type="button" className="adm-button adm-button-quiet" onClick={discardDraft}>
              Відкинути ці зміни
            </button>
          </div>
        )}
        {status.kind === "error" && (
          <div className="admin-alert cms-summary" role="alert" tabIndex={-1} ref={summaryRef}>
            <p>{status.message}</p>
            {status.reload && (
              <button type="button" className="adm-button" onClick={reload}>
                Оновити сторінку
              </button>
            )}
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

        {groups.map((group, index) => {
          const hasErrors = errors.some((error) => group.keys.some((key) => error.path.split(".")[0] === key));
          return (
            <details className="ed-section" key={group.keys.join("-")} open={!group.collapsed || hasErrors}>
              <summary>
                <h2>{group.title ?? `Розділ ${index + 1}`}</h2>
                {group.collapsed && <span className="adm-muted">необов’язково</span>}
              </summary>
              <div className="cms-fields">
                {group.keys.map((key) => (
                  <Field
                    key={key}
                    schema={shape[key]}
                    path={[key]}
                    value={value[key]}
                    onChange={(next) => setField(key, next)}
                    ctx={ctx}
                  />
                ))}
              </div>
            </details>
          );
        })}

        <p className="adm-muted ed-format">
          Жирний текст: &lt;b&gt;текст&lt;/b&gt;, курсив: &lt;i&gt;текст&lt;/i&gt;. Поля з * обов’язкові.
        </p>
      </form>

      <aside className="ed-aside" aria-label="Збереження і налаштування">
        <div className="ed-panel">
          <button type="submit" form={formId} className="btn ed-save" disabled={pending}>
            {pending ? "Зберігаємо…" : isNew ? "Створити" : "Зберегти"}
          </button>
          <p className="ed-status" data-dirty={dirty || undefined} aria-live="polite">
            {statusText}
          </p>
          <p className="adm-muted ed-shortcut">Ctrl+S або ⌘S — зберегти</p>

          {hasPublished && (
            <div className="ed-toggle">
              <input
                id={`${formId}-published`}
                type="checkbox"
                role="switch"
                checked={Boolean(value.published)}
                onChange={(event) => setField("published", event.target.checked)}
              />
              <label htmlFor={`${formId}-published`}>
                Показувати на сайті
                <span className="adm-muted">{value.published ? "Видно відвідувачам" : "Приховано"}</span>
              </label>
            </div>
          )}

          <fieldset className="ed-languages">
            <legend>Мови у формі</legend>
            <div className="ed-segmented">
              {LANGUAGE_MODES.map((mode) => (
                <label key={mode.label}>
                  <input
                    type="radio"
                    name={`${formId}-languages`}
                    checked={languages.join() === mode.value.join()}
                    onChange={() => setLanguages(mode.value)}
                  />
                  <span>{mode.label}</span>
                </label>
              ))}
            </div>
            {(missing.it > 0 || missing.uk > 0) && (
              <p className="ed-missing">
                {missing.it > 0 && <span>Без італійського перекладу: {missing.it}</span>}
                {missing.uk > 0 && <span>Без українського тексту: {missing.uk}</span>}
              </p>
            )}
          </fieldset>

          <a className="adm-button adm-button-quiet ed-view" href={props.siteHref} target="_blank" rel="noopener noreferrer">
            Переглянути на сайті ↗<span className="visually-hidden"> (відкривається в новій вкладці)</span>
          </a>
          {props.lastSaved && <p className="adm-muted">{props.lastSaved}</p>}
        </div>

      </aside>

      {props.mode === "item" && props.originalId && !def?.fixed && (
          <form action={deleteItemAction} className="ed-delete">
            <input type="hidden" name="collection" value={props.collection} />
            <input type="hidden" name="id" value={props.originalId} />
            {typeof value.category === "string" && <input type="hidden" name="filter" value={value.category} />}
            <ConfirmButton
              className="admin-danger"
              question={`Видалити «${props.itemLabel ?? props.originalId}»? Цю дію не можна скасувати.`}
            >
              Видалити запис
            </ConfirmButton>
          </form>
        )}

      {/* Phones: the save button stays at hand */}
      <div className="ed-savebar">
        <span>{statusText}</span>
        <button type="submit" form={formId} className="btn" disabled={pending}>
          {isNew ? "Створити" : "Зберегти"}
        </button>
      </div>
    </div>
  );
}
