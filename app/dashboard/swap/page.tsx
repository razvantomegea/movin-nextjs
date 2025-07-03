'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Coins, Droplets } from 'lucide-react';
import TokenSwap from './components/TokenSwap';
import LiquidityManagement from './components/LiquidityManagement';

export default function SwapPage() {
  const [activeTab, setActiveTab] = useState('swap');

  return (
    <div className="container mx-auto px-4 py-6 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-center mb-2">MVN Token Hub</h1>
        <p className="text-gray-600 dark:text-gray-400 text-center">
          Swap tokens and manage liquidity on Base network
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="swap" className="flex items-center gap-2">
            <Coins className="h-4 w-4" />
            Token Swap
          </TabsTrigger>
          <TabsTrigger value="liquidity" className="flex items-center gap-2">
            <Droplets className="h-4 w-4" />
            Liquidity
          </TabsTrigger>
        </TabsList>

        <TabsContent value="swap" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Coins className="h-5 w-5" />
                Swap Tokens
              </CardTitle>
            </CardHeader>
            <CardContent>
              <TokenSwap />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="liquidity" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Droplets className="h-5 w-5" />
                Manage Liquidity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <LiquidityManagement />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
