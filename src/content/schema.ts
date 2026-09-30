/**
 * Content model for everything an editor may change in the admin panel.
 *
 * - Every translatable field is a `Localized` object: { uk, it }.
 * - Inline emphasis inside text fields uses <b>…</b> and <i>…</i>.
 * - Line breaks inside titles use "\n".
 * - Images are referenced by path: /media/… (files in /public/media or uploads).
 *
 * The same schemas validate the starting JSON in /content, the documents stored
 * in the database and every save from the admin forms (src/content/registry.ts).
 * Messages are in Ukrainian because editors see them.
 */
import { z } from "zod";

const text = z.string().trim().min(1);

export const Localized = z.object({ uk: text, it: text });

export const Id = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Лише малі латинські літери, цифри й дефіси, наприклад: my-company");

export const IsoDate = z.iso.date();

export const RegionCode = z.string().regex(/^(UA|IT)-\d{2}$/, "Код регіону ISO 3166-2, наприклад UA-46 або IT-25");

export const Media = z.object({
  src: z.string().startsWith("/media/"),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  /** Omit only for purely decorative images. */
  alt: Localized.optional(),
});

/** Internal link, written without the locale prefix: "/events", "/#services". */
export const InternalLink = z.object({
  label: Localized,
  href: z.string().startsWith("/"),
});

export const Seo = z.object({
  title: Localized,
  description: Localized,
});

export const Hero = z.object({
  title: Localized,
  lead: Localized.optional(),
});

/* ---------- Collections ---------- */

export const Service = z.object({
  id: Id,
  order: z.number().int(),
  published: z.boolean(),
  title: Localized,
  summary: Localized,
  lead: Localized,
  body: z.array(Localized).min(1),
  image: Media,
  link: InternalLink.optional(),
});

export const TeamGroup = z.enum(["leadership", "departments", "regions"]);

export const TeamMember = z.object({
  id: Id,
  order: z.number().int(),
  published: z.boolean(),
  group: TeamGroup,
  name: Localized,
  role: Localized,
  quote: Localized.optional(),
  email: z.email().optional(),
  photo: Media.optional(),
});

export const Industry = z.object({
  id: Id,
  order: z.number().int(),
  name: Localized,
});

export const Region = z.object({
  code: RegionCode,
  name: Localized,
});

export const Member = z.object({
  id: Id,
  published: z.boolean(),
  /** Company names are not translated. */
  name: text,
  tagline: Localized.optional(),
  description: Localized.optional(),
  industries: z.array(Id),
  regions: z.array(RegionCode),
  expertise: z.array(text),
  website: z.url().optional(),
  logo: Media.optional(),
  contact: z
    .object({
      name: text,
      position: Localized.optional(),
      email: z.email().optional(),
      phone: z.string().regex(/^\+\d{8,15}$/, "Міжнародний формат без пробілів, наприклад +380501234567").optional(),
      photo: Media.optional(),
    })
    .optional(),
  offers: z.array(Localized),
  seeks: z.array(Localized),
});

/** Link-preview picture, as in the design: a wide photo on top ("cover") or a logo on the left ("thumb"). */
const LinkPreviewImage = {
  image: Media.optional(),
  imageLayout: z.enum(["cover", "thumb"]).default("cover"),
};

export const PartnerCategory = z.enum(["association", "rebuild", "institutional"]);

export const Partner = z.object({
  id: Id,
  order: z.number().int(),
  published: z.boolean(),
  category: PartnerCategory,
  name: Localized,
  description: Localized.optional(),
  website: z.url().optional(),
  ...LinkPreviewImage,
});

export const Event = z
  .object({
    id: Id,
    published: z.boolean(),
    /** Official event names are not translated. */
    title: text,
    description: Localized.optional(),
    city: Localized,
    startDate: IsoDate,
    endDate: IsoDate,
    website: z.url().optional(),
    ...LinkPreviewImage,
  })
  .refine((event) => event.endDate >= event.startDate, {
    message: "Дата завершення не може бути раніше за дату початку",
    path: ["endDate"],
  });

/* ---------- Page documents ---------- */

export const HomePage = z.object({
  seo: Seo,
  hero: Hero.extend({ cities: z.array(Localized) }),
  servicesHeading: Localized,
  detailsHeading: Localized,
});

export const AboutPage = z.object({
  seo: Seo,
  hero: Hero,
  intro: z.object({
    title: Localized,
    paragraphs: z.array(Localized).min(1),
    /** Photo for this block; until it is provided the page shows a placeholder. */
    image: Media.optional(),
  }),
  sectors: z.object({
    image: Media,
    paragraphs: z.array(Localized).min(1),
    highlights: z.array(Localized),
    link: InternalLink.optional(),
  }),
  history: z.object({
    eyebrow: Localized,
    title: Localized,
    paragraphs: z.array(Localized).min(1),
    images: z.array(Media),
  }),
  closing: z.object({ title: Localized }),
});

export const SimplePage = z.object({ seo: Seo, hero: Hero });

export const TeamPage = SimplePage.extend({
  /** People per row for each group, top to bottom (as in the design). */
  rows: z.record(TeamGroup, z.array(z.number().int().positive())).optional(),
});

export const ArticleBlock = z.discriminatedUnion("type", [
  z.object({ type: z.literal("paragraph"), text: Localized }),
  z.object({ type: z.literal("heading"), text: Localized }),
  z.object({ type: z.literal("list"), items: z.array(Localized).min(1) }),
  z.object({
    type: z.literal("figures"),
    items: z.array(z.object({ value: Localized, label: Localized })).min(1),
  }),
]);

export const ArticlePage = SimplePage.extend({
  blocks: z.array(ArticleBlock).min(1),
});


export type LocalizedText = z.infer<typeof Localized>;
