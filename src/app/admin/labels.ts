import type { SubmissionKind, SubmissionStatus } from "@/server/db/schema";

export const statusLabels: Record<SubmissionStatus, string> = {
  new: "Нова",
  in_progress: "В роботі",
  done: "Опрацьована",
  spam: "Спам",
};

export const kindLabels: Record<SubmissionKind, string> = {
  join: "Вступ до асоціації",
  contact: "Звернення до команди",
};

export const formatDateTime = (date: Date) =>
  new Intl.DateTimeFormat("uk-UA", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Kyiv" }).format(date);
