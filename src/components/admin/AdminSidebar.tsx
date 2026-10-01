"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { logoutAction } from "@/app/admin/actions";
import emblem from "@/assets/images/emblem.png";
import { sectionLinkHref, siteSections } from "@/content/registry";

type AdminSidebarProps = {
  adminName: string;
  newSubmissions: number;
};

/** Left navigation of the admin panel: work items, then every page of the site with its parts. */
export function AdminSidebar({ adminName, newSubmissions }: AdminSidebarProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isCurrent = (href: string) => pathname === href || pathname.startsWith(`${href}/`);
  const current = (href: string, exact = false) =>
    (exact ? pathname === href : isCurrent(href)) ? ("page" as const) : undefined;

  return (
    <aside className="adm-sidebar">
      <div className="adm-sidebar-top">
        <Link className="adm-brand" href="/admin">
          <Image src={emblem} alt="" width={36} height={36} />
          <span>
            Made in Ukraine for Italy
            <small>Адмін-панель</small>
          </span>
        </Link>
        <button
          type="button"
          className="adm-menu-toggle"
          aria-expanded={open}
          aria-controls="adm-nav"
          onClick={() => setOpen((value) => !value)}
        >
          {open ? "Закрити" : "Меню"}
        </button>
      </div>

      {/* On phones the menu folds away after a link is chosen */}
      <nav
        id="adm-nav"
        className="adm-nav"
        data-open={open || undefined}
        aria-label="Адмін-панель"
        onClick={(event) => {
          if ((event.target as HTMLElement).closest("a")) setOpen(false);
        }}
      >
        <ul className="adm-nav-list">
          <li>
            <Link href="/admin" aria-current={current("/admin", true)}>
              Огляд
            </Link>
          </li>
          <li>
            <Link href="/admin/submissions" aria-current={current("/admin/submissions")}>
              Заявки
              {newSubmissions > 0 && (
                <span className="adm-badge">
                  {newSubmissions}
                  <span className="visually-hidden"> нових</span>
                </span>
              )}
            </Link>
          </li>
        </ul>

        <p className="adm-nav-title" id="adm-nav-site">
          Сторінки сайту
        </p>
        <ul className="adm-nav-list" aria-labelledby="adm-nav-site">
          {siteSections.map((section) => {
            const hrefs = section.links.map(sectionLinkHref);
            const active = hrefs.some((href) => isCurrent(href));
            return (
              <li key={section.id} data-active={active || undefined}>
                <Link href={hrefs[0]} aria-current={section.links.length === 1 ? current(hrefs[0]) : undefined}>
                  {section.title}
                </Link>
                {active && section.links.length > 1 && (
                  <ul className="adm-nav-sub">
                    {section.links.map((link, index) => (
                      <li key={hrefs[index]}>
                        <Link href={hrefs[index]} aria-current={current(hrefs[index])}>
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>

        <div className="adm-sidebar-foot">
          <a href="/uk" target="_blank" rel="noopener noreferrer">
            Відкрити сайт ↗<span className="visually-hidden"> (відкривається в новій вкладці)</span>
          </a>
          <p className="adm-user">{adminName}</p>
          <form action={logoutAction}>
            <button type="submit" className="adm-logout">
              Вийти
            </button>
          </form>
        </div>
      </nav>
    </aside>
  );
}
