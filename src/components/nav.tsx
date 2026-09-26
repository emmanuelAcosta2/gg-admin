"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ICONS: Record<string, React.ReactNode> = {
  agenda: (
    <>
      <rect x="3.5" y="5" width="17" height="15" rx="2.5" />
      <path d="M3.5 10h17M8 3v4M16 3v4" />
    </>
  ),
  registro: <path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01" />,
  clientes: (
    <>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20c.5-3.6 3-5.5 6.5-5.5s6 1.9 6.5 5.5M16 4.8a3.4 3.4 0 010 6.4M18 14.8c2 .6 3.2 2.2 3.5 5" />
    </>
  ),
  reportes: <path d="M4 20V10M10 20V4M16 20v-7M21 20H3" />,
  ajustes: (
    <>
      <path d="M4 7h9M17 7h3M4 17h3M11 17h9" />
      <circle cx="15" cy="7" r="2" />
      <circle cx="9" cy="17" r="2" />
    </>
  ),
};

export const SECTIONS = [
  { href: "/agenda", key: "agenda", label: "Agenda" },
  { href: "/registro", key: "registro", label: "Registro" },
  { href: "/clientes", key: "clientes", label: "Clientes" },
  { href: "/reportes", key: "reportes", label: "Reportes" },
  { href: "/ajustes", key: "ajustes", label: "Ajustes" },
] as const;

export function Nav({ variant }: { variant: "side" | "bottom" }) {
  const pathname = usePathname();
  const side = variant === "side";

  return (
    <nav
      aria-label="Secciones"
      className={
        side
          ? "flex flex-col gap-1 p-3"
          : "grid grid-cols-5 border-t border-line bg-surface pb-[env(safe-area-inset-bottom)]"
      }
    >
      {SECTIONS.map(({ href, key, label }) => {
        const active = pathname === href || pathname.startsWith(href + "/");
        return (
          <Link
            key={key}
            href={href}
            aria-current={active ? "page" : undefined}
            className={
              side
                ? `flex items-center gap-3 rounded-[10px] px-3.5 py-3 text-[15px] font-semibold transition-colors ${
                    active
                      ? "bg-raised text-brand shadow-[inset_3px_0_0_var(--color-brand)]"
                      : "text-muted hover:bg-raised hover:text-fg"
                  }`
                : `flex flex-col items-center gap-[3px] pt-2.5 pb-2 text-[11px] font-semibold tracking-wide ${
                    active ? "text-brand" : "text-muted"
                  }`
            }
          >
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
              className="size-[22px] fill-none stroke-current stroke-[1.8] [stroke-linecap:round] [stroke-linejoin:round]"
            >
              {ICONS[key]}
            </svg>
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
