import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ToastProvider } from "@/components/Toast";
import { ThemeProvider } from 'next-themes';
import AestheticEnhancements from "@/components/AestheticEnhancements";

const inter = Inter({ subsets: ["latin"], variable: "--font-body" });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-header" });

export const metadata: Metadata = {
  title: "Pendaftaran Sheriff Kerajaan Roxwood",
  openGraph: {
    title: "Pendaftaran Sheriff Kerajaan Roxwood",
    description: "Pendaftaran Online Sheriff Kerajaan Roxwood",
    url: "https://pendaftaran-sheriff.vercel.app",
    siteName: "Sheriff Roxwood",
  },
  twitter: {
    card: "summary",
    title: "Pendaftaran Sheriff Kerajaan Roxwood",
    description: "Pendaftaran Online Sheriff Kerajaan Roxwood",
  },
  icons: {
    icon: "/logo-dismag.png",
    apple: "/logo-dismag.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${outfit.variable}`} style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
              <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <AuthProvider>
              <ToastProvider>
                <Navbar />
                <main style={{ paddingTop: '70px', flex: 1 }}>{children}</main>
                <Footer />
                <AestheticEnhancements />
                <div id="toast-root" />
                <div id="modal-root" />
              </ToastProvider>
            </AuthProvider>
          </ThemeProvider>
      </body>
    </html>
  );
}
