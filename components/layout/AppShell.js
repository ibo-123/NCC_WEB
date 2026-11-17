"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
<<<<<<< HEAD
  Award,
  BarChart3,
=======
>>>>>>> 4a131924bdc825c2a5a2d4bec268b3a1b5cda3b5
  Bell,
  BookOpen,
  CalendarCheck,
  ClipboardList,
  Code,
<<<<<<< HEAD
  Flame,
  LayoutDashboard,
  Lock,
  LogOut,
  Megaphone,
  Menu,
  Settings,
  ShieldCheck,
  Star,
  Trophy,
  User,
=======
  LayoutDashboard,
  Megaphone,
  Menu,
  Settings,
  Trophy,
>>>>>>> 4a131924bdc825c2a5a2d4bec268b3a1b5cda3b5
  Users,
  Video,
  X,
} from "lucide-react";
import { cx } from "@/components/ui/cx.js";
import { ThemeToggle } from "./ThemeToggle.js";

// Icons are referenced by name so server components can pass plain data to this client component.
const ICONS = {
  dashboard: LayoutDashboard,
  announcements: Megaphone,
  lectures: Video,
  attendance: CalendarCheck,
  problems: Code,
  topics: BookOpen,
  contests: Trophy,
  notifications: Bell,
  users: Users,
  audit: ClipboardList,
  settings: Settings,
<<<<<<< HEAD
  progress: BarChart3,
  rating: Star,
  profile: User,
  streak: Flame,
  results: Award,
  restricted: Lock,
  shield: ShieldCheck,
  logout: LogOut,
};

function isActive(pathname, href) {
  if (href === "/admin") return pathname === "/admin";
=======
};

