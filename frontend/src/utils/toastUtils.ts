import toast from 'react-hot-toast';

// Success notification for transactions
export const notifySuccess = (message: string) => {
  toast.success(message, {
    duration: 5000,
    position: 'top-right',
    icon: '✅',
  });
};

// Error notification for transactions
export const notifyError = (message: string) => {
  toast.error(message, {
    duration: 7000,
    position: 'top-right',
    icon: '❌',
  });
};

// Info notification
export const notifyInfo = (message: string) => {
  toast(message, {
    duration: 4000,
    position: 'top-right',
    icon: 'ℹ️',
  });
};

// Warning notification
export const notifyWarning = (message: string) => {
  toast(message, {
    duration: 5000,
    position: 'top-right',
    icon: '⚠️',
    style: {
      background: '#FFFBEB',
      color: '#92400E',
      border: '1px solid #FEF3C7',
    },
  });
};

// Transaction pending notification
export const notifyTxPending = (message: string = 'Transaction pending...') => {
  return toast.loading(message, {
    position: 'top-right',
  });
};

// Update transaction status
export const updateTxStatus = (
  toastId: string, 
  status: 'success' | 'error', 
  message: string
) => {
  toast.dismiss(toastId);
  
  if (status === 'success') {
    notifySuccess(message);
  } else {
    notifyError(message);
  }
};

// Notify when wallet is not connected
export const notifyWalletRequired = () => {
  notifyWarning('Please connect your wallet to continue');
  
  // Trigger wallet connect modal
  window.dispatchEvent(new CustomEvent('connect-wallet-requested'));
};

// Format transaction hash for notification
export const formatTxHash = (txHash: string) => {
  const shortHash = `${txHash.substring(0, 6)}...${txHash.substring(txHash.length - 4)}`;
  return `<a href="https://etherscan.io/tx/${txHash}" target="_blank" rel="noopener noreferrer" class="underline">${shortHash}</a>`;
};