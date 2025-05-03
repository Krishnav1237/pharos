// src/hooks/walletContext.tsx with debugging
"use client";
import {
  createContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from "react";
import { ethers } from "ethers";
import { useRenderTracker, usePropsChange } from "@/hooks/useRenderTracker";

export interface WalletContextType {
  account: string | null;
  provider: ethers.providers.Web3Provider | null;
  signer: ethers.Signer | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  chainId: number | null;
  isConnecting: boolean;
  isConnected: boolean;
  networkName: string;
  balance: string;
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
  networkName: "",
  balance: "0",
});

const NETWORKS: Record<number, string> = {
  1: "Ethereum Mainnet",
  5: "Goerli Testnet",
  11155111: "Sepolia Testnet",
  137: "Polygon",
  80001: "Mumbai Testnet",
  56: "BNB Smart Chain",
  42161: "Arbitrum One",
  10: "Optimism",
  1337: "Local Development Chain",
};

export const WalletProvider = ({ children }: { children: ReactNode }) => {
  // Add render tracking
  useRenderTracker("WalletProvider");

  const [account, setAccount] = useState<string | null>(null);
  const [provider, setProvider] =
    useState<ethers.providers.Web3Provider | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [balance, setBalance] = useState("0");
  const [networkName, setNetworkName] = useState("");

  // Debug state changes
  useEffect(() => {
    console.log("WalletProvider state:", {
      account,
      chainId,
      isConnecting,
      balance,
      networkName,
      hasProvider: !!provider,
      hasSigner: !!signer,
    });
  }, [account, chainId, isConnecting, balance, networkName, provider, signer]);

  const updateAccountDetails = useCallback(
    async (
      ethersProvider: ethers.providers.Web3Provider,
      accountAddress: string
    ) => {
      console.log("updateAccountDetails called");
      try {
        const network = await ethersProvider.getNetwork();
        setChainId(network.chainId);
        setNetworkName(
          NETWORKS[network.chainId] || `Unknown Network (${network.chainId})`
        );

        const accountBalance = await ethersProvider.getBalance(accountAddress);
        setBalance(ethers.utils.formatEther(accountBalance));

        const ethersSigner = ethersProvider.getSigner();
        setSigner(ethersSigner);
      } catch (error) {
        console.error("Error updating account details:", error);
      }
    },
    []
  );

  // Initialize provider (with debugging)
  useEffect(() => {
    console.log("WalletProvider - initial mount");
    let mounted = true;

    const initProvider = async () => {
      if (typeof window !== "undefined" && window.ethereum && mounted) {
        try {
          const ethersProvider = new ethers.providers.Web3Provider(
            window.ethereum,
            "any"
          );
          setProvider(ethersProvider);

          const accounts = await window.ethereum.request({
            method: "eth_accounts",
          });
          if (accounts.length > 0 && mounted) {
            const accountAddress = accounts[0];
            setAccount(accountAddress);
            updateAccountDetails(ethersProvider, accountAddress);
          }
        } catch (error) {
          console.error("Error initializing provider:", error);
        }
      }
    };

    initProvider();

    return () => {
      mounted = false;
      console.log("WalletProvider - cleanup");
    };
  }, [updateAccountDetails]);

  // Event listeners (with debugging)
  useEffect(() => {
    console.log("Setting up event listeners");

    if (typeof window !== "undefined" && window.ethereum) {
      const handleAccountsChanged = (accounts: string[]) => {
        console.log("accountsChanged event:", accounts);
        if (accounts.length > 0) {
          const accountAddress = accounts[0];
          setAccount(accountAddress);
          if (provider) {
            updateAccountDetails(provider, accountAddress);
          }
        } else {
          setAccount(null);
          setSigner(null);
          setBalance("0");
        }
      };

      const handleChainChanged = () => {
        console.log("chainChanged event - reloading page");
        window.location.reload();
      };

      window.ethereum.on("accountsChanged", handleAccountsChanged);
      window.ethereum.on("chainChanged", handleChainChanged);

      return () => {
        console.log("Cleaning up event listeners");
        window.ethereum.removeListener(
          "accountsChanged",
          handleAccountsChanged
        );
        window.ethereum.removeListener("chainChanged", handleChainChanged);
      };
    }
  }, [provider, updateAccountDetails]);

  const connect = async () => {
    if (typeof window === "undefined" || !window.ethereum) {
      alert(
        "No Ethereum wallet found. Please install MetaMask or another compatible wallet."
      );
      return;
    }

    try {
      setIsConnecting(true);

      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });

      if (accounts.length > 0) {
        const accountAddress = accounts[0];
        setAccount(accountAddress);

        if (provider) {
          await updateAccountDetails(provider, accountAddress);
        }
      }
    } catch (error: any) {
      if (error.code === 4001) {
        console.log("User rejected the connection request");
      } else {
        console.error("Error connecting wallet:", error);
      }
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnect = () => {
    setAccount(null);
    setSigner(null);
    setBalance("0");
  };

  const contextValue = useCallback(
    () => ({
      account,
      provider,
      signer,
      connect,
      disconnect,
      chainId,
      isConnecting,
      isConnected: !!account,
      networkName,
      balance,
    }),
    [account, provider, signer, chainId, isConnecting, networkName, balance]
  );

  return (
    <WalletContext.Provider value={contextValue()}>
      {children}
    </WalletContext.Provider>
  );
};
