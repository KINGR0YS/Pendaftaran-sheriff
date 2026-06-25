import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ToastProvider } from "@/components/Toast";

const inter = Inter({ subsets: ["latin"], variable: "--font-body" });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-header" });

export const metadata: Metadata = {
  title: "Sheriff Kerajaan Roxwood - FiveM Recruitment & Roster",
  description: "Sistem pendaftaran dan roster Sheriff Kerajaan Roxwood",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${outfit.variable}`} style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <AuthProvider>
          <ToastProvider>
            <Navbar />
            <main style={{ paddingTop: '70px', flex: 1 }}>{children}</main>
            <Footer />
            <div id="toast-root" />
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
