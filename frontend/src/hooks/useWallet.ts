import { useContext } from 'react';
import { WalletContext, WalletContextType } from './walletContext';

// Export the hook as a function
export const useWallet = (): WalletContextType => useContext(WalletContext);

// Re-export provider for convenience
export { WalletProvider } from './walletContext';