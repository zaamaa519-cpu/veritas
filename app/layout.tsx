import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { ThemeProvider } from "@/components/theme-provider";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { Toaster } from "@/components/ui/toaster";
import { AnalysisProvider } from "@/contexts/analysis-context";
import { AuthProvider } from "@/contexts/auth-context";
import { AnimatedCharacter } from "@/components/veritas-ai/animated-character";
import { GlobalChatbot } from "@/components/veritas-ai/global-chatbot";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Veritas AI",
  description: "AI-powered fake news detection tool.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body
        className={cn(
          "min-h-screen bg-background font-body antialiased",
          inter.variable
        )}
      >
        <AuthProvider>
          <AnalysisProvider>
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
            >
              <div className="relative flex min-h-dvh flex-col bg-background overflow-hidden">
                <AnimatedCharacter className="absolute top-0 left-0 w-1/2 h-auto opacity-[0.15] -translate-x-1/3 -translate-y-1/3" animationDirection="reverse" />
                <AnimatedCharacter className="absolute bottom-0 right-0 w-1/2 h-auto opacity-[0.15] translate-x-1/3 translate-y-1/3" />
                <Header />
                <main className="flex-1 relative z-10">{children}</main>
                <Footer />
                <GlobalChatbot />
              </div>
              <Toaster />
            </ThemeProvider>
          </AnalysisProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
