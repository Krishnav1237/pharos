'use client';

import { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { ethers } from 'ethers';

interface WalletContextType {
  account: string | null;
  provider: ethers.providers.Web3Provider | null;
  signer: ethers.Signer | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  chainId: number | null;
  isConnecting: boolean;
  isConnected: boolean;
}

const WalletContext = createContext<WalletContextType>({
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
  const [account, setAccount] = useState<string | null>(null);
  const [provider, setProvider] = useState<ethers.providers.Web3Provider | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  // Initialize provider from window.ethereum if available
  useEffect(() => {
    const initProvider = async () => {
      if (typeof window !== 'undefined' && window.ethereum) {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        setProvider(provider);
      }
    };

    initProvider();
  }, []);

  // Check if the user was previously connected
  useEffect(() => {
    const checkConnection = async () => {
      if (provider && localStorage.getItem('isWalletConnected') === 'true') {
        connect();
      }
    };

    checkConnection();
  }, [provider]);

  // Listen for account and chain changes
  useEffect(() => {
    if (typeof window !== 'undefined' && window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);
      
      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      };
    }
  }, []);

  const handleAccountsChanged = (accounts: string[]) => {
    if (accounts.length === 0) {
      // User disconnected their wallet
      disconnect();
    } else {
      setAccount(accounts[0]);
    }
  };

  const handleChainChanged = (chainIdHex: string) => {
    const newChainId = parseInt(chainIdHex, 16);
    setChainId(newChainId);
    
    // A good practice is to reload the page on chain change to ensure all data is fresh
    window.location.reload();
  };

  const connect = async () => {
    if (!window.ethereum) {
      alert('Please install MetaMask or another Ethereum wallet extension.');
      return;
    }

    try {
      setIsConnecting(true);
      
      // Request accounts access
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const network = await provider.getNetwork();
      
      setAccount(accounts[0]);
      setProvider(provider);
      setSigner(signer);
      setChainId(network.chainId);
      
      // Store connection state
      localStorage.setItem('isWalletConnected', 'true');
    } catch (error) {
      console.error('Error connecting wallet:', error);
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnect = () => {
    setAccount(null);
    setSigner(null);
    setChainId(null);
    localStorage.removeItem('isWalletConnected');
  };

  return (
    <WalletContext.Provider
      value={{
        account,
        provider,
        signer,
        connect,
        disconnect,
        chainId,
        isConnecting,
        isConnected: !!account,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}