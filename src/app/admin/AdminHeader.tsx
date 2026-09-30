import Link from "next/link";
import type { AdminUser } from "@/server/auth/session";
import { logoutAction } from "./actions";

type Section = "submissions" | "content";

export function AdminHeader({ admin, current = "submissions" }: { admin: AdminUser; current?: Section }) {
  return (
    <header className="admin-header">
      <Link className="admin-brand" href="/admin">
        CRM MIUFI
      </Link>
      <nav aria-label="Адмін-панель">
        <Link href="/admin" aria-current={current === "submissions" ? "page" : undefined}>
          Заявки
        </Link>
        <Link href="/admin/content" aria-current={current === "content" ? "page" : undefined}>
          Контент сайту
        </Link>
        <a href="/uk" target="_blank" rel="noopener noreferrer">
          Сайт
          <span className="visually-hidden"> (відкривається в новій вкладці)</span>
        </a>
      </nav>
      <div className="admin-user">
        <span>{admin.name}</span>
        <form action={logoutAction}>
          <button type="submit" className="admin-link-button">
            Вийти
          </button>
        </form>
      </div>
    </header>
  );
}
