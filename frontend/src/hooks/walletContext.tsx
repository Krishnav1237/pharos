"use client";
import {
  createContext,
  useState,
  useContext,
  useEffect,
  ReactNode,
} from "react";
import { ethers } from "ethers";

export interface WalletContextType {
  account: string | null;
  provider: ethers.providers.Web3Provider | null;
  signer: ethers.Signer | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  chainId: number | null;
  isConnecting: boolean;
  isConnected: boolean;
}

export const WalletContext = createContext<WalletContextType>({
  account: null,
  provider: null,
  signer: null,
  connect: async () => {},
  disconnect: () => {},
  chainId: null,
  isConnecting: false,
  isConnected: false,
});

export const WalletProvider = ({ children }: { children: ReactNode }) => {
  // ... rest of your existing code...
};
