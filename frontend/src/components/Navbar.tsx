"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useWallet } from "@/hooks/useWallet";
import { useWalletModal } from "@/hooks/WalletModalContext";
import {
  Bars3Icon,
  XMarkIcon,
  WalletIcon,
  ArrowRightOnRectangleIcon,
  ChevronDownIcon,
} from "@heroicons/react/24/outline";

const navigation = [
  { name: "Home", href: "/" },
  { name: "Markets", href: "/markets" },
  { name: "Trade", href: "/trade" },
  { name: "Portfolio", href: "/portfolio" },
];

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [walletMenuOpen, setWalletMenuOpen] = useState(false);
  const pathname = usePathname();
  const { account, disconnect, isConnected, networkName, balance } =
    useWallet();
  const { openModal } = useWalletModal();

  // Close wallet menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (walletMenuOpen) {
        setWalletMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [walletMenuOpen]);

  // Format account address for display
  const formatAccount = (address: string) => {
    return `${address.substring(0, 6)}...${address.substring(
      address.length - 4
    )}`;
  };

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <nav
        className="mx-auto flex max-w-7xl items-center justify-between p-4 lg:px-8"
        aria-label="Global"
      >
        <div className="flex lg:flex-1">
          <Link href="/" className="-m-1.5 p-1.5">
            <span className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Pharos
            </span>
          </Link>
        </div>

        <div className="flex lg:hidden">
          <button
            type="button"
            className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-gray-700"
            onClick={() => setMobileMenuOpen(true)}
          >
            <span className="sr-only">Open main menu</span>
            <Bars3Icon className="h-6 w-6" aria-hidden="true" />
          </button>
        </div>

        <div className="hidden lg:flex lg:gap-x-12">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={`text-sm font-semibold leading-6 ${
                pathname === item.href
                  ? "text-indigo-600"
                  : "text-gray-900 hover:text-indigo-600"
              }`}
            >
              {item.name}
            </Link>
          ))}
        </div>

        <div className="hidden lg:flex lg:flex-1 lg:justify-end">
          {isConnected && account ? (
            <div className="flex items-center">
              <div className="mr-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                {networkName}
              </div>

              <div className="relative">
                <button
                  onClick={() => setWalletMenuOpen(!walletMenuOpen)}
                  className="flex items-center space-x-1 text-sm font-medium px-4 py-2 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors"
                >
                  <WalletIcon className="h-4 w-4 mr-1" />
                  <span>{formatAccount(account)}</span>
                  <ChevronDownIcon className="h-4 w-4" />
                </button>

                {walletMenuOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-md shadow-lg border border-gray-200 z-50">
                    <div className="p-3 border-b border-gray-200">
                      <p className="text-sm font-medium text-gray-700">
                        Wallet
                      </p>
                      <p className="text-xs text-gray-500 mt-1 break-all">
                        {account}
                      </p>
                    </div>
                    <div className="p-3 border-b border-gray-200">
                      <p className="text-sm text-gray-600">Balance</p>
                      <p className="text-sm font-medium">
                        {parseFloat(balance).toFixed(4)} ETH
                      </p>
                    </div>
                    <div className="p-3">
                      <button
                        onClick={() => {
                          disconnect();
                          setWalletMenuOpen(false);
                        }}
                        className="w-full flex items-center justify-center text-sm text-red-600 hover:text-red-800"
                      >
                        <ArrowRightOnRectangleIcon className="h-4 w-4 mr-1" />
                        Disconnect
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <button
              onClick={openModal}
              className="relative text-sm font-semibold leading-6 px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
            >
              <WalletIcon className="h-4 w-4 inline mr-1" />
              Connect Wallet
            </button>
          )}
        </div>
      </nav>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-white">
          <div className="fixed inset-0 flex">
            <div className="w-full">
              <div className="flex items-center justify-between p-6">
                <Link
                  href="/"
                  className="-m-1.5 p-1.5"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                    Pharos
                  </span>
                </Link>
                <button
                  type="button"
                  className="-m-2.5 rounded-md p-2.5 text-gray-700"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span className="sr-only">Close menu</span>
                  <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                </button>
              </div>
              <div className="mt-6 flow-root">
                <div className="divide-y divide-gray-500/10">
                  <div className="space-y-2 py-6 px-6">
                    {navigation.map((item) => (
                      <Link
                        key={item.name}
                        href={item.href}
                        className={`-mx-3 block rounded-lg px-3 py-2 text-base font-semibold leading-7 ${
                          pathname === item.href
                            ? "text-indigo-600 bg-indigo-50"
                            : "text-gray-900 hover:bg-gray-50"
                        }`}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        {item.name}
                      </Link>
                    ))}
                  </div>
                  <div className="py-6 px-6">
                    {isConnected && account ? (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium">
                              {formatAccount(account)}
                            </p>
                            <p className="text-xs text-gray-500">
                              {networkName}
                            </p>
                          </div>
                          <div className="text-sm font-medium">
                            {parseFloat(balance).toFixed(4)} ETH
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            disconnect();
                            setMobileMenuOpen(false);
                          }}
                          className="flex w-full items-center justify-center text-sm text-red-600 hover:text-red-800 px-4 py-2 border border-red-100 rounded-lg"
                        >
                          <ArrowRightOnRectangleIcon className="h-4 w-4 mr-1" />
                          Disconnect
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          openModal();
                          setMobileMenuOpen(false);
                        }}
                        className="text-sm font-semibold leading-6 px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 w-full flex items-center justify-center"
                      >
                        <WalletIcon className="h-4 w-4 mr-2" />
                        Connect Wallet
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
