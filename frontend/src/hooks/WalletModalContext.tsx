"use client";

import React, { createContext, useState, useContext, ReactNode } from "react";
import WalletConnectModal from "@/components/WalletConnectModal";

interface WalletModalContextType {
  isOpen: boolean;
  openModal: () => void;
  closeModal: () => void;
}

const WalletModalContext = createContext<WalletModalContextType>({
  isOpen: false,
  openModal: () => {},
  closeModal: () => {},
});

export const useWalletModal = () => useContext(WalletModalContext);

export function WalletModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  const openModal = () => setIsOpen(true);
  const closeModal = () => setIsOpen(false);

  return (
    <WalletModalContext.Provider value={{ isOpen, openModal, closeModal }}>
      {children}
      <WalletConnectModal isOpen={isOpen} onClose={closeModal} />
    </WalletModalContext.Provider>
  );
}
