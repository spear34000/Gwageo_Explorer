import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import DemoBanner from "@/components/DemoBanner";

export const metadata: Metadata = {
  title: "과거탐색기 - 조선시대 과거시험 본관별 합격 기록",
  description:
    "조선시대 과거시험 데이터를 기반으로 성씨·본관별 합격 기록을 탐색합니다. 문과·무과·생원·진사 합격 기록을 본관별로 집계해 보여줍니다.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className="h-full" suppressHydrationWarning>
      <body className="flex min-h-full min-w-0 flex-col overflow-x-hidden bg-background text-foreground">
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');var d=window.matchMedia('(prefers-color-scheme: dark)').matches;if(t==='dark'||(!t&&d)){document.documentElement.classList.add('dark');}}catch(e){}})();`,
          }}
        />
        <DemoBanner />
        <Header />
        <main className="mx-auto min-w-0 w-full max-w-5xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
