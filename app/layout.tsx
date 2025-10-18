import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Azmeraw Bekele Import & Export",
  description: "Ethiopian Import & Export Company",
  icons: {
    icon: '/logo.png',
    apple: '/logo.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
