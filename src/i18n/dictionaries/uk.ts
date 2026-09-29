/**
 * Ukrainian interface strings — the source of truth for the dictionary shape.
 * Editable page content lives in /content (see src/content); this file only
 * holds labels of the interface itself.
 */
export const uk = {
  siteName: "Асоціація Made in Ukraine for Italy",
  a11y: {
    skipToContent: "Перейти до змісту",
    mainNav: "Основна навігація",
    footerNav: "Навігація в підвалі сайту",
    openMenu: "Відкрити меню",
    closeMenu: "Закрити меню",
    languageGroup: "Мова сайту",
    logoAlt: "Логотип асоціації Made in Ukraine for Italy",
    newTab: "відкривається в новій вкладці",
  },
  nav: {
    home: "Головна",
    about: "Асоціація",
    team: "Команда",
    members: "Члени",
    partners: "Партнери",
    ukraineItaly: "Україна та Італія",
    events: "Календар заходів",
    join: "Приєднатися",
  },
  actions: {
    join: "Приєднатися",
    contact: "Зв’язатися",
    website: "Сайт",
  },
  team: {
    groups: {
      leadership: "Керівництво",
      departments: "Керівники напрямів",
      regions: "Регіональні представництва",
    },
  },
  members: {
    searchModes: "Способи пошуку",
    byIndustry: "Пошук за галузями",
    byName: "Пошук за назвою",
    byRegion: "Пошук за регіоном",
    industryHint: "Можна обрати кілька галузей.",
    namePlaceholder: "Наприклад, Thesis-I",
    regionLabel: "Регіон",
    allRegions: "Усі регіони",
    ukraine: "Україна",
    italy: "Італія",
    mapHint: "Натисніть на регіон на карті або оберіть його зі списку.",
    resultsTitle: "Члени асоціації",
    count: {
      one: "Знайдено {count} компанію",
      few: "Знайдено {count} компанії",
      many: "Знайдено {count} компаній",
      other: "Знайдено {count} компанії",
    },
    empty: "За цими умовами компаній не знайдено.",
    emptyHint: "Змініть умови пошуку або скиньте фільтри.",
    reset: "Скинути фільтри",
    offers: "Ми пропонуємо",
    seeks: "Ми шукаємо",
    contactPerson: "Контактна особа",
    email: "Ел. пошта",
    phone: "Телефон",
    expertise: "Напрями",
    noDetails: "Детальна інформація про компанію з’явиться згодом.",
  },
  events: {
    city: "Місто",
    website: "Сайт події",
  },
  article: {
    keyFigures: "Ключові показники",
  },
  comingSoon: {
    eyebrow: "Розділ у розробці",
    text: "Ми готуємо цей розділ. Незабаром тут з’явиться актуальна інформація.",
    back: "На головну",
    joinTitle: "Вступ до асоціації",
  },
  notFound: {
    eyebrow: "Помилка 404",
    title: "Сторінку не знайдено",
    text: "Можливо, посилання застаріло або сторінку перенесено.",
    back: "На головну",
  },
  footer: {
    copyright: "© 2026 Асоціація MIUFI",
  },
};

export type Dictionary = typeof uk;
