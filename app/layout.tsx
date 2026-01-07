import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/layout/Header";

export const metadata: Metadata = {
  title: "Kit - AI Superapp",
  description: "Your personalized AI toolkit",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto p-4">
          {children}
        </main>
      </body>
    </html>
  );
}
