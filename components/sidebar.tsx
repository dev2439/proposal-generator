"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/", label: "Proposal" },
  { href: "/profile", label: "Profile" },
] as const;

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-56 shrink-0 flex-col border-r border-[#d7dde5] bg-white">
      <nav className="flex flex-col gap-1 p-3" aria-label="Main">
        {items.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-[#2563eb] text-white"
                  : "text-[#6a7380] hover:bg-[#f8fafc] hover:text-[#1c2430]"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
