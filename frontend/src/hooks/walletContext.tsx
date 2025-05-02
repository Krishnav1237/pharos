// src/hooks/walletContext.tsx
"use client";
import {
  createContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
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

// Network names based on chain ID
const NETWORKS: Record<number, string> = {
  1: "Ethereum Mainnet",
  5: "Goerli Testnet",
  11155111: "Sepolia Testnet",
  137: "Polygon",
  80001: "Mumbai Testnet",
  56: "BNB Smart Chain",
  42161: "Arbitrum One",
  10: "Optimism",
  // Add more networks as needed
  1337: "Local Development Chain",
};

export const WalletProvider = ({ children }: { children: ReactNode }) => {
  const [account, setAccount] = useState<string | null>(null);
  const [provider, setProvider] =
    useState<ethers.providers.Web3Provider | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [balance, setBalance] = useState("0");
  const [networkName, setNetworkName] = useState("");

  // Function to update account details
  const updateAccountDetails = useCallback(
    async (
      ethersProvider: ethers.providers.Web3Provider,
      accountAddress: string
    ) => {
      try {
        // Get network
        const network = await ethersProvider.getNetwork();
        setChainId(network.chainId);
        setNetworkName(
          NETWORKS[network.chainId] || `Unknown Network (${network.chainId})`
        );

        // Get balance
        const accountBalance = await ethersProvider.getBalance(accountAddress);
        setBalance(ethers.utils.formatEther(accountBalance));

        // Set signer
        const ethersSigner = ethersProvider.getSigner();
        setSigner(ethersSigner);
      } catch (error) {
        console.error("Error updating account details:", error);
      }
    },
    []
  );

  // Initialize provider on client-side only
  useEffect(() => {
    if (typeof window !== "undefined" && window.ethereum) {
      try {
        const ethersProvider = new ethers.providers.Web3Provider(
          window.ethereum,
          "any"
        );
        setProvider(ethersProvider);

        // Check if already connected
        window.ethereum
          .request({ method: "eth_accounts" })
          .then((accounts: string[]) => {
            if (accounts.length > 0) {
              const accountAddress = accounts[0];
              setAccount(accountAddress);
              updateAccountDetails(ethersProvider, accountAddress);
            }
          })
          .catch((err: Error) => {
            console.error("Error checking for accounts:", err);
          });
      } catch (error) {
        console.error("Error initializing provider:", error);
      }
    }
  }, [updateAccountDetails]);

  // Setup event listeners for account and chain changes
  useEffect(() => {
    if (typeof window !== "undefined" && window.ethereum) {
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length > 0) {
          const accountAddress = accounts[0];
          setAccount(accountAddress);
          if (provider) {
            updateAccountDetails(provider, accountAddress);
          }
        } else {
          // Disconnected
          setAccount(null);
          setSigner(null);
          setBalance("0");
        }
      };

      const handleChainChanged = () => {
        // Reload the page when chain changes
        window.location.reload();
      };

      // Listen for account changes
      window.ethereum.on("accountsChanged", handleAccountsChanged);
      // Listen for chain changes
      window.ethereum.on("chainChanged", handleChainChanged);

      // Clean up event listeners
      return () => {
        window.ethereum.removeListener(
          "accountsChanged",
          handleAccountsChanged
        );
        window.ethereum.removeListener("chainChanged", handleChainChanged);
      };
    }
  }, [provider, updateAccountDetails]);

  // Connect wallet function
  const connect = async () => {
    if (typeof window === "undefined" || !window.ethereum) {
      alert(
        "No Ethereum wallet found. Please install MetaMask or another compatible wallet."
      );
      return;
    }

    try {
      setIsConnecting(true);

      // Request account access
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
      // Handle specific error cases
      if (error.code === 4001) {
        // User rejected request
        console.log("User rejected the connection request");
      } else {
        console.error("Error connecting wallet:", error);
      }
    } finally {
      setIsConnecting(false);
    }
  };

  // Disconnect wallet function
  const disconnect = () => {
    setAccount(null);
    setSigner(null);
    setBalance("0");

    // Note: There is no standard method to disconnect wallets in Web3
    // This is a UI disconnect only, the connection to MetaMask remains
    // and will reconnect automatically when the page is reloaded
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
        networkName,
        balance,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};
