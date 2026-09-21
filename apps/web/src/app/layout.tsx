import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";
import { TopNav } from "@/components/layout/top-nav";
import { Footer } from "@/components/layout/footer";
import { PageContainer } from "@/components/layout/page-container";
import { ConsoleGuard } from "@/components/common/console-guard";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "RegCompiler | Regulation as Code",
  description: "Autonomous Regulation-as-Code Compiler & Statutory Surveillance Engine",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/logo-icon.png", type: "image/png" }
    ],
    apple: [
      { url: "/apple-touch-icon.png" }
    ],
  },
};

import { Suspense } from "react";
import { IntraAppToastProvider } from "@/components/ui/intra-app-toast";
import { EntitlementGuard } from "@/components/billing/entitlement-guard";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      appearance={{
        options: {
          unsafe_disableDevelopmentModeWarnings: true,
        },
      }}
    >
      <html
        lang="en"
        className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
        style={{ colorScheme: 'dark' }}
      >
        <body className="min-h-full flex flex-col bg-[#0a0a0c] text-gray-100">
          <IntraAppToastProvider>
            <ConsoleGuard />
            <Suspense fallback={null}>
              <EntitlementGuard />
            </Suspense>
            <TopNav />
            <main className="flex-1 w-full py-8">
              <PageContainer>
                {children}
              </PageContainer>
            </main>
            <Footer />
          </IntraAppToastProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
