"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import { useWallet } from "@/hooks/useWallet";
import { useWalletModal } from "@/hooks/WalletModalContext";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Wallet, Menu, X, ChevronDown, LogOut } from "lucide-react";

const navigation = [
  { name: "Home", href: "/" },
  { name: "Markets", href: "/markets" },
  { name: "Trade", href: "/trade" },
  { name: "Portfolio", href: "/portfolio" },
];

export default function Navbar() {
  const [sheetOpen, setSheetOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { account, disconnect, isConnected, networkName, balance } =
    useWallet();
  const { openModal } = useWalletModal();

  // Close mobile menu when route changes
  useEffect(() => {
    setSheetOpen(false);
  }, [pathname]);

  // Format account address for display
  const formatAccount = (address: string) => {
    return `${address.substring(0, 6)}...${address.substring(
      address.length - 4
    )}`;
  };

  // Handle navigation for mobile menu
  const handleNavClick = (href: string) => {
    // Close the sheet first
    setSheetOpen(false);

    // Use router.push instead of relying on Link
    setTimeout(() => {
      router.push(href);
    }, 100);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background">
      <div className="container flex h-16 items-center">
        <div className="mr-4 flex">
          <Link href="/" className="flex items-center space-x-2">
            <span className="font-bold text-2xl text-gradient-brand">
              Pharos
            </span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-4 lg:space-x-6 mx-6">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={
                pathname === item.href
                  ? "text-sm font-medium text-primary transition-colors"
                  : "text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
              }
            >
              {item.name}
            </Link>
          ))}
        </nav>

        <div className="flex-1 flex justify-end">
          {isConnected && account ? (
            <div className="flex items-center space-x-4">
              <div className="hidden md:flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                {networkName}
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="flex items-center space-x-1 shadow-none"
                  >
                    <Wallet className="mr-2 h-4 w-4" />
                    <span>{formatAccount(account)}</span>
                    <ChevronDown className="h-4 w-4 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>My Wallet</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <div className="px-2 py-1.5 text-xs">
                    <div className="text-muted-foreground mb-1">Address</div>
                    <div className="font-mono break-all text-sm">{account}</div>
                  </div>
                  <DropdownMenuSeparator />
                  <div className="px-2 py-1.5 text-xs">
                    <div className="text-muted-foreground mb-1">Balance</div>
                    <div className="font-medium text-sm">
                      {parseFloat(balance).toFixed(4)} ETH
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive cursor-pointer"
                    onClick={disconnect}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Disconnect</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : (
            <Button onClick={openModal} className="shadow-md">
              <Wallet className="mr-2 h-4 w-4" />
              Connect Wallet
            </Button>
          )}

          {/* Mobile Menu */}
          <div className="flex md:hidden ml-2">
            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="h-9 w-9 p-0">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[80vw] sm:max-w-sm">
                <div className="flex flex-col space-y-4 py-4">
                  {navigation.map((item) => (
                    <button
                      key={item.name}
                      onClick={() => handleNavClick(item.href)}
                      className={
                        pathname === item.href
                          ? "text-sm font-medium text-primary text-left transition-colors"
                          : "text-sm font-medium text-muted-foreground hover:text-primary text-left transition-colors"
                      }
                    >
                      {item.name}
                    </button>
                  ))}
                  <div className="pt-4 mt-4 border-t">
                    {isConnected && account ? (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium">
                              {formatAccount(account)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {networkName}
                            </p>
                          </div>
                          <div className="text-sm font-medium">
                            {parseFloat(balance).toFixed(4)} ETH
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          className="w-full text-destructive border-destructive/50"
                          onClick={() => {
                            disconnect();
                            setSheetOpen(false);
                          }}
                        >
                          <LogOut className="mr-2 h-4 w-4" />
                          Disconnect
                        </Button>
                      </div>
                    ) : (
                      <Button
                        className="w-full"
                        onClick={() => {
                          openModal();
                          setSheetOpen(false);
                        }}
                      >
                        <Wallet className="mr-2 h-4 w-4" />
                        Connect Wallet
                      </Button>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
