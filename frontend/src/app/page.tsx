import Link from "next/link";
import Image from "next/image";
import {
  ArrowTrendingUpIcon,
  ScaleIcon,
  CubeIcon,
  ShieldCheckIcon,
  ArrowRightIcon,
} from "@heroicons/react/24/outline";
import MarketOverview from "@/components/MarketOverview";

export default function Home() {
  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-white rounded-xl shadow-sm">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 to-purple-50 z-0"></div>
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="text-left">
              <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Pharos Exchange
              </h1>
              <p className="text-xl text-gray-600 mb-8 max-w-xl">
                The first decentralized exchange for tokenized stocks and
                commodities. Trade with confidence on a secure, transparent
                blockchain platform.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link
                  href="/markets"
                  className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition flex items-center"
                >
                  Explore Markets
                  <ArrowRightIcon className="ml-2 h-5 w-5" />
                </Link>
                <Link
                  href="/trade"
                  className="px-6 py-3 border border-indigo-600 text-indigo-600 rounded-lg hover:bg-indigo-50 transition"
                >
                  Start Trading
                </Link>
              </div>
            </div>
            <div className="hidden lg:block">
              <div className="relative h-96 w-full">
                <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-xl"></div>
                <div className="absolute -top-4 left-20 w-48 h-48 bg-purple-300/20 rounded-full blur-3xl"></div>
                <div className="absolute -bottom-8 right-16 w-64 h-64 bg-indigo-300/20 rounded-full blur-3xl"></div>
                <div className="relative z-10 p-6">
                  <div className="bg-white/80 backdrop-blur-lg rounded-xl shadow-xl p-6 mb-6 transform rotate-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <div className="h-8 w-8 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-xs">
                          T
                        </div>
                        <span className="ml-2 font-semibold">TSLA</span>
                      </div>
                      <span className="text-green-600 font-semibold">
                        +4.35%
                      </span>
                    </div>
                    <div className="h-24 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg mb-2"></div>
                    <div className="text-right text-xl font-bold">$174.50</div>
                  </div>

                  <div className="bg-white/80 backdrop-blur-lg rounded-xl shadow-xl p-6 ml-12 transform -rotate-2">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <div className="h-8 w-8 bg-amber-600 rounded-full flex items-center justify-center text-white font-bold text-xs">
                          G
                        </div>
                        <span className="ml-2 font-semibold">GOLD</span>
                      </div>
                      <span className="text-green-600 font-semibold">
                        +0.68%
                      </span>
                    </div>
                    <div className="h-24 bg-gradient-to-r from-amber-50 to-yellow-50 rounded-lg mb-2"></div>
                    <div className="text-right text-xl font-bold">
                      $2,331.45
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Market Stats */}
      <section className="py-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <h3 className="text-lg font-semibold text-gray-500 mb-2">
              Total Trading Volume
            </h3>
            <p className="text-3xl font-bold">$12.5M</p>
            <p className="text-sm text-green-600 mt-1">+12.3% from last week</p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm">
            <h3 className="text-lg font-semibold text-gray-500 mb-2">
              Active Traders
            </h3>
            <p className="text-3xl font-bold">5,234</p>
            <p className="text-sm text-green-600 mt-1">+8.7% from last week</p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm">
            <h3 className="text-lg font-semibold text-gray-500 mb-2">
              Available Assets
            </h3>
            <p className="text-3xl font-bold">25+</p>
            <p className="text-sm text-indigo-600 mt-1">Stocks & Commodities</p>
          </div>
        </div>
      </section>

      {/* Market Overview */}
      <section>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Market Overview</h2>
          <Link
            href="/markets"
            className="text-indigo-600 hover:text-indigo-800 text-sm font-medium flex items-center"
          >
            View All Markets
            <ArrowRightIcon className="ml-1 h-4 w-4" />
          </Link>
        </div>
        <MarketOverview />
      </section>

      {/* Features */}
      <section className="py-12 bg-white rounded-xl shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold mb-10 text-center">
            Why Choose Pharos Exchange
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 px-4">
            <div className="p-6 text-center transition-all hover:transform hover:-translate-y-1">
              <div className="mx-auto w-12 h-12 mb-4 flex items-center justify-center rounded-full bg-indigo-100">
                <ArrowTrendingUpIcon className="h-6 w-6 text-indigo-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Tokenized Assets</h3>
              <p className="text-gray-600">
                Trade traditional stocks and commodities as blockchain tokens
                with 24/7 market access
              </p>
            </div>

            <div className="p-6 text-center transition-all hover:transform hover:-translate-y-1">
              <div className="mx-auto w-12 h-12 mb-4 flex items-center justify-center rounded-full bg-indigo-100">
                <ScaleIcon className="h-6 w-6 text-indigo-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Fair & Transparent</h3>
              <p className="text-gray-600">
                All trades executed on a decentralized blockchain network with
                verifiable transactions
              </p>
            </div>

            <div className="p-6 text-center transition-all hover:transform hover:-translate-y-1">
              <div className="mx-auto w-12 h-12 mb-4 flex items-center justify-center rounded-full bg-indigo-100">
                <CubeIcon className="h-6 w-6 text-indigo-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Smart Contracts</h3>
              <p className="text-gray-600">
                Secure trading powered by audited smart contracts with built-in
                risk management
              </p>
            </div>

            <div className="p-6 text-center transition-all hover:transform hover:-translate-y-1">
              <div className="mx-auto w-12 h-12 mb-4 flex items-center justify-center rounded-full bg-indigo-100">
                <ShieldCheckIcon className="h-6 w-6 text-indigo-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Self-Custody</h3>
              <p className="text-gray-600">
                Maintain full control of your assets with your own wallet, no
                custodial risks
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-12 bg-gray-50 rounded-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold mb-12 text-center">
            How Pharos Exchange Works
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-xl shadow-sm relative">
              <div className="absolute -top-6 left-8 w-12 h-12 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xl font-bold">
                1
              </div>
              <h3 className="text-xl font-semibold mb-4 mt-4">
                Connect Your Wallet
              </h3>
              <p className="text-gray-600 mb-4">
                Link your Web3 wallet like MetaMask or WalletConnect to access
                the platform
              </p>
              <Link
                href="#"
                className="text-indigo-600 hover:text-indigo-800 font-medium"
              >
                Learn More →
              </Link>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-sm relative">
              <div className="absolute -top-6 left-8 w-12 h-12 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xl font-bold">
                2
              </div>
              <h3 className="text-xl font-semibold mb-4 mt-4">
                Select Your Assets
              </h3>
              <p className="text-gray-600 mb-4">
                Browse and select from a wide range of tokenized stocks and
                commodities
              </p>
              <Link
                href="/markets"
                className="text-indigo-600 hover:text-indigo-800 font-medium"
              >
                View Markets →
              </Link>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-sm relative">
              <div className="absolute -top-6 left-8 w-12 h-12 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xl font-bold">
                3
              </div>
              <h3 className="text-xl font-semibold mb-4 mt-4">
                Trade Instantly
              </h3>
              <p className="text-gray-600 mb-4">
                Place buy or sell orders with competitive pricing and low
                transaction fees
              </p>
              <Link
                href="/trade"
                className="text-indigo-600 hover:text-indigo-800 font-medium"
              >
                Start Trading →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 text-center bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl text-white">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl font-bold mb-4">Ready to start trading?</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Connect your wallet and join thousands of traders on the Pharos
            Exchange platform. Trade with confidence and security.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/portfolio"
              className="px-6 py-3 bg-white text-indigo-600 rounded-lg hover:bg-gray-100 transition"
            >
              View Your Portfolio
            </Link>
            <Link
              href="/markets"
              className="px-6 py-3 bg-transparent border border-white text-white rounded-lg hover:bg-white/10 transition"
            >
              Explore Markets
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-12 bg-white rounded-xl shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold mb-10 text-center">
            What Our Traders Say
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-gray-50 p-6 rounded-xl">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold">
                  A
                </div>
                <div className="ml-3">
                  <h4 className="font-semibold">Alex Thompson</h4>
                  <div className="text-yellow-400 flex">★★★★★</div>
                </div>
              </div>
              <p className="text-gray-600">
                &quot;Pharos Exchange made it incredibly easy to diversify my
                portfolio with tokenized assets. The interface is intuitive and
                the transaction fees are reasonable.&quot;
              </p>
            </div>

            <div className="bg-gray-50 p-6 rounded-xl">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold">
                  M
                </div>
                <div className="ml-3">
                  <h4 className="font-semibold">Maria Rodriguez</h4>
                  <div className="text-yellow-400 flex">★★★★★</div>
                </div>
              </div>
              <p className="text-gray-600">
                &quot;I&apos;ve been using Pharos for 6 months and I&apos;m
                impressed with the security features. Being able to trade
                traditional assets on a blockchain is revolutionary.&quot;
              </p>
            </div>

            <div className="bg-gray-50 p-6 rounded-xl">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold">
                  J
                </div>
                <div className="ml-3">
                  <h4 className="font-semibold">James Wilson</h4>
                  <div className="text-yellow-400 flex">
                    ★★★★<span className="text-gray-300">★</span>
                  </div>
                </div>
              </div>
              <p className="text-gray-600">
                &quot;The 24/7 trading capability is a game-changer. No more
                waiting for traditional markets to open. Customer support is
                responsive when I needed help.&quot;
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-12 bg-gray-50 rounded-xl">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-3xl font-bold mb-10 text-center">
            Frequently Asked Questions
          </h2>

          <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <h3 className="text-lg font-semibold mb-2">
                How do tokenized stocks work?
              </h3>
              <p className="text-gray-600">
                Tokenized stocks are digital tokens that represent traditional
                securities. Each token mirrors the value of the underlying stock
                and can be traded 24/7 on our platform, providing the benefits
                of blockchain technology with exposure to traditional markets.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm">
              <h3 className="text-lg font-semibold mb-2">
                What wallets are supported?
              </h3>
              <p className="text-gray-600">
                Pharos Exchange supports most major Ethereum-compatible wallets,
                including MetaMask, Coinbase Wallet, and WalletConnect-enabled
                applications. We recommend using MetaMask for the best
                experience.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm">
              <h3 className="text-lg font-semibold mb-2">
                Are my assets secure?
              </h3>
              <p className="text-gray-600">
                Yes, Pharos Exchange is built on secure, audited smart
                contracts. We implement a non-custodial model, meaning you
                always maintain control of your assets in your own wallet. We
                employ industry-standard security practices and regular audits.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm">
              <h3 className="text-lg font-semibold mb-2">
                What are the trading fees?
              </h3>
              <p className="text-gray-600">
                Pharos Exchange charges a competitive 0.2% trading fee per
                transaction. There are also small network fees (gas fees) that
                vary based on network congestion. We&apos;re committed to
                maintaining transparent and fair pricing.
              </p>
            </div>
          </div>

          <div className="mt-8 text-center">
            <Link
              href="/faq"
              className="text-indigo-600 hover:text-indigo-800 font-medium"
            >
              View All FAQs →
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}