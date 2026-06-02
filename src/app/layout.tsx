import "./globals.css";
import TopBar from "@/components/TopBar";
import NavBar from "@/components/BottomNav";
import type { Metadata, Viewport } from "next";
import { AuthProvider } from "@/context/AuthContext";

export const metadata: Metadata = {
  title: "Frameloop",
  description: "A minimal photo sharing app",
  icons: { 
    icon: "/Logo.png",
    apple: "/icons/icon-192x192.png",
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Frameloop",
  },
};

export const viewport: Viewport = {
  themeColor: "#000000",
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
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Frameloop" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
      </head>
      <body className="bg-[#f2f2f2] text-[#262626]">
        <AuthProvider>
          <div className="block">
            <TopBar />
          </div>
          <div>
            <NavBar />
          </div>
          <main className="mx-auto max-w-160 px-2 pt-1 md:pt-2 pb-16 md:pb-6">
            {children}
          </main>
        </AuthProvider>
        <script dangerouslySetInnerHTML={{
          __html: `
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', function() {
                navigator.serviceWorker.register('/sw.js');
              });
            }
            fetch('${process.env.NEXT_PUBLIC_API_URL}/health').catch(() => {});
          `
        }} />
      </body>
    </html>
  );
}