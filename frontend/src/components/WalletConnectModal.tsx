"use client";

import { Fragment, useEffect, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { useWallet } from '@/hooks/useWallet';
import { XMarkIcon } from '@heroicons/react/24/outline';

// Wallet options with their logos
const walletOptions = [
  {
    id: "metamask",
    name: "MetaMask",
    description: "Connect to your MetaMask Wallet",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="32"
        height="32"
        viewBox="0 0 212 189"
        fill="none"
      >
        <path
          d="M60.8767 173.035L88.3357 180.739V170.697L90.4988 168.535H105.844V179.848V187.999H89.4173L69.0276 179.401L60.8767 173.035Z"
          fill="#CDBDB2"
        />
        <path
          d="M151.123 173.035L124.211 180.739V170.697L122.048 168.535H106.702V179.848V187.999H123.129L143.519 179.401L151.123 173.035Z"
          fill="#CDBDB2"
        />
        <path
          d="M90.4988 153.173L88.3357 170.696L90.9468 168.533H121.053L123.664 170.696L122.048 153.173L118.89 150.464L93.1099 150.464L90.4988 153.173Z"
          fill="#393939"
        />
        <path
          d="M75.1542 56.4547L88.3355 89.0722L93.1097 150.464H118.89L123.664 89.0722L136.846 56.4547H75.1542Z"
          fill="#F89C35"
        />
        <path
          d="M27.1085 95.4384L16.1704 140.869L58.2662 139.531H82.4845V118.55L81.4029 83.1537L75.1543 88.1752L27.1085 95.4384Z"
          fill="#F89D35"
        />
        <path
          d="M93.8339 98.1491L75.6024 97.3249L70.8281 113.776L81.403 118.55L93.8339 98.1491Z"
          fill="#D87C30"
        />
        <path
          d="M93.8339 98.1497L93.1098 119.677V138.984L93.8339 98.1497Z"
          fill="#EA8D3A"
        />
        <path
          d="M82.4844 118.55L93.1094 119.678L90.4983 129.273L81.4029 139.978L82.4844 118.55Z"
          fill="#F89D35"
        />
        <path
          d="M81.4029 139.979L82.4844 118.55L27.1084 95.4384L81.4029 139.979Z"
          fill="#EB8F35"
        />
        <path
          d="M136.397 95.4384L183.347 118.55L128.105 139.979L136.397 95.4384Z"
          fill="#E8821E"
        />
        <path
          d="M128.105 139.979L137.254 118.55L136.397 95.4384L128.105 139.979Z"
          fill="#393939"
        />
        <path
          d="M70.8276 113.776L75.1538 88.1752L27.1079 95.4384L70.8276 113.776Z"
          fill="#E88F35"
        />
        <path
          d="M128.554 113.776L123.664 88.1752L136.845 95.4384L128.554 113.776Z"
          fill="#8E5A30"
        />
        <path
          d="M60.8765 173.035L81.4027 139.979L27.1084 95.4385L60.8765 173.035Z"
          fill="#F89D35"
        />
        <path
          d="M127.571 139.979L151.123 173.035L183.346 95.4384L127.571 139.979Z"
          fill="#F89D35"
        />
        <path
          d="M183.347 95.4384L128.554 113.776L136.845 95.4384H183.347Z"
          fill="#D87C30"
        />
        <path
          d="M27.1082 95.4384L70.8279 113.776L75.154 88.1752L27.1082 95.4384Z"
          fill="#EB8F35"
        />
        <path
          d="M123.664 88.1747L128.554 113.775L136.846 95.4379L123.664 88.1747Z"
          fill="#EB8F35"
        />
        <path
          d="M16.1709 140.869L60.8767 173.036L81.4029 139.98L27.1086 95.4388L16.1709 140.869Z"
          fill="#E88F35"
        />
        <path
          d="M127.571 139.98L151.123 173.036L195.829 140.869L183.346 95.4388L127.571 139.98Z"
          fill="#DB7C30"
        />
        <path
          d="M195.829 140.869L151.123 173.036L160.218 187.552L199.487 166.122L195.829 140.869Z"
          fill="#EB8F35"
        />
        <path
          d="M16.1704 140.869L12.5125 166.122L51.782 187.552L60.8767 173.036L16.1704 140.869Z"
          fill="#EB8F35"
        />
        <path
          d="M114.59 121.258L109.254 125.485L90.4985 125.485L85.1628 121.258L81.4023 139.979L90.4977 129.273L120.966 129.273L128.105 139.979L114.59 121.258Z"
          fill="#393939"
        />
        <path
          d="M93.1097 150.464L90.4986 129.273L81.4032 139.978L93.1097 150.464Z"
          fill="#E8821E"
        />
        <path
          d="M118.89 150.464L121.501 129.273L128.105 139.978L118.89 150.464Z"
          fill="#E8821E"
        />
        <path
          d="M90.4984 129.273L93.1095 150.464L118.89 150.464L121.501 129.273L118.89 129, #273L93.1095 129.273L90.4984 129.273Z"
          fill="#F89D35"
        />
        <path
          d="M56.103 63.7177L75.1542 88.175L70.828 113.776L77.3175 111.165L82.7418 100.205L67.1784 64.7177L56.103 63.7177Z"
          fill="#F89D35"
        />
        <path
          d="M155.897 63.7177L144.822 64.7177L129.258 100.205L134.683 111.165L141.172 113.776L136.846 88.175L155.897 63.7177Z"
          fill="#F89D35"
        />
        <path
          d="M75.1539 88.1742L82.7419 100.204L93.8334 98.1481L88.3356 89.071L75.1539 88.1742Z"
          fill="#D87C30"
        />
        <path
          d="M136.846 88.1742L123.665 89.071L118.167 98.1481L129.258 100.204L136.846 88.1742Z"
          fill="#D87C30"
        />
        <path
          d="M93.8339 98.1496L118.89 98.1496L123.664 89.0725L118.167 98.1496L109.254 104.532H101.29L93.1098 98.1496L88.3356 89.0725L93.8339 98.1496Z"
          fill="#EB8F35"
        />
        <path
          d="M0 101.805L16.1704 140.869L12.5126 98.1496L0 101.805Z"
          fill="#E8821E"
        />
        <path
          d="M166.297 42.7365L138.291 56.4553L155.897 63.7185V42.9676L166.297 42.7365Z"
          fill="#F89D35"
        />
        <path
          d="M45.7034 42.7365L56.103 42.9676V63.7185L75.1542 56.4553L45.7034 42.7365Z"
          fill="#F89D35"
        />
        <path
          d="M166.297 42.7368L183.347 95.4388L170.165 72.8232L166.297 42.7368Z"
          fill="#F89D35"
        />
        <path
          d="M126.637 72.8232L138.291 56.4553L166.297 42.7368L126.637 72.8232Z"
          fill="#D87C30"
        />
        <path
          d="M85.3627 72.8232L75.154 56.4553L45.7031 42.7368L85.3627 72.8232Z"
          fill="#D87C30"
        />
        <path
          d="M45.7034 42.7368L41.835 72.8232L29.2169 94.4388L45.7034 42.7368Z"
          fill="#F89D35"
        />
        <path
          d="M136.397 95.4384L126.637 72.8228L166.297 42.7363L136.397 95.4384Z"
          fill="#EB8F35"
        />
        <path
          d="M29.217 94.4384L85.3633 72.8228L45.7037 42.7363L29.217 94.4384Z"
          fill="#EB8F35"
        />
        <path
          d="M29.217 94.4384L85.3633 72.8228L45.7037 42.7363L29.217 94.4384Z"
          fill="#EB8F35"
        />
        <path
          d="M29.2166 94.4385L12.5127 98.15L41.8348 72.8229L29.2166 94.4385Z"
          fill="#E88F35"
        />
        <path
          d="M170.165 72.8229L199.487 98.15L183.347 94.4385L170.165 72.8229Z"
          fill="#E88F35"
        />
        <path
          d="M183.347 94.4379L199.487 98.1494L212 101.805L183.347 94.4379Z"
          fill="#D87C30"
        />
        <path
          d="M0 101.805L12.5126 98.1494L29.2169 94.4379L0 101.805Z"
          fill="#D87C30"
        />
        <path
          d="M93.1098 150.464L81.4033 139.978L90.4987 129.273L93.1098 150.464Z"
          fill="#393939"
        />
        <path
          d="M118.89 150.464L121.501 129.273L128.105 139.978L118.89 150.464Z"
          fill="#393939"
        />
        <path
          d="M123.664 89, #0725L129.258 100.204L136.846 88.1756L123.664 89, #0725Z"
          fill="#EB8F35"
        />
        <path
          d="M88.3355 89, #0725L75.1542 88.1756L82.7422 100.204L88.3355 89, #0725Z"
          fill="#EB8F35"
        />
      </svg>
    ),
    popular: true,
  },
  {
    id: "coinbase",
    name: "Coinbase Wallet",
    description: "Connect to your Coinbase Wallet",
    icon: (
      <svg
        width="32"
        height="32"
        viewBox="0 0 1024 1024"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect width="1024" height="1024" fill="#0052FF" />
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M152 512C152 710.823 313.177 872 512 872C710.823 872 872 710.823 872 512C872 313.177 710.823 152 512 152C313.177 152 152 313.177 152 512ZM420 396C406.745 396 396 406.745 396 420V604C396 617.255 406.745 628 420 628H604C617.255 628 628 617.255 628 604V420C628 406.745 617.255 396 604 396H420Z"
          fill="white"
        />
      </svg>
    ),
    popular: true,
  },
  {
    id: "walletconnect",
    name: "WalletConnect",
    description: "Connect with QR code",
    icon: (
      <svg
        width="32"
        height="32"
        viewBox="0 0 96 96"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M96 48C96 21.4903 74.5097 0 48 0C21.4903 0 0 21.4903 0 48C0 74.5097 21.4903 96 48 96C74.5097 96 96 74.5097 96 48Z"
          fill="#3396FF"
        />
        <path
          d="M25.4995 48.3346C25.4981 42.7764 27.0369 37.3346 29.9235 32.6255C32.8101 27.9164 36.9089 24.1171 41.7962 21.6787C46.6835 19.2403 52.1315 18.2672 57.5466 18.8622C62.9617 19.4572 68.1177 21.5942 72.3481 25.0223C76.5786 28.4504 79.7042 33.0254 81.3627 38.1762C83.0212 43.3271 83.1472 48.8347 81.7265 54.0624C80.3058 59.2901 77.4004 64.0131 73.3323 67.6483C69.2642 71.2835 64.2113 73.6767 58.83 74.5334"
          stroke="white"
          strokeWidth="7"
          strokeLinecap="round"
        />
        <path
          d="M27.5956 54.5955L32.1788 59.1787C32.3844 59.3842 32.628 59.5466 32.8962 59.6568C33.1644 59.7669 33.4517 59.8228 33.7423 59.8214C34.0332 59.8209 34.3203 59.7627 34.5879 59.6507C34.8556 59.5386 35.0982 59.3743 35.3024 59.1674L60.8139 33.6559C61.0186 33.4513 61.2605 33.2894 61.5271 33.1783C61.7937 33.0671 62.0799 33.0088 62.3695 33.0059C62.6591 33.003 62.947 33.0555 63.2167 33.1614C63.4864 33.2672 63.7327 33.4244 63.9429 33.625L68.9099 38.5911"
          stroke="white"
          strokeWidth="4"
          strokeLinecap="round"
        />
      </svg>
    ),
    popular: false,
  },
  {
    id: "trust",
    name: "Trust Wallet",
    description: "Connect to Trust Wallet",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="32"
        height="32"
        viewBox="0 0 1024 1024"
        fill="none"
      >
        <rect width="1024" height="1024" rx="512" fill="#3375BB" />
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M512.3 215C582.8 215 650.7 225.5 713.5 246.1C741.1 255.5 761 280.2 761 311.2V506.1V539.4V616.3C761 724.7 698.5 823.9 600.3 876.3L512.3 925L424.3 876.3C326.1 823.9 263.6 724.7 263.6 616.3V539.4V506.1V311.2C263.6 280.2 283.5 255.5 311.1 246.1C373.9 225.5 441.8 215 512.3 215ZM512.3 274C456.9 274 404.1 281.3 354.3 295.3C344 298.5 337.2 306.9 337.2 317.2V491V619.8C337.2 693.4 380.8 760 447.8 797L512.3 833.4L576.8 797C643.8 760 687.4 693.4 687.4 619.8V491V317.2C687.4 306.9 680.6 298.5 670.3 295.3C620.5 281.3 567.7 274 512.3 274Z"
          fill="white"
        />
      </svg>
    ),
    popular: true,
  },
];

