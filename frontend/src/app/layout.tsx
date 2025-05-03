// app/layout.tsx
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { DebugProviders } from "./debug-providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Pharos Exchange",
  description: "Decentralized exchange for tokenized assets",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <DebugProviders>
          <Navbar />
          {children}
        </DebugProviders>
      </body>
    </html>
  );
}