function isActive(pathname, href) {
>>>>>>> 4a131924bdc825c2a5a2d4bec268b3a1b5cda3b5
  return pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * Application frame: sidebar (a slide-over drawer under 800 px), top bar with breadcrumbs and theme toggle, content.
 *
<<<<<<< HEAD
 * brand:             { name, sub?, mark?, href? }
 * sections:          [{ title?, items: [{ href, label, icon? }] }]
 * user:              { name, detail?, initials? } | undefined
 * breadcrumbs:       [{ label, href? }]  (the last item is the current page)
 * footer:            optional node rendered at the bottom of the sidebar
 * notificationsHref: optional link for topbar bell icon
 * profileHref:       optional link for topbar user avatar/name
 */
export function AppShell({
  brand,
  sections,
  user,
  breadcrumbs = [],
  footer,
  notificationsHref,
  profileHref,
  children,
}) {
=======
 * brand:        { name, sub?, mark? }
 * sections:     [{ title?, items: [{ href, label, icon? }] }]
 * user:         { name, detail?, initials? } | undefined
 * breadcrumbs:  [{ label, href? }]  (the last item is the current page)
 * footer:       optional node rendered at the bottom of the sidebar
 */
export function AppShell({ brand, sections, user, breadcrumbs = [], footer, children }) {
>>>>>>> 4a131924bdc825c2a5a2d4bec268b3a1b5cda3b5
  const pathname = usePathname() ?? "";
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
<<<<<<< HEAD
    <div className="ncc-ambient-glow min-h-screen bg-bg text-fg min-[800px]:grid min-[800px]:grid-cols-[248px_1fr]">
=======
    <div className="min-h-screen bg-bg text-fg min-[800px]:grid min-[800px]:grid-cols-[248px_1fr]">
>>>>>>> 4a131924bdc825c2a5a2d4bec268b3a1b5cda3b5
      <aside
        id="app-nav"
        aria-label="Main navigation"
        className={cx(
          "flex flex-col gap-1 border-r border-border bg-sidebar px-3 py-4 text-sidebar-fg",
          "max-[799px]:fixed max-[799px]:inset-y-0 max-[799px]:left-0 max-[799px]:z-40 max-[799px]:w-[272px] max-[799px]:transition-transform",
          open ? "max-[799px]:translate-x-0" : "max-[799px]:invisible max-[799px]:-translate-x-full",
        )}
      >
        <div className="flex items-center gap-2.5 px-2 pt-1 pb-3">
<<<<<<< HEAD
          {brand.href ? (
            <Link href={brand.href} className="flex items-center gap-2.5 text-inherit no-underline">
              <span className="grid size-8 flex-none place-items-center rounded-xl bg-primary font-bold text-primary-text">
                {brand.mark ?? brand.name.slice(0, 1)}
              </span>
              <span className="leading-[1.1] font-semibold tracking-tight">
                {brand.name}
                {brand.sub ? (
                  <span className="block text-[11px] font-medium tracking-wide text-sidebar-muted uppercase">{brand.sub}</span>
                ) : null}
              </span>
            </Link>
          ) : (
            <>
              <span className="grid size-8 flex-none place-items-center rounded-xl bg-primary font-bold text-primary-text">
                {brand.mark ?? brand.name.slice(0, 1)}
              </span>
              <span className="leading-[1.1] font-semibold tracking-tight">
                {brand.name}
                {brand.sub ? (
                  <span className="block text-[11px] font-medium tracking-wide text-sidebar-muted uppercase">{brand.sub}</span>
                ) : null}
              </span>
            </>
          )}
=======
          <span className="grid size-8 flex-none place-items-center rounded-lg bg-primary font-semibold text-primary-text">
            {brand.mark ?? brand.name.slice(0, 1)}
          </span>
          <span className="leading-[1.1] font-semibold tracking-tight">
            {brand.name}
            {brand.sub ? (
              <span className="block text-[11px] font-medium tracking-wide text-sidebar-muted uppercase">{brand.sub}</span>
            ) : null}
          </span>
>>>>>>> 4a131924bdc825c2a5a2d4bec268b3a1b5cda3b5
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close navigation"
<<<<<<< HEAD
            className="ml-auto grid size-9 cursor-pointer place-items-center rounded-xl text-sidebar-fg hover:bg-sidebar-hover min-[800px]:hidden"
=======
            className="ml-auto grid size-9 cursor-pointer place-items-center rounded-lg text-sidebar-fg hover:bg-sidebar-hover min-[800px]:hidden"
>>>>>>> 4a131924bdc825c2a5a2d4bec268b3a1b5cda3b5
          >
            <X aria-hidden="true" size={18} />
          </button>
        </div>

<<<<<<< HEAD
        <nav className="flex flex-col gap-0.5">
          {sections.map((section, i) => (
            <div key={section.title ?? i} className="flex flex-col gap-0.5">
=======
        <nav className="flex flex-col gap-1">
          {sections.map((section, i) => (
            <div key={section.title ?? i} className="flex flex-col gap-1">
>>>>>>> 4a131924bdc825c2a5a2d4bec268b3a1b5cda3b5
              {section.title ? (
                <p className="mx-2.5 mt-3.5 mb-1 text-[11px] font-semibold tracking-widest text-sidebar-muted uppercase">
                  {section.title}
                </p>
              ) : null}
              {section.items.map((item) => {
                const Icon = item.icon ? ICONS[item.icon] : null;
                const active = isActive(pathname, item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    aria-current={active ? "page" : undefined}
                    className={cx(
<<<<<<< HEAD
                      "flex min-h-10 items-center gap-2.5 rounded-xl border px-2.5 py-2 text-sm font-medium whitespace-nowrap no-underline transition-colors duration-150",
                      active
                        ? "border-primary/30 bg-sidebar-active text-sidebar-active-fg"
                        : "border-transparent text-sidebar-fg hover:bg-sidebar-hover",
                    )}
                  >
                    {Icon ? <Icon aria-hidden="true" size={17} className={active ? "text-primary" : "text-sidebar-muted"} /> : null}
                    <span className="truncate">{item.label}</span>
=======
                      "flex min-h-10 items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium no-underline",
                      active ? "bg-sidebar-active text-sidebar-active-fg" : "text-sidebar-fg hover:bg-sidebar-hover",
                    )}
                  >
                    {Icon ? <Icon aria-hidden="true" size={18} className={active ? "text-primary" : undefined} /> : null}
                    {item.label}
>>>>>>> 4a131924bdc825c2a5a2d4bec268b3a1b5cda3b5
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {footer ? <div className="mt-auto flex flex-col gap-1 pt-3">{footer}</div> : null}
      </aside>

      {open ? (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-30 cursor-default bg-overlay min-[800px]:hidden"
        />
      ) : null}

      <div className="flex min-w-0 flex-col">
<<<<<<< HEAD
        <header className="flex h-16 items-center gap-3 border-b border-border bg-topbar/90 px-6 backdrop-blur-sm max-[480px]:px-3">
=======
        <header className="flex h-14 items-center gap-3 border-b border-border bg-topbar px-5 max-[480px]:px-3">
>>>>>>> 4a131924bdc825c2a5a2d4bec268b3a1b5cda3b5
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Open navigation"
            aria-expanded={open}
            aria-controls="app-nav"
<<<<<<< HEAD
            className="grid size-10 cursor-pointer place-items-center rounded-xl border border-border bg-surface text-fg min-[800px]:hidden"
=======
            className="grid size-10 cursor-pointer place-items-center rounded-lg border border-border bg-surface text-fg min-[800px]:hidden"
>>>>>>> 4a131924bdc825c2a5a2d4bec268b3a1b5cda3b5
          >
            <Menu aria-hidden="true" size={18} />
          </button>
          <nav aria-label="Breadcrumb" className="min-w-0">
            <ol className="m-0 flex list-none flex-wrap items-center gap-1.5 p-0 text-[13px] text-muted">
              {breadcrumbs.map((crumb, i) => {
                const last = i === breadcrumbs.length - 1;
                return (
                  <li key={`${crumb.label}-${i}`} className="flex items-center gap-1.5">
                    {last || !crumb.href ? (
                      <span aria-current={last ? "page" : undefined} className={cx(last && "font-medium text-fg")}>
                        {crumb.label}
                      </span>
                    ) : (
<<<<<<< HEAD
                      <Link href={crumb.href} className="text-fg-2 no-underline hover:text-fg">
=======
                      <Link href={crumb.href} className="text-fg-2 no-underline">
>>>>>>> 4a131924bdc825c2a5a2d4bec268b3a1b5cda3b5
                        {crumb.label}
                      </Link>
                    )}
                    {last ? null : <span aria-hidden="true">/</span>}
                  </li>
                );
              })}
            </ol>
          </nav>
          <div className="ml-auto flex items-center gap-2">
<<<<<<< HEAD
            {notificationsHref ? (
              <Link
                href={notificationsHref}
                aria-label="Notifications"
                className="grid size-10 place-items-center rounded-xl border border-border bg-surface text-fg-2 no-underline transition-colors hover:bg-sunken hover:text-fg"
              >
                <Bell aria-hidden="true" size={17} />
              </Link>
            ) : null}
            <ThemeToggle />
            {user ? (
              profileHref ? (
                <Link
                  href={profileHref}
                  className="flex items-center gap-2.5 rounded-xl border border-border bg-surface px-2.5 py-1.5 text-sm font-medium text-fg no-underline transition-colors hover:bg-sunken"
                >
                  <span
                    aria-hidden="true"
                    className="grid size-7 flex-none place-items-center rounded-lg bg-primary-soft font-mono text-xs font-semibold text-primary"
                  >
                    {user.initials ?? user.name.slice(0, 1)}
                  </span>
                  <span className="max-[640px]:hidden">
                    {user.name}
                    {user.detail ? <small className="block text-[11px] font-normal text-muted">{user.detail}</small> : null}
                  </span>
                </Link>
              ) : (
                <div className="flex items-center gap-2.5 rounded-xl border border-border bg-surface px-2.5 py-1.5 text-sm font-medium">
                  <span
                    aria-hidden="true"
                    className="grid size-7 flex-none place-items-center rounded-lg bg-primary-soft font-mono text-xs font-semibold text-primary"
                  >
                    {user.initials ?? user.name.slice(0, 1)}
                  </span>
                  <span className="max-[640px]:hidden">
                    {user.name}
                    {user.detail ? <small className="block text-[11px] font-normal text-muted">{user.detail}</small> : null}
                  </span>
                </div>
              )
            ) : null}
          </div>
        </header>
        <main className="mx-auto flex w-full max-w-[1380px] flex-col gap-5 px-8 pt-7 pb-12 max-[800px]:px-5 max-[480px]:px-4">{children}</main>
=======
            <ThemeToggle />
            {user ? (
              <div className="flex items-center gap-2 text-sm font-medium">
                <span
                  aria-hidden="true"
                  className="grid size-8 flex-none place-items-center rounded-full bg-primary-soft text-xs font-semibold text-primary"
                >
                  {user.initials ?? user.name.slice(0, 1)}
                </span>
                <span className="max-[640px]:hidden">
                  {user.name}
                  {user.detail ? <small className="block text-xs font-normal text-muted">{user.detail}</small> : null}
                </span>
              </div>
            ) : null}
          </div>
        </header>
        <main className="flex flex-col gap-5 px-8 pt-7 pb-12 max-[800px]:px-5 max-[480px]:px-4">{children}</main>
>>>>>>> 4a131924bdc825c2a5a2d4bec268b3a1b5cda3b5
      </div>
    </div>
  );
}

/** Page title block with optional description and actions. */
export function PageHeader({ title, description, actions }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0">
<<<<<<< HEAD
        <h1 className="m-0 text-[28px] leading-[1.18] font-semibold tracking-tight text-balance max-[480px]:text-2xl">{title}</h1>
        {description ? <p className="mt-1 max-w-[62ch] text-sm text-fg-2">{description}</p> : null}
=======
        <h1 className="m-0 text-[28px] leading-[1.2] font-semibold tracking-tight max-[480px]:text-2xl">{title}</h1>
        {description ? <p className="mt-1 max-w-[62ch] text-fg-2">{description}</p> : null}
>>>>>>> 4a131924bdc825c2a5a2d4bec268b3a1b5cda3b5
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}
