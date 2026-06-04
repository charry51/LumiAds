import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LumiAds | Inteligencia Digital Signage",
  description: "Plataforma SaaS para gestionar pantallas publicitarias, campañas y monetización con LumiAds.",
  icons: {
    icon: "/LogoPequeno.png",
  },
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  userScalable: true,
};

import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "next-themes";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className="h-full antialiased"
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          {children}
        </ThemeProvider>
        <Toaster />
      </body>
    </html>
  );
}

