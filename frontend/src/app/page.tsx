import Link from "next/link";
import {
  ArrowTrendingUpIcon,
  ScaleIcon,
  CubeIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";
import MarketOverview from "@/components/MarketOverview";

export default function Home() {
  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="py-16 text-center">
        <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          Pharos Exchange
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
          The first decentralized exchange for tokenized stocks and commodities.
          Trade with confidence on a secure, transparent blockchain platform.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link
            href="/markets"
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
          >
            Explore Markets
          </Link>
          <Link
            href="/trade"
            className="px-6 py-3 border border-indigo-600 text-indigo-600 rounded-lg hover:bg-indigo-50 transition"
          >
            Start Trading
          </Link>
        </div>
      </section>

      {/* Market Overview */}
      <section>
        <h2 className="text-3xl font-bold mb-6 text-center">Market Overview</h2>
        <MarketOverview />
      </section>

      {/* Features */}
      <section className="py-12 bg-white rounded-xl shadow-sm">
        <h2 className="text-3xl font-bold mb-10 text-center">
          Why Choose Pharos Exchange
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 px-4">
          <div className="p-6 text-center">
            <div className="mx-auto w-12 h-12 mb-4 flex items-center justify-center rounded-full bg-indigo-100">
              <ArrowTrendingUpIcon className="h-6 w-6 text-indigo-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Tokenized Assets</h3>
            <p className="text-gray-600">
              Trade traditional stocks and commodities as blockchain tokens
            </p>
          </div>

          <div className="p-6 text-center">
            <div className="mx-auto w-12 h-12 mb-4 flex items-center justify-center rounded-full bg-indigo-100">
              <ScaleIcon className="h-6 w-6 text-indigo-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Fair & Transparent</h3>
            <p className="text-gray-600">
              All trades executed on a decentralized blockchain network
            </p>
          </div>

          <div className="p-6 text-center">
            <div className="mx-auto w-12 h-12 mb-4 flex items-center justify-center rounded-full bg-indigo-100">
              <CubeIcon className="h-6 w-6 text-indigo-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Smart Contracts</h3>
            <p className="text-gray-600">
              Secure trading powered by audited smart contracts
            </p>
          </div>

          <div className="p-6 text-center">
            <div className="mx-auto w-12 h-12 mb-4 flex items-center justify-center rounded-full bg-indigo-100">
              <ShieldCheckIcon className="h-6 w-6 text-indigo-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Self-Custody</h3>
            <p className="text-gray-600">
              Maintain control of your assets with your own wallet
            </p>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 text-center bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl text-white">
        <h2 className="text-3xl font-bold mb-4">Ready to start trading?</h2>
        <p className="text-xl mb-8 max-w-2xl mx-auto">
          Connect your wallet and join thousands of traders on the Pharos
          Exchange platform.
        </p>
        <Link
          href="/portfolio"
          className="px-6 py-3 bg-white text-indigo-600 rounded-lg hover:bg-gray-100 transition"
        >
          View Your Portfolio
        </Link>
      </section>
    </div>
  );
}
