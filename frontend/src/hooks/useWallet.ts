import { useContext } from 'react';
import { WalletContext } from './walletContext';

// Export the hook as a function
export const useWallet = () => useContext(WalletContext);

// Re-export provider for convenience
export { WalletProvider } from './walletContext';