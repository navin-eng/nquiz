import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { ThemeProvider } from "@/components/layout/ThemeProvider";
import { Toaster } from "react-hot-toast";

export const metadata: Metadata = {
  title: "nQuiz",
  description: "A dynamic and premium quiz experience.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <AuthProvider>
          <ThemeProvider>
            <div className="app-container">
              {children}
            </div>
            <Toaster position="bottom-right" toastOptions={{ className: 'glass-panel !p-4 !bg-background !text-foreground' }} />
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
