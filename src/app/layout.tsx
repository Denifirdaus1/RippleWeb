import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/shared/components/Sidebar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Ripple - Stay Focused & Organized",
  description: "Web version of Ripple task management",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} flex`} suppressHydrationWarning>
        <Sidebar />
        <div className="flex-1">
          {children}
        </div>
      </body>
    </html>
  );
}
