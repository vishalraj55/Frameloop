import "./globals.css";
import TopBar from "@/components/TopBar";
import NavBar from "@/components/BottomNav";
import Providers from "@/components/Providers";

export const metadata = {
  title: "Frameloop",
  description: "A calm, minimal photo sharing app",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-[#f2f2f2] text-[#262626]">
        <Providers>
          <div className="block">
            <TopBar />
          </div>

          <div>
            <NavBar />
          </div>

          <main
            className="
              mx-auto
              max-w-160
              px-4
              pt-11 md:pt-6
              pb-16 md:pb-6
            "
          >
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}