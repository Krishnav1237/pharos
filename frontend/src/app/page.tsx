import Link from "next/link";
import {
  TrendingUp,
  Scale,
  Box, // Changed from Cube to Box
  ShieldCheck,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import MarketOverview from "@/components/MarketOverview";
import { cn } from "@/lib/utils";

const features = [
  {
    icon: TrendingUp,
    title: "Tokenized Assets",
    description:
      "Trade traditional stocks and commodities as blockchain tokens with 24/7 market access",
  },
  {
    icon: Scale,
    title: "Fair & Transparent",
    description:
      "All trades executed on a decentralized blockchain network with verifiable transactions",
  },
  {
    icon: Box, // Changed from Cube to Box
    title: "Smart Contracts",
    description:
      "Secure trading powered by audited smart contracts with built-in risk management",
  },
  {
    icon: ShieldCheck,
    title: "Self-Custody",
    description:
      "Maintain full control of your assets with your own wallet, no custodial risks",
  },
];

const stats = [
  {
    title: "Total Trading Volume",
    value: "$12.5M",
    change: "+12.3% from last week",
    changePositive: true,
  },
  {
    title: "Active Traders",
    value: "5,234",
    change: "+8.7% from last week",
    changePositive: true,
  },
  {
    title: "Available Assets",
    value: "25+",
    change: "Stocks & Commodities",
    changePositive: null,
  },
];

const steps = [
  {
    number: "1",
    title: "Connect Your Wallet",
    description:
      "Link your Web3 wallet like MetaMask or WalletConnect to access the platform",
    link: "#",
    linkText: "Learn More",
  },
  {
    number: "2",
    title: "Select Your Assets",
    description:
      "Browse and select from a wide range of tokenized stocks and commodities",
    link: "/markets",
    linkText: "View Markets",
  },
  {
    number: "3",
    title: "Trade Instantly",
    description:
      "Place buy or sell orders with competitive pricing and low transaction fees",
    link: "/trade",
    linkText: "Start Trading",
  },
];

export default function Home() {
  return (
    <div className="space-y-16 py-8">
      {/* Hero Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-card rounded-xl shadow-sm">
        <div className="absolute inset-0 bg-primary/5 z-0"></div>
        <div className="absolute -top-4 left-20 w-48 h-48 bg-primary/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-8 right-16 w-64 h-64 bg-accent/10 rounded-full blur-3xl"></div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="text-left">
              <h1 className="text-5xl font-bold mb-6 text-gradient-brand">
                Pharos Exchange
              </h1>
              <p className="text-xl text-muted-foreground mb-8 max-w-xl">
                The first decentralized exchange for tokenized stocks and
                commodities. Trade with confidence on a secure, transparent
                blockchain platform.
              </p>
              <div className="flex flex-wrap gap-4">
                <Button asChild size="lg" className="shadow-md">
                  <Link href="/markets">
                    Explore Markets
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link href="/trade">Start Trading</Link>
                </Button>
              </div>
            </div>
            <div className="hidden lg:block">
              <div className="relative h-96 w-full">
                <div className="absolute -top-4 left-20 w-48 h-48 bg-accent/10 rounded-full blur-3xl"></div>
                <div className="absolute -bottom-8 right-16 w-64 h-64 bg-primary/10 rounded-full blur-3xl"></div>
                <div className="relative z-10 p-6">
                  <div className="bg-card/80 backdrop-blur-lg rounded-xl shadow-xl p-6 mb-6 transform rotate-3 border">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <div className="h-8 w-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">
                          T
                        </div>
                        <span className="ml-2 font-semibold">TSLA</span>
                      </div>
                      <span className="text-change-positive font-semibold">
                        +4.35%
                      </span>
                    </div>
                    <div className="h-24 bg-secondary rounded-lg mb-2"></div>
                    <div className="text-right font-bold text-xl">$174.50</div>
                  </div>

                  <div className="bg-card/80 backdrop-blur-lg rounded-xl shadow-xl p-6 ml-12 transform -rotate-2 border">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <div className="h-8 w-8 bg-amber-600 rounded-full flex items-center justify-center text-white font-bold text-xs">
                          G
                        </div>
                        <span className="ml-2 font-semibold">GOLD</span>
                      </div>
                      <span className="text-change-positive font-semibold">
                        +0.68%
                      </span>
                    </div>
                    <div className="h-24 bg-amber-50 rounded-lg mb-2"></div>
                    <div className="text-right font-bold text-xl">
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
          {stats.map((stat, index) => (
            <Card key={index} className="stats-card">
              <CardContent className="pt-6">
                <h3 className="text-lg font-semibold text-muted-foreground mb-2">
                  {stat.title}
                </h3>
                <p className="text-3xl font-bold">{stat.value}</p>
                {stat.changePositive !== null && (
                  <p
                    className={cn(
                      "text-sm mt-1",
                      stat.changePositive
                        ? "text-change-positive"
                        : "text-change-negative"
                    )}
                  >
                    {stat.change}
                  </p>
                )}
                {stat.changePositive === null && (
                  <p className="text-sm text-primary mt-1">{stat.change}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Market Overview */}
      <section>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Market Overview</h2>
          <Button asChild variant="ghost" className="gap-1">
            <Link href="/markets">
              View All Markets
              <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>
        <MarketOverview />
      </section>

      {/* Features */}
      <section className="py-12 bg-card rounded-xl shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold mb-10 text-center">
            Why Choose Pharos Exchange
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 px-4">
            {features.map((feature, index) => (
              <div
                key={index}
                className="p-6 text-center transition-all hover:transform hover:-translate-y-1"
              >
                <div className="mx-auto w-12 h-12 mb-4 flex items-center justify-center rounded-full bg-primary/10">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-12 bg-secondary rounded-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold mb-12 text-center">
            How Pharos Exchange Works
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <Card key={index} className="relative">
                <div className="absolute -top-6 left-8 w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold shadow-md">
                  {step.number}
                </div>
                <CardHeader className="pt-8 mt-4">
                  <CardTitle>{step.title}</CardTitle>
                  <CardDescription>{step.description}</CardDescription>
                </CardHeader>
                <CardFooter>
                  <Button asChild variant="link" className="pl-0">
                    <Link href={step.link}>{step.linkText} →</Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 text-center bg-gradient-brand rounded-xl text-white shadow-md">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl font-bold mb-4">Ready to start trading?</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Connect your wallet and join thousands of traders on the Pharos
            Exchange platform. Trade with confidence and security.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-white bg-white/10 hover:bg-white/20 text-white"
            >
              <Link href="/portfolio">View Your Portfolio</Link>
            </Button>
            <Button
              asChild
              size="lg"
              className="bg-white text-primary hover:bg-white/90"
            >
              <Link href="/markets">Explore Markets</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-12 bg-card rounded-xl shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold mb-10 text-center">
            What Our Traders Say
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="bg-secondary">
              <CardContent className="pt-6">
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold">
                    A
                  </div>
                  <div className="ml-3">
                    <h4 className="font-semibold">Alex Thompson</h4>
                    <div className="text-amber-500 flex">★★★★★</div>
                  </div>
                </div>
                <p className="text-muted-foreground">
                  "Pharos Exchange made it incredibly easy to diversify my
                  portfolio with tokenized assets. The interface is intuitive
                  and the transaction fees are reasonable."
                </p>
              </CardContent>
            </Card>

            <Card className="bg-secondary">
              <CardContent className="pt-6">
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold">
                    M
                  </div>
                  <div className="ml-3">
                    <h4 className="font-semibold">Maria Rodriguez</h4>
                    <div className="text-amber-500 flex">★★★★★</div>
                  </div>
                </div>
                <p className="text-muted-foreground">
                  "I've been using Pharos for 6 months and I'm impressed with
                  the security features. Being able to trade traditional assets
                  on a blockchain is revolutionary."
                </p>
              </CardContent>
            </Card>

            <Card className="bg-secondary">
              <CardContent className="pt-6">
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold">
                    J
                  </div>
                  <div className="ml-3">
                    <h4 className="font-semibold">James Wilson</h4>
                    <div className="text-amber-500 flex">
                      ★★★★<span className="text-gray-300">★</span>
                    </div>
                  </div>
                </div>
                <p className="text-muted-foreground">
                  "The 24/7 trading capability is a game-changer. No more
                  waiting for traditional markets to open. Customer support is
                  responsive when I needed help."
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-12 bg-secondary rounded-xl">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-3xl font-bold mb-10 text-center">
            Frequently Asked Questions
          </h2>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  How do tokenized stocks work?
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Tokenized stocks are digital tokens that represent traditional
                  securities. Each token mirrors the value of the underlying
                  stock and can be traded 24/7 on our platform, providing the
                  benefits of blockchain technology with exposure to traditional
                  markets.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  What wallets are supported?
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Pharos Exchange supports most major Ethereum-compatible
                  wallets, including MetaMask, Coinbase Wallet, and
                  WalletConnect-enabled applications. We recommend using
                  MetaMask for the best experience.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Are my assets secure?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Yes, Pharos Exchange is built on secure, audited smart
                  contracts. We implement a non-custodial model, meaning you
                  always maintain control of your assets in your own wallet. We
                  employ industry-standard security practices and regular
                  audits.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  What are the trading fees?
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Pharos Exchange charges a competitive 0.2% trading fee per
                  transaction. There are also small network fees (gas fees) that
                  vary based on network congestion. We're committed to
                  maintaining transparent and fair pricing.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
