import type { ReactNode } from "react";
import type { AdminUser } from "@/server/auth/session";
import { countByStatus } from "@/server/submissions";
import { AdminSidebar } from "./AdminSidebar";

/** Frame of every admin page: sidebar navigation and the work area. */
export async function AdminShell({ admin, children }: { admin: AdminUser; children: ReactNode }) {
  const counts = await countByStatus();
  return (
    <div className="adm">
      <a className="skip-link" href="#main">
        Перейти до змісту
      </a>
      <AdminSidebar adminName={admin.name} newSubmissions={counts.new} />
      <main className="adm-main" id="main" tabIndex={-1}>
        {children}
      </main>
    </div>
  );
}

type Crumb = { label: string; href?: string };

/** Breadcrumbs, title, short description and actions at the top of a page. */
export function AdminPageHeader({
  crumbs = [],
  title,
  description,
  actions,
}: {
  crumbs?: Crumb[];
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <header className="adm-head">
      {crumbs.length > 0 && (
        <nav aria-label="Ви тут" className="adm-crumbs">
          <ol>
            {crumbs.map((crumb) => (
              <li key={crumb.label}>{crumb.href ? <a href={crumb.href}>{crumb.label}</a> : crumb.label}</li>
            ))}
          </ol>
        </nav>
      )}
      <div className="adm-head-row">
        <h1>{title}</h1>
        {actions && <div className="adm-head-actions">{actions}</div>}
      </div>
      {description && <p className="adm-head-text">{description}</p>}
    </header>
  );
}
