import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";
import { TopNav } from "@/components/layout/top-nav";
import { Footer } from "@/components/layout/footer";
import { PageContainer } from "@/components/layout/page-container";
import { ConsoleGuard } from "@/components/common/console-guard";
import { AmbientBackground } from "@/components/layout/ambient-background";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.regcompiler.app"),
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
  openGraph: {
    title: "RegCompiler | Regulation as Code",
    description: "Autonomous Regulation-as-Code Compiler & Statutory Surveillance Engine",
    url: "https://www.regcompiler.app",
    siteName: "RegCompiler",
    images: [
      {
        url: "/logo-icon.png",
        width: 800,
        height: 600,
        alt: "RegCompiler Autonomous Compliance Engine",
      }
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "RegCompiler | Regulation as Code",
    description: "Autonomous Regulation-as-Code Compiler & Statutory Surveillance Engine",
    images: ["/logo-icon.png"],
  },
};

import { Suspense } from "react";
import { IntraAppToastProvider } from "@/components/ui/intra-app-toast";
import { EntitlementGuard } from "@/components/billing/entitlement-guard";
import { Analytics } from "@vercel/analytics/next";

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
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      signInFallbackRedirectUrl="/dashboard"
      signUpFallbackRedirectUrl="/dashboard"
    >
      <html
        lang="en"
        className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
        style={{ colorScheme: 'dark' }}
      >
        <body className="min-h-full flex flex-col bg-[#080706] text-[#F1EEE7] relative selection:bg-[#AD956C]/25 selection:text-[#F7F4EC]">
          <AmbientBackground />
          <IntraAppToastProvider>
            <ConsoleGuard />
            <Suspense fallback={null}>
              <EntitlementGuard />
            </Suspense>
            <TopNav />
            <main className="flex-1 w-full py-3 sm:py-6 md:py-8 relative z-10">
              <PageContainer>
                {children}
              </PageContainer>
            </main>
            <Footer />
          </IntraAppToastProvider>
          <Analytics />
        </body>
      </html>
    </ClerkProvider>
  );
}
