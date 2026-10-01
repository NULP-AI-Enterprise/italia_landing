/**
 * Field names and hints for the admin forms, by property name.
 * A path ("hero.lead") wins over a bare name ("lead").
 */
type FieldText = {
  label: string;
  hint?: string;
  long?: boolean;
  /** Name of one list item for the add button: "абзац" -> "+ Додати абзац". */
  item?: string;
};

const byName: Record<string, FieldText> = {
  id: { label: "Ідентифікатор", hint: "Латиницею, для адрес і зв’язків між даними. Після створення не змінюється." },
  code: { label: "Код регіону" },
  published: { label: "Показувати на сайті" },
  title: { label: "Заголовок", hint: "Новий рядок у заголовку: Enter." },
  summary: { label: "Короткий текст на картці", long: true },
  lead: { label: "Вступ", long: true },
  body: { label: "Абзаци тексту", item: "абзац" },
  image: { label: "Зображення" },
  images: { label: "Фото", item: "фото" },
  photo: { label: "Фото" },
  logo: { label: "Логотип" },
  link: { label: "Посилання" },
  label: { label: "Текст посилання" },
  href: { label: "Куди веде", hint: "Сторінка сайту без мови, наприклад /events або /#services." },
  group: { label: "Група" },
  name: { label: "Назва / ім’я" },
  role: { label: "Посада" },
  position: { label: "Посада" },
  quote: { label: "Цитата", long: true },
  email: { label: "Е-мейл" },
  phones: { label: "Телефони", item: "телефон", hint: "Як показати на сайті, наприклад +39 331 34 37 100." },
  telegram: { label: "Telegram", hint: "Нік, наприклад @miufi." },
  contactButton: { label: "Показати кнопку «Зв’язатися» (форма повідомлення цій людині)" },
  includes: { label: "Що входить", hint: "Показується під фільтром галузі.", long: true },
  statement: { label: "Головні тези", item: "тезу", hint: "Кожна теза з нового рядка великим шрифтом." },
  story: { label: "Текст під фото", item: "абзац" },
  phone: { label: "Телефон", hint: "Міжнародний формат без пробілів: +380501234567." },
  tagline: { label: "Коротко про компанію" },
  description: { label: "Опис", long: true },
  industries: { label: "Галузі" },
  regions: { label: "Регіони" },
  expertise: { label: "Напрями (теги)", item: "напрям" },
  website: { label: "Сайт", hint: "Повна адреса: https://…" },
  contact: { label: "Контактна особа" },
  offers: { label: "Ми пропонуємо", item: "пункт" },
  rebuildProgram: { label: "Учасник програми Rebuild Ukraine Better" },
  pinned: { label: "Закріпити вгорі списку членів" },
  seeks: { label: "Ми шукаємо", item: "пункт" },
  category: { label: "Сторінка партнерів" },
  imageLayout: { label: "Як показати зображення" },
  city: { label: "Місто" },
  startDate: { label: "Дата початку" },
  endDate: { label: "Дата завершення" },
  seo: { label: "Для пошукових систем", hint: "Назва вкладки браузера й опис у результатах пошуку." },
  hero: { label: "Шапка сторінки" },
  cities: { label: "Міста під заголовком", item: "місто" },
  servicesHeading: { label: "Заголовок блоку карток", hint: "Читають програми екранного доступу." },
  detailsHeading: { label: "Заголовок детальних блоків", hint: "Читають програми екранного доступу." },
  intro: { label: "Вступний блок" },
  paragraphs: { label: "Абзаци", item: "абзац" },
  sectors: { label: "Експортні сектори" },
  highlights: { label: "Виділені пункти", item: "пункт" },
  history: { label: "Історія" },
  eyebrow: { label: "Надзаголовок" },
  closing: { label: "Завершальний блок" },
  rows: { label: "Скільки людей у кожному ряду", hint: "Зверху вниз. Наприклад, 3, 2, 1." },
  blocks: { label: "Блоки статті" },
  items: { label: "Пункти", item: "пункт" },
  value: { label: "Значення" },
  text: { label: "Текст", long: true },
  type: { label: "Тип блоку" },
  alt: { label: "Опис зображення", hint: "Що на фото, для людей, які не бачать зображення. Порожньо — декоративне." },
};

const byPath: Record<string, FieldText> = {
  "seo.title": { label: "Назва сторінки" },
  "seo.description": { label: "Опис сторінки", long: true },
  "hero.title": { label: "Заголовок" },
  "hero.lead": { label: "Підзаголовок", long: true },
  "closing.title": { label: "Текст", long: true },
  "contact.name": { label: "Ім’я" },
  "image": { label: "Зображення" },
};

/** "items.0.name" -> "items.name": list positions do not change the label. */
const pattern = (path: string) => path.replace(/\.\d+(?=\.|$)/g, "");

export function fieldText(path: string): FieldText {
  const clean = pattern(path);
  const name = clean.split(".").at(-1) ?? clean;
  const suffix = clean.split(".").slice(-2).join(".");
  return byPath[clean] ?? byPath[suffix] ?? byName[name] ?? { label: name };
}
