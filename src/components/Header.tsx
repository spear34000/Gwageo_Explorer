"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import ThemeToggle from "./ThemeToggle";

const NAV_ITEMS = [
  { href: "/clans", label: "본관 검색" },
  { href: "/rankings", label: "본관 순위" },
  { href: "/periods", label: "시대별" },
  { href: "/exams", label: "과거시험" },
  { href: "/about/data", label: "데이터 소개" },
] as const;

export default function Header() {
  const pathname = usePathname();

  const isActive = (href: string) =>
    pathname === href || (href !== "/" && pathname.startsWith(href));

  return (
    <header className="border-b border-line bg-background">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 sm:flex-nowrap sm:gap-8 sm:px-6">
        <Link
          href="/"
          className="font-display text-xl font-bold tracking-tight text-foreground no-underline hover:no-underline"
          aria-label="과거탐색기 홈"
        >
          과거탐색기
        </Link>
        <nav aria-label="주요 내비게이션" className="order-3 flex basis-full flex-wrap items-baseline gap-x-3 gap-y-1 border-t border-line pt-2 sm:order-none sm:basis-auto sm:border-0 sm:pt-0 sm:gap-x-4">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`text-sm no-underline ${
                isActive(item.href)
                  ? "font-semibold text-accent"
                  : "text-ink-2 hover:text-accent hover:underline"
              }`}
              aria-current={isActive(item.href) ? "page" : undefined}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
