import { Home, Languages, Settings, Sparkles } from "lucide-react";
import { NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { ReactNode } from "react";
import { cn } from "../lib/utils";

function NavItem({
  to,
  label,
  icon,
}: {
  to: string;
  label: string;
  icon: ReactNode;
}) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          "inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm transition duration-200",
          isActive
            ? "bg-[var(--color-accent)] text-slate-950"
            : "text-[var(--color-text-muted)] hover:bg-white/55 hover:text-[var(--color-text)] dark:hover:bg-slate-950/20",
        )
      }
    >
      {icon}
      <span>{label}</span>
    </NavLink>
  );
}

export function AppShell({
  children,
  title,
  subtitle,
  actions,
}: {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  const { t } = useTranslation();

  return (
    <div className="mx-auto flex min-h-screen max-w-7xl flex-col gap-6 px-4 pb-[calc(5rem+env(safe-area-inset-bottom))] pt-4 sm:px-6 lg:px-8">
      <a
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-white focus:px-4 focus:py-2"
        href="#main-content"
      >
        {t("common.skipToContent")}
      </a>
      <header className="surface-card sticky top-4 z-40 flex items-center justify-between gap-3 rounded-[1.5rem] px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--color-accent)] text-slate-950">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <div className="font-[var(--font-heading)] text-base font-semibold">Kana Flow</div>
            <div className="text-xs text-[var(--color-text-muted)]">{title ?? t("home.quickStart")}</div>
          </div>
        </div>
        <nav className="hidden items-center gap-2 md:flex">
          <NavItem to="/" label={t("nav.home")} icon={<Home className="h-4 w-4" />} />
          <NavItem to="/scripts" label={t("nav.scripts")} icon={<Languages className="h-4 w-4" />} />
          <NavItem to="/progress" label={t("nav.progress")} icon={<Sparkles className="h-4 w-4" />} />
          <NavItem to="/settings" label={t("nav.settings")} icon={<Settings className="h-4 w-4" />} />
        </nav>
      </header>

      {(title || subtitle || actions) && (
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="space-y-1">
            {title ? <h1 className="font-[var(--font-heading)] text-3xl font-semibold tracking-tight">{title}</h1> : null}
            {subtitle ? <p className="max-w-2xl text-sm text-[var(--color-text-muted)]">{subtitle}</p> : null}
          </div>
          {actions}
        </div>
      )}

      <main id="main-content" className="flex-1">
        {children}
      </main>

      <nav className="surface-card fixed inset-x-4 bottom-4 z-40 flex items-center justify-around rounded-[1.5rem] p-2 md:hidden">
        <NavItem to="/" label={t("nav.home")} icon={<Home className="h-4 w-4" />} />
        <NavItem to="/scripts" label={t("nav.scripts")} icon={<Languages className="h-4 w-4" />} />
        <NavItem to="/progress" label={t("nav.progress")} icon={<Sparkles className="h-4 w-4" />} />
        <NavItem to="/settings" label={t("nav.settings")} icon={<Settings className="h-4 w-4" />} />
      </nav>
    </div>
  );
}
