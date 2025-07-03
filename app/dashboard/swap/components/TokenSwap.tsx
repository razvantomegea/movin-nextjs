'use client';

import { useState } from 'react';
import { useAppKitAccount } from '@reown/appkit/react';
import { ArrowUpDown, Settings, Info, AlertTriangle, Loader2 } from 'lucide-react';
import { useSendTransaction } from 'wagmi';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { useSwapQuote, useTokenBalance } from '@/lib/hooks/useUniswapV3';
import { useAppDispatch } from '@/lib/redux/hooks';
import { showErrorToast, showSuccessToast } from '@/lib/redux/slices/toastSlice';
import { MVN_TOKEN, USDC_TOKEN, formatTokenAmount, UniswapSDKError } from '@/utils/uniswap/sdk';

const TokenSwap = () => {
  const { address } = useAppKitAccount();
  const dispatch = useAppDispatch();
  const { sendTransaction } = useSendTransaction();

  // Token state
  const [fromToken, setFromToken] = useState(MVN_TOKEN);
  const [toToken, setToToken] = useState(USDC_TOKEN);
  const [fromAmount, setFromAmount] = useState('');
  const [slippage, setSlippage] = useState(1);
  const [isSwapping, setIsSwapping] = useState(false);

  // Token balances
  const mvnBalance = useTokenBalance(MVN_TOKEN, address);
  const usdcBalance = useTokenBalance(USDC_TOKEN, address);

  // Get current balances for display
  const fromTokenBalance = fromToken.address === MVN_TOKEN.address ? mvnBalance : usdcBalance;
  const toTokenBalance = toToken.address === MVN_TOKEN.address ? mvnBalance : usdcBalance;

  // Swap quote using Uniswap V3 SDK
  const {
    quote,
    loading: isLoadingQuote,
    error: quoteError,
  } = useSwapQuote(fromToken, toToken, fromAmount, {
    recipient: address || '',
    slippageTolerance: slippage,
  });

  // Calculate output amount from quote
  const toAmount = quote
    ? formatTokenAmount(quote.outputAmount.quotient.toString(), toToken.decimals, 6)
    : '';

  // Calculate price impact
  const priceImpact = quote ? parseFloat(quote.priceImpact.toFixed(2)) : 0;

  // Swap tokens
  const swapTokens = () => {
    setFromToken(toToken);
    setToToken(fromToken);
    setFromAmount('');
  };

  // Set max amount
  const setMaxAmount = () => {
    if (fromTokenBalance.balance) {
      const maxAmount = formatTokenAmount(fromTokenBalance.balance, fromToken.decimals, 6);
      setFromAmount(maxAmount);
    }
  };

  // Handle swap
  const handleSwap = async () => {
    if (!address || !fromAmount || !quote || !quote.methodParameters) return;

    try {
      setIsSwapping(true);

      await sendTransaction({
        to: quote.methodParameters.to as `0x${string}`,
        data: quote.methodParameters.calldata as `0x${string}`,
        value: BigInt(quote.methodParameters.value || '0'),
      });

      dispatch(showSuccessToast({ title: 'Swap completed successfully' }));
      setFromAmount('');
    } catch (error) {
      console.error('Swap error:', error);
      if (error instanceof UniswapSDKError) {
        dispatch(showErrorToast({ title: `Swap failed: ${error.message}` }));
      } else {
        dispatch(showErrorToast({ title: 'Swap failed. Please try again.' }));
      }
    } finally {
      setIsSwapping(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Slippage Settings */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Token Swap</h3>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-1" />
              Settings
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Swap Settings</DialogTitle>
              <DialogDescription>Configure your swap preferences</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Slippage Tolerance: {slippage}%</Label>
                <Slider
                  value={[slippage]}
                  onValueChange={(value) => setSlippage(value[0])}
                  max={5}
                  min={0.1}
                  step={0.1}
                  className="mt-2"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>0.1%</span>
                  <span>5%</span>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* From Token */}
      <Card>
        <CardContent className="p-4">
          <div className="flex justify-between items-center mb-2">
            <Label>From</Label>
            <Badge variant="secondary" className="text-xs">
              Balance: {fromTokenBalance.formatted.toFixed(4)} {fromToken.symbol}
            </Badge>
          </div>
          <div className="flex space-x-2">
            <div className="flex-1">
              <Input
                type="number"
                placeholder="0.0"
                value={fromAmount}
                onChange={(e) => setFromAmount(e.target.value)}
                className="text-lg"
              />
            </div>
            <Button variant="outline" onClick={setMaxAmount} size="sm">
              MAX
            </Button>
            <div className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-800 px-3 py-2 rounded-md">
              <span className="font-medium">{fromToken.symbol}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Swap Direction */}
      <div className="flex justify-center">
        <Button
          variant="outline"
          size="sm"
          onClick={swapTokens}
          className="rounded-full h-10 w-10 p-0"
        >
          <ArrowUpDown className="h-4 w-4" />
        </Button>
      </div>

      {/* To Token */}
      <Card>
        <CardContent className="p-4">
          <div className="flex justify-between items-center mb-2">
            <Label>To</Label>
            <Badge variant="secondary" className="text-xs">
              Balance: {toTokenBalance.formatted.toFixed(4)} {toToken.symbol}
            </Badge>
          </div>
          <div className="flex space-x-2">
            <div className="flex-1">
              <Input
                type="number"
                placeholder="0.0"
                value={toAmount}
                readOnly
                className="text-lg bg-gray-50 dark:bg-gray-900"
              />
              {isLoadingQuote && (
                <div className="flex items-center justify-center mt-2">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  <span className="text-sm text-gray-500">Getting quote...</span>
                </div>
              )}
            </div>
            <div className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-800 px-3 py-2 rounded-md">
              <span className="font-medium">{toToken.symbol}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quote Information */}
      {quote && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Price Impact</span>
              <span
                className={priceImpact > 3 ? 'text-red-500' : 'text-gray-900 dark:text-gray-100'}
              >
                {priceImpact.toFixed(2)}%
              </span>
            </div>
            <div className="flex items-center justify-between text-sm mt-1">
              <span className="text-gray-600 dark:text-gray-400">Estimated Gas</span>
              <span>{parseInt(quote.estimatedGasUsed).toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Display */}
      {quoteError && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{quoteError}</AlertDescription>
        </Alert>
      )}

      {/* Swap Button */}
      <Button
        onClick={handleSwap}
        disabled={!quote || isSwapping || !fromAmount || parseFloat(fromAmount) <= 0 || !address}
        className="w-full"
        size="lg"
      >
        {isSwapping ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            Swapping...
          </>
        ) : !address ? (
          'Connect Wallet'
        ) : (
          'Swap Tokens'
        )}
      </Button>

      {/* Warning for high slippage */}
      {priceImpact > 3 && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            High price impact detected. Consider reducing the amount or checking liquidity.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default TokenSwap;
