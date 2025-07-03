'use client';

import { ExternalLink, Droplets, TrendingUp, DollarSign, Users, ArrowUpDown } from 'lucide-react';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

// MVN Token details on Base network
const MVN_TOKEN = {
  chainId: 8453, // Base network
  address: '0x3082c5301afD22543866Fe510C0fB351E3CfF561',
  name: 'Movin Token',
  symbol: 'MVN',
  decimals: 18,
  logoURI: '/images/logo.png',
};

export default function SwapPage() {
  return (
    <div className="container mx-auto px-4 py-6 space-y-8 max-w-6xl">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          Swap MVN Tokens
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Trade MVN tokens instantly with the best rates on Base network using Uniswap&apos;s
          decentralized exchange.
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8 items-start">
        {/* Swap Instructions Card */}
        <div className="flex justify-center">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-2">
                <ArrowUpDown className="h-5 w-5 text-blue-500" />
                Swap MVN Tokens
              </CardTitle>
              <CardDescription>Trade MVN tokens directly on Uniswap</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-medium mb-2">How to Swap:</h4>
                  <ol className="text-sm space-y-1 list-decimal list-inside text-muted-foreground">
                    <li>Connect your wallet to Uniswap</li>
                    <li>Select MVN token from the token list</li>
                    <li>Choose your desired trading pair (USDC, ETH, etc.)</li>
                    <li>Enter the amount and confirm the swap</li>
                  </ol>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="text-center p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                    <div className="font-medium text-green-700 dark:text-green-300">Network</div>
                    <div className="text-green-600 dark:text-green-400">Base</div>
                  </div>
                  <div className="text-center p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                    <div className="font-medium text-blue-700 dark:text-blue-300">Symbol</div>
                    <div className="text-blue-600 dark:text-blue-400">MVN</div>
                  </div>
                </div>
              </div>

              <Button asChild className="w-full" size="lg">
                <a
                  href="https://app.uniswap.org/explore/tokens/base/0x3082c5301afd22543866fe510c0fb351e3cff561"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2"
                >
                  <ArrowUpDown className="h-4 w-4" />
                  Swap on Uniswap
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Information Cards */}
        <div className="space-y-6">
          {/* Why Add Liquidity Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Droplets className="h-5 w-5 text-blue-500" />
                Benefits of Adding Liquidity
              </CardTitle>
              <CardDescription>
                Earn rewards by providing liquidity to the MVN/USDC pool
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3">
                <div className="flex items-start gap-3">
                  <DollarSign className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Earn Trading Fees</p>
                    <p className="text-sm text-muted-foreground">
                      Receive a share of all trading fees (0.3%) from swaps in the pool
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <TrendingUp className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">24/7 Passive Income</p>
                    <p className="text-sm text-muted-foreground">
                      Your liquidity earns fees continuously while you hold LP tokens
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Users className="h-5 w-5 text-purple-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Support the Ecosystem</p>
                    <p className="text-sm text-muted-foreground">
                      Help provide deep liquidity for better trading experiences
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t">
                <Button asChild className="w-full">
                  <a
                    href="https://app.uniswap.org/positions/v4/base/69532"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2"
                  >
                    <Droplets className="h-4 w-4" />
                    Add Liquidity to MVN/USDC Pool
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Token Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Image src="/images/logo.png" alt="MVN" className="h-5 w-5" />
                MVN Token Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Network</p>
                  <Badge variant="secondary">Base</Badge>
                </div>
                <div>
                  <p className="text-muted-foreground">Symbol</p>
                  <p className="font-medium">MVN</p>
                </div>
                <div className="col-span-2">
                  <p className="text-muted-foreground">Contract Address</p>
                  <p className="font-mono text-xs break-all bg-muted p-2 rounded">
                    {MVN_TOKEN.address}
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t">
                <Button variant="outline" asChild className="w-full">
                  <a
                    href={`https://basescan.org/token/${MVN_TOKEN.address}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2"
                  >
                    View on BaseScan
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Important Notice */}
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800">
            <CardContent className="pt-6">
              <div className="flex gap-3">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                    <TrendingUp className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="font-medium text-blue-900 dark:text-blue-100">
                    💡 Pro Tip: Start with Liquidity
                  </p>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    Consider adding liquidity first to earn fees from other traders&apos; swaps,
                    then use your earned fees to buy more MVN tokens!
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Tutorial Section */}
      <div className="space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold">Getting Started Tutorial</h2>
          <p className="text-muted-foreground">
            New to Base network? Learn how to get USDC or ETH to start trading
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* How to Get USDC on Base */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-green-500" />
                How to Get USDC on Base
              </CardTitle>
              <CardDescription>Several ways to obtain USDC on the Base network</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="border-l-4 border-green-500 pl-4">
                  <h4 className="font-medium text-green-700 dark:text-green-300">
                    Method 1: Buy Directly
                  </h4>
                  <ol className="text-sm text-muted-foreground mt-2 space-y-1 list-decimal list-inside">
                    <li>Use Coinbase (Base&apos;s parent company)</li>
                    <li>Buy USDC and select &quot;Base&quot; network for withdrawal</li>
                    <li>Withdraw directly to your Base wallet address</li>
                  </ol>
                </div>

                <div className="border-l-4 border-blue-500 pl-4">
                  <h4 className="font-medium text-blue-700 dark:text-blue-300">
                    Method 2: Bridge from Ethereum
                  </h4>
                  <ol className="text-sm text-muted-foreground mt-2 space-y-1 list-decimal list-inside">
                    <li>Visit the official Base bridge</li>
                    <li>Connect your Ethereum wallet with USDC</li>
                    <li>Bridge USDC from Ethereum to Base network</li>
                    <li>Transaction takes ~7 days for official bridge</li>
                  </ol>
                </div>

                <div className="border-l-4 border-purple-500 pl-4">
                  <h4 className="font-medium text-purple-700 dark:text-purple-300">
                    Method 3: Fast Bridge
                  </h4>
                  <ol className="text-sm text-muted-foreground mt-2 space-y-1 list-decimal list-inside">
                    <li>Use services like Across, Hop, or Synapse</li>
                    <li>Bridge USDC from other chains (faster, small fee)</li>
                    <li>Usually completes in minutes</li>
                  </ol>
                </div>
              </div>

              <Button variant="outline" asChild className="w-full">
                <a
                  href="https://bridge.base.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2"
                >
                  Visit Base Bridge
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            </CardContent>
          </Card>

          {/* How to Get ETH on Base */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-500" />
                How to Get ETH on Base
              </CardTitle>
              <CardDescription>ETH is needed for transaction fees and trading</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="border-l-4 border-orange-500 pl-4">
                  <h4 className="font-medium text-orange-700 dark:text-orange-300">
                    Method 1: Bridge ETH
                  </h4>
                  <ol className="text-sm text-muted-foreground mt-2 space-y-1 list-decimal list-inside">
                    <li>Use the official Base bridge</li>
                    <li>Bridge ETH from Ethereum mainnet</li>
                    <li>ETH becomes the native token on Base</li>
                  </ol>
                </div>

                <div className="border-l-4 border-red-500 pl-4">
                  <h4 className="font-medium text-red-700 dark:text-red-300">
                    Method 2: Buy on Base DEX
                  </h4>
                  <ol className="text-sm text-muted-foreground mt-2 space-y-1 list-decimal list-inside">
                    <li>Get USDC on Base first (see left card)</li>
                    <li>Use Uniswap to swap USDC → ETH</li>
                    <li>Keep some ETH for transaction fees</li>
                  </ol>
                </div>

                <div className="border-l-4 border-green-500 pl-4">
                  <h4 className="font-medium text-green-700 dark:text-green-300">
                    Method 3: CEX Withdrawal
                  </h4>
                  <ol className="text-sm text-muted-foreground mt-2 space-y-1 list-decimal list-inside">
                    <li>Buy ETH on supported exchanges</li>
                    <li>Withdraw using &quot;Base&quot; network option</li>
                    <li>Check if your exchange supports Base</li>
                  </ol>
                </div>
              </div>

              <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  💡 <strong>Tip:</strong> Always keep some ETH in your wallet for transaction fees
                  (gas)
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold">Security & Safety FAQ</h2>
          <p className="text-muted-foreground">
            Your funds are safe when you follow proper security practices
          </p>
        </div>

        <div className="grid gap-6">
          {/* Security FAQ */}
          <Card>
            <CardHeader>
              <CardTitle className="text-green-600 dark:text-green-400">
                🔒 Is my money safe in a crypto wallet?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm">
                <strong>Yes, your funds are completely safe</strong> when you use a proper wallet
                and follow security best practices. Crypto wallets use advanced cryptography that
                makes it virtually impossible for anyone to access your funds without your private
                keys.
              </p>
              <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <h4 className="font-medium text-green-800 dark:text-green-200 mb-2">
                  Key Security Facts:
                </h4>
                <ul className="text-sm text-green-700 dark:text-green-300 space-y-1 list-disc list-inside">
                  <li>Your wallet uses military-grade encryption (256-bit)</li>
                  <li>Only you control your private keys (when using self-custody wallets)</li>
                  <li>Transactions are secured by the blockchain network</li>
                  <li>No central authority can freeze or confiscate your funds</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-blue-600 dark:text-blue-400">
                🔑 What are private keys and why are they important?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm">
                Private keys are like the master password to your wallet. They&apos;re a long string
                of characters that proves you own the wallet and can spend the funds in it.
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <h4 className="font-medium text-red-800 dark:text-red-200 mb-2">
                    ❌ NEVER Share These:
                  </h4>
                  <ul className="text-sm text-red-700 dark:text-red-300 space-y-1 list-disc list-inside">
                    <li>Private key</li>
                    <li>Seed phrase (12-24 words)</li>
                    <li>Wallet backup file</li>
                    <li>Recovery phrase</li>
                  </ul>
                </div>
                <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <h4 className="font-medium text-green-800 dark:text-green-200 mb-2">
                    ✅ Safe to Share:
                  </h4>
                  <ul className="text-sm text-green-700 dark:text-green-300 space-y-1 list-disc list-inside">
                    <li>Wallet address (for receiving funds)</li>
                    <li>Transaction hashes</li>
                    <li>Public keys</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-purple-600 dark:text-purple-400">
                🛡️ How can someone steal my crypto?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm">
                <strong>The only ways someone can steal your crypto:</strong>
              </p>
              <div className="space-y-3">
                <div className="border-l-4 border-red-500 pl-4">
                  <h4 className="font-medium text-red-700 dark:text-red-300">
                    1. If you give them your private keys
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Never share your seed phrase, private key, or wallet file with anyone
                  </p>
                </div>
                <div className="border-l-4 border-orange-500 pl-4">
                  <h4 className="font-medium text-orange-700 dark:text-orange-300">
                    2. If you connect to malicious websites
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Always verify URLs and only use official websites
                  </p>
                </div>
                <div className="border-l-4 border-yellow-500 pl-4">
                  <h4 className="font-medium text-yellow-700 dark:text-yellow-300">
                    3. If your device is compromised
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Keep your computer/phone secure with antivirus and updates
                  </p>
                </div>
              </div>
              <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>Bottom line:</strong> Keep your private keys secret and you&apos;re
                  completely safe!
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-indigo-600 dark:text-indigo-400">
                🏦 Should I use a hardware wallet?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm">
                Hardware wallets provide the highest level of security by keeping your private keys
                offline:
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">✅ Benefits:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                    <li>Private keys never touch the internet</li>
                    <li>Protected against malware</li>
                    <li>Best for large amounts</li>
                    <li>Most secure option available</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium mb-2">⚠️ Considerations:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                    <li>Costs $50-150</li>
                    <li>Less convenient for frequent trading</li>
                    <li>Need to carry physical device</li>
                    <li>Learning curve for setup</li>
                  </ul>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                <strong>Recommendation:</strong> Use software wallets (MetaMask, Coinbase Wallet)
                for amounts you&apos;re comfortable with, and hardware wallets for larger holdings.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-emerald-600 dark:text-emerald-400">
                ✅ Best Security Practices
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-3">🔐 Wallet Security:</h4>
                  <ul className="text-sm space-y-2 list-disc list-inside text-muted-foreground">
                    <li>Write down your seed phrase on paper</li>
                    <li>Store it in a safe place (not on your computer)</li>
                    <li>Never take photos of your seed phrase</li>
                    <li>Use strong, unique passwords</li>
                    <li>Enable 2FA where possible</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium mb-3">🌐 Browser Security:</h4>
                  <ul className="text-sm space-y-2 list-disc list-inside text-muted-foreground">
                    <li>Always check website URLs carefully</li>
                    <li>Bookmark official sites (like Uniswap.org)</li>
                    <li>Never click suspicious links</li>
                    <li>Disconnect wallet when not trading</li>
                    <li>Use a dedicated browser for crypto</li>
                  </ul>
                </div>
              </div>
              <div className="mt-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border border-green-200 dark:border-green-800 rounded-lg">
                <p className="text-sm font-medium text-green-800 dark:text-green-200">
                  🎯 <strong>Remember:</strong> Following these simple rules makes your crypto safer
                  than money in a traditional bank account!
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
