// app/debug-providers.tsx
"use client";

import { ErrorBoundary } from "./error-boundary";
import { WalletProvider } from "@/hooks/walletContext";
import { WalletModalProvider } from "@/hooks/WalletModalContext";
import { useRenderTracker } from "@/hooks/useRenderTracker";

export function DebugProviders({ children }: { children: React.ReactNode }) {
  useRenderTracker("DebugProviders");

  return (
    <ErrorBoundary>
      <WalletProvider>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ErrorBoundary>
  );
}
