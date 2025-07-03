'use client';

import { useState, useEffect } from 'react';
import { useAppKitAccount } from '@reown/appkit/react';
import {
  Plus,
  Minus,
  ExternalLink,
  Info,
  Droplets,
  TrendingUp,
  DollarSign,
  Percent,
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  useMVNUSDCPool,
  usePoolStatistics,
  useTokenBalance,
  usePositionCalculations,
  useOptimalAmounts,
} from '@/lib/hooks/useUniswapV3';
import { useAppDispatch } from '@/lib/redux/hooks';
import { showErrorToast, showSuccessToast } from '@/lib/redux/slices/toastSlice';
import { MVN_TOKEN, USDC_TOKEN, formatTokenAmount } from '@/utils/uniswap/sdk';

interface LiquidityPosition {
  id: string;
  token0: {
    symbol: string;
    amount: string;
  };
  token1: {
    symbol: string;
    amount: string;
  };
  liquidity: string;
  feesEarned: string;
  priceRange: {
    min: number;
    max: number;
  };
}

const LiquidityManagement = () => {
  const { address } = useAppKitAccount();
  const dispatch = useAppDispatch();

  // Pool data
  const { poolInfo, loading: poolLoading, error: poolError } = useMVNUSDCPool();
  const poolStats = usePoolStatistics(poolInfo);

  // Token balances
  const mvnBalance = useTokenBalance(MVN_TOKEN, address);
  const usdcBalance = useTokenBalance(USDC_TOKEN, address);

  // State
  const [activeTab, setActiveTab] = useState('add');
  const [mvnAmount, setMvnAmount] = useState('');
  const [usdcAmount, setUsdcAmount] = useState('');
  const [positions, setPositions] = useState<LiquidityPosition[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // Calculate optimal amounts for liquidity provision
  const optimalAmounts = useOptimalAmounts(poolInfo, mvnAmount, MVN_TOKEN);

  // Position calculations
  const { position, positionInfo } = usePositionCalculations(poolInfo, mvnAmount, usdcAmount);

  // Mock data for demonstration - In production, fetch from Uniswap subgraph
  useEffect(() => {
    setPositions([
      {
        id: '1',
        token0: { symbol: 'MVN', amount: '1000' },
        token1: { symbol: 'USDC', amount: '500' },
        liquidity: '707.11',
        feesEarned: '12.45',
        priceRange: { min: 0.45, max: 0.55 },
      },
    ]);
  }, []);

  // Calculate estimated amounts when one is changed
  const handleMvnAmountChange = (value: string) => {
    setMvnAmount(value);
    if (optimalAmounts.amount1) {
      setUsdcAmount(formatTokenAmount(optimalAmounts.amount1, USDC_TOKEN.decimals, 6));
    }
  };

  const handleUsdcAmountChange = (value: string) => {
    setUsdcAmount(value);
    if (poolInfo) {
      const price = poolInfo.pool.token1Price;
      const estimatedMvn = parseFloat(value) / parseFloat(price.toSignificant(6));
      setMvnAmount(estimatedMvn.toString());
    }
  };

  // Add liquidity handler - simplified for demo
  const handleAddLiquidity = async () => {
    if (!address || !mvnAmount || !usdcAmount) return;

    try {
      setIsProcessing(true);

      // This is a placeholder - in production, you would:
      // 1. Approve tokens
      // 2. Call NonfungiblePositionManager.mint() with proper parameters
      console.log('Adding liquidity:', { mvnAmount, usdcAmount, address });

      // Simulate transaction
      await new Promise((resolve) => setTimeout(resolve, 2000));

      dispatch(showSuccessToast({ title: 'Success', description: 'Liquidity added successfully' }));
      setMvnAmount('');
      setUsdcAmount('');
    } catch (error) {
      console.error('Add liquidity error:', error);
      dispatch(
        showErrorToast({
          title: 'Error',
          description: 'Failed to add liquidity. Please try again.',
        }),
      );
    } finally {
      setIsProcessing(false);
    }
  };

  // Remove liquidity handler - simplified for demo
  const handleRemoveLiquidity = async (positionId: string, percentage: number) => {
    if (!address) return;

    try {
      setIsProcessing(true);

      // This is a placeholder - in production, you would:
      // 1. Call NonfungiblePositionManager.decreaseLiquidity()
      // 2. Call NonfungiblePositionManager.collect()
      console.log('Removing liquidity:', { positionId, percentage, address });

      // Simulate transaction
      await new Promise((resolve) => setTimeout(resolve, 2000));

      dispatch(
        showSuccessToast({
          title: 'Success',
          description: `${percentage}% liquidity removed successfully`,
        }),
      );
    } catch (error) {
      console.error('Remove liquidity error:', error);
      dispatch(
        showErrorToast({
          title: 'Error',
          description: 'Failed to remove liquidity. Please try again.',
        }),
      );
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Pool Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Droplets className="h-5 w-5" />
            MVN/USDC Pool Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-sm text-gray-600 dark:text-gray-400">TVL</div>
              <div className="text-lg font-semibold">{poolStats.tvl}</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-600 dark:text-gray-400">24h Volume</div>
              <div className="text-lg font-semibold">{poolStats.volume24h}</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-600 dark:text-gray-400">24h Fees</div>
              <div className="text-lg font-semibold text-green-600">{poolStats.fees24h}</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-600 dark:text-gray-400">APR</div>
              <div className="text-lg font-semibold text-blue-600">{poolStats.apr}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="add" className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Liquidity
          </TabsTrigger>
          <TabsTrigger value="remove" className="flex items-center gap-2">
            <Minus className="h-4 w-4" />
            Manage Positions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="add" className="space-y-4">
          {/* Add Liquidity Form */}
          <Card>
            <CardHeader>
              <CardTitle>Add Liquidity to MVN/USDC Pool</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* MVN Input */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <Label>MVN Amount</Label>
                  <Badge variant="secondary" className="text-xs">
                    Balance: {mvnBalance.formatted.toFixed(4)} MVN
                  </Badge>
                </div>
                <div className="flex space-x-2">
                  <Input
                    type="number"
                    placeholder="0.0"
                    value={mvnAmount}
                    onChange={(e) => handleMvnAmountChange(e.target.value)}
                    className="text-lg"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const balance = mvnBalance.formatted.toFixed(6);
                      handleMvnAmountChange(balance);
                    }}
                  >
                    MAX
                  </Button>
                </div>
              </div>

              {/* USDC Input */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <Label>USDC Amount</Label>
                  <Badge variant="secondary" className="text-xs">
                    Balance: {usdcBalance.formatted.toFixed(4)} USDC
                  </Badge>
                </div>
                <Input
                  type="number"
                  placeholder="0.0"
                  value={usdcAmount}
                  onChange={(e) => handleUsdcAmountChange(e.target.value)}
                  className="text-lg"
                />
              </div>

              {/* Pool Share Info */}
              {mvnAmount && usdcAmount && (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    You will receive approximately{' '}
                    {((parseFloat(mvnAmount) * parseFloat(usdcAmount)) ** 0.5).toFixed(4)} LP
                    tokens. This represents a small share of the pool.
                  </AlertDescription>
                </Alert>
              )}

              <Button
                onClick={handleAddLiquidity}
                disabled={
                  !mvnAmount ||
                  !usdcAmount ||
                  parseFloat(mvnAmount) <= 0 ||
                  parseFloat(usdcAmount) <= 0
                }
                className="w-full"
                size="lg"
              >
                Add Liquidity
              </Button>

              {/* Quick Actions */}
              <div className="pt-4 border-t">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Need tokens?</p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <a
                      href="https://app.uniswap.org/explore/tokens/base/0x3082c5301afD22543866Fe510C0fB351E3CfF561"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1"
                    >
                      Buy MVN <ExternalLink className="h-3 w-3" />
                    </a>
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <a
                      href="https://app.uniswap.org/explore/tokens/base/0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1"
                    >
                      Get USDC <ExternalLink className="h-3 w-3" />
                    </a>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="remove" className="space-y-4">
          {/* Existing Positions */}
          {positions.length > 0 ? (
            <div className="space-y-4">
              {positions.map((position) => (
                <Card key={position.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Position #{position.id}</span>
                      <Badge variant="outline" className="flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" />
                        In Range
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Position Details */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          Your Liquidity
                        </div>
                        <div className="text-lg font-semibold">{position.liquidity} LP</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Fees Earned</div>
                        <div className="text-lg font-semibold text-green-600">
                          ${position.feesEarned}
                        </div>
                      </div>
                    </div>

                    {/* Token Amounts */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center gap-2">
                        <div className="text-sm">
                          <div className="font-medium">
                            {position.token0.amount} {position.token0.symbol}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-sm">
                          <div className="font-medium">
                            {position.token1.amount} {position.token1.symbol}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Price Range */}
                    <div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                        Price Range
                      </div>
                      <div className="text-sm">
                        ${position.priceRange.min} - ${position.priceRange.max} USDC per MVN
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemoveLiquidity(position.id, 25)}
                      >
                        Remove 25%
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemoveLiquidity(position.id, 50)}
                      >
                        Remove 50%
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleRemoveLiquidity(position.id, 100)}
                      >
                        Remove All
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <Droplets className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Liquidity Positions</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  You don&apos;t have any active liquidity positions yet.
                </p>
                <Button onClick={() => setActiveTab('add')}>Add Your First Position</Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Benefits Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            Why Provide Liquidity?
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-3">
            <DollarSign className="h-5 w-5 text-green-500 mt-0.5" />
            <div>
              <div className="font-medium">Earn Trading Fees</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Receive a share of all trading fees (0.3%) proportional to your share of the pool
              </div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <TrendingUp className="h-5 w-5 text-blue-500 mt-0.5" />
            <div>
              <div className="font-medium">Support MVN Ecosystem</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Help provide liquidity for MVN trading and contribute to price stability
              </div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Percent className="h-5 w-5 text-purple-500 mt-0.5" />
            <div>
              <div className="font-medium">Potential Additional Rewards</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                May qualify for future liquidity mining programs and incentives
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LiquidityManagement;
