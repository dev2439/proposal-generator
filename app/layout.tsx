import type { Metadata } from "next";
import { Geist } from "next/font/google";
import Sidebar from "@/components/sidebar";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Simple two-column dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} h-full`}>
      <body className="h-full antialiased">
        <div className="flex h-full">
          <Sidebar />
          <div className="min-h-0 min-w-0 flex-1">{children}</div>
        </div>
      </body>
    </html>
  );
}
