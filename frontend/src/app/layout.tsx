import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { UserProvider } from "@/context/UserContext";
import { ClotheProvider } from "@/context/ClothContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Clozy",
  description: "managing your clothes",
  // viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, minimal-ui",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`min-h-screen bg-door-wood ${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <UserProvider>
          <ClotheProvider>
            {/* <Header /> */}
            {children}
          </ClotheProvider>
        </UserProvider>
      </body>
    </html>
  );
}
