"use client";

import { usePathname } from "next/navigation";
import Sidebar from "@/components/sidebar";

export default function AppFrame({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();

  if (pathname === "/unlock") {
    return children;
  }

  return (
    <div className="flex h-full">
      <Sidebar />
      <div className="min-h-0 min-w-0 flex-1">{children}</div>
    </div>
  );
}