interface WalletConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function WalletConnectModal({
  isOpen,
  onClose,
}: WalletConnectModalProps) {
  const { connect, isConnecting } = useWallet();
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null);
  const [step, setStep] = useState<"select" | "connecting" | "error">("select");
  const [error, setError] = useState<string | null>(null);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedWallet(null);
      setStep("select");
      setError(null);
    }
  }, [isOpen]);

  // Listen for wallet connection event
  useEffect(() => {
    const handleConnectRequest = () => {
      if (!isOpen) {
        // This event handler can be used to open the modal from anywhere in the app
        // onOpen();
      }
    };

    window.addEventListener("connect-wallet-requested", handleConnectRequest);
    return () => {
      window.removeEventListener(
        "connect-wallet-requested",
        handleConnectRequest
      );
    };
  }, [isOpen]);

  // Handle wallet selection
  const handleWalletSelect = async (walletId: string) => {
    setSelectedWallet(walletId);
    setStep("connecting");

    try {
      // Currently we only support MetaMask directly, but this can be expanded
      if (walletId === "metamask") {
        if (typeof window !== "undefined" && window.ethereum) {
          await connect();
          onClose();
        } else {
          setError(
            "MetaMask not detected. Please install the MetaMask extension and refresh the page."
          );
          setStep("error");
        }
      } else {
        // For other wallets, we'll need to integrate with their specific SDKs
        setError(
          "This wallet type is not yet supported. Please use MetaMask for now."
        );
        setStep("error");
      }
    } catch (err: any) {
      setError(err.message || "Failed to connect wallet. Please try again.");
      setStep("error");
    }
  };

  const renderStepContent = () => {
    switch (step) {
      case "select":
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
            {walletOptions.map((wallet) => (
              <button
                key={wallet.id}
                className={`flex items-center p-4 rounded-lg border border-gray-200 hover:border-indigo-300 hover:shadow-md transition-all ${
                  wallet.popular ? "bg-indigo-50/50" : "bg-white"
                }`}
                onClick={() => handleWalletSelect(wallet.id)}
                disabled={isConnecting}
              >
                <span className="mr-3">{wallet.icon}</span>
                <div className="text-left">
                  <h3 className="font-medium text-gray-900">{wallet.name}</h3>
                  <p className="text-xs text-gray-500">{wallet.description}</p>
                </div>
                {wallet.popular && (
                  <span className="ml-auto text-xs bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full">
                    Popular
                  </span>
                )}
              </button>
            ))}
          </div>
        );

      case "connecting":
        return (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="animate-spin h-12 w-12 border-4 border-indigo-500 border-t-transparent rounded-full mb-4"></div>
            <h3 className="text-lg font-medium text-gray-900">
              Connecting {selectedWallet === "metamask" ? "MetaMask" : "Wallet"}
            </h3>
            <p className="text-sm text-gray-500 mt-2">
              Please check your wallet and approve the connection request
            </p>
          </div>
        );

      case "error":
        return (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
              <XMarkIcon className="h-6 w-6 text-red-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900">
              Connection Failed
            </h3>
            {error && (
              <p className="text-sm text-gray-500 mt-2 text-center">{error}</p>
            )}
            <button
              className="mt-6 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
              onClick={() => setStep("select")}
            >
              Try Again
            </button>
          </div>
        );
    }
  };

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                <div className="absolute right-0 top-0 hidden pr-4 pt-4 sm:block">
                  <button
                    type="button"
                    className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                    onClick={onClose}
                  >
                    <span className="sr-only">Close</span>
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>
                <div>
                  <div className="text-center sm:text-left">
                    <Dialog.Title
                      as="h3"
                      className="text-lg font-semibold leading-6 text-gray-900"
                    >
                      Connect Wallet
                    </Dialog.Title>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Select a wallet to connect to Pharos Exchange. You'll
                        need to approve the connection request in your wallet.
                      </p>
                    </div>
                  </div>

                  {renderStepContent()}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}