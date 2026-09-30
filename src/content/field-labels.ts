/**
 * Field names and hints for the admin forms, by property name.
 * A path ("hero.lead") wins over a bare name ("lead").
 */
type FieldText = { label: string; hint?: string; long?: boolean };

const byName: Record<string, FieldText> = {
  id: { label: "Ідентифікатор", hint: "Латиницею, для адрес і зв’язків між даними. Після створення не змінюється." },
  code: { label: "Код регіону" },
  published: { label: "Показувати на сайті" },
  title: { label: "Заголовок", hint: "Новий рядок у заголовку: Enter." },
  summary: { label: "Короткий текст на картці", long: true },
  lead: { label: "Вступ", long: true },
  body: { label: "Абзаци тексту" },
  image: { label: "Зображення" },
  images: { label: "Фото" },
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
  phone: { label: "Телефон", hint: "Міжнародний формат без пробілів: +380501234567." },
  tagline: { label: "Коротко про компанію" },
  description: { label: "Опис", long: true },
  industries: { label: "Галузі" },
  regions: { label: "Регіони" },
  expertise: { label: "Напрями (теги)" },
  website: { label: "Сайт", hint: "Повна адреса: https://…" },
  contact: { label: "Контактна особа" },
  offers: { label: "Ми пропонуємо" },
  seeks: { label: "Ми шукаємо" },
  category: { label: "Сторінка партнерів" },
  imageLayout: { label: "Як показати зображення" },
  city: { label: "Місто" },
  startDate: { label: "Дата початку" },
  endDate: { label: "Дата завершення" },
  seo: { label: "Для пошукових систем", hint: "Назва вкладки браузера й опис у результатах пошуку." },
  hero: { label: "Шапка сторінки" },
  cities: { label: "Міста під заголовком" },
  servicesHeading: { label: "Заголовок блоку карток", hint: "Читають програми екранного доступу." },
  detailsHeading: { label: "Заголовок детальних блоків", hint: "Читають програми екранного доступу." },
  intro: { label: "Вступний блок" },
  paragraphs: { label: "Абзаци" },
  sectors: { label: "Експортні сектори" },
  highlights: { label: "Виділені пункти" },
  history: { label: "Історія" },
  eyebrow: { label: "Надзаголовок" },
  closing: { label: "Завершальний блок" },
  rows: { label: "Скільки людей у кожному ряду", hint: "Зверху вниз. Наприклад, 3, 2, 1." },
  blocks: { label: "Блоки статті" },
  items: { label: "Пункти" },
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
};

/** "items.0.name" -> "items.name": list positions do not change the label. */
const pattern = (path: string) => path.replace(/\.\d+(?=\.|$)/g, "");

export function fieldText(path: string): FieldText {
  const clean = pattern(path);
  const name = clean.split(".").at(-1) ?? clean;
  const suffix = clean.split(".").slice(-2).join(".");
  return byPath[clean] ?? byPath[suffix] ?? byName[name] ?? { label: name };
}
