import "./globals.css";
import TopBar from "@/components/TopBar";
import NavBar from "@/components/BottomNav";
import type { Metadata, Viewport } from "next";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";

export const metadata: Metadata = {
  title: "Frameloops",
  description: "A minimal photo sharing app",
  icons: {
    icon: "/Logo.png",
    apple: "/icons/icon-192x192.png",
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Frameloops",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />
        <meta name="apple-mobile-web-app-title" content="Frameloop" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
      </head>
      <body className="bg-(--bg) text-(--text)">
        <ThemeProvider>
          <AuthProvider>
            <div className="block">
              <TopBar />
            </div>
            <div>
              <NavBar />
            </div>
            <main className="mx-auto px-2">{children}</main>
          </AuthProvider>
          <script
            dangerouslySetInnerHTML={{
              __html: `
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', function() {
                navigator.serviceWorker.register('/sw.js');
              });
            }
            fetch('${process.env.NEXT_PUBLIC_API_URL}/health').catch(() => {});
          `,
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}