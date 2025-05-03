"use client";

import { WalletProvider } from "@/hooks/useWallet";
import { WalletModalProvider } from "@/hooks/WalletModalContext";
import { Toaster } from "react-hot-toast";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WalletProvider>
      <WalletModalProvider>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: "#FFFFFF",
              color: "#333333",
              boxShadow: "0 3px 10px rgba(0, 0, 0, 0.1)",
              borderRadius: "8px",
              padding: "16px",
            },
            success: {
              iconTheme: {
                primary: "#4F46E5",
                secondary: "#FFFFFF",
              },
            },
            error: {
              iconTheme: {
                primary: "#EF4444",
                secondary: "#FFFFFF",
              },
            },
          }}
        />
      </WalletModalProvider>
    </WalletProvider>
  );
}
