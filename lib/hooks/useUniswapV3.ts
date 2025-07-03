import { useState, useEffect, useCallback, useMemo } from 'react';
import { Token } from '@uniswap/sdk-core';
import { FeeAmount } from '@uniswap/v3-sdk';
import { usePublicClient } from 'wagmi';
import { getSwapQuote, SwapOptions, SwapQuote, PositionInfo } from '@/utils/uniswap/sdk';
import {
  PoolInfo,
  getPoolInfo,
  createPosition,
  MVN_TOKEN,
  USDC_TOKEN,
  UniswapSDKError,
  parseTokenAmount,
} from '@/utils/uniswap/sdk';

// Hook for fetching pool information
export function usePoolInfo(tokenA: Token, tokenB: Token, fee: FeeAmount = FeeAmount.MEDIUM) {
  const publicClient = usePublicClient();
  const [poolInfo, setPoolInfo] = useState<PoolInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPoolInfo = useCallback(async () => {
    if (!publicClient) return;

    setLoading(true);
    setError(null);

    try {
      const info = await getPoolInfo(publicClient, tokenA, tokenB, fee);
      setPoolInfo(info);
    } catch (err) {
      console.error('Error fetching pool info:', err);
      setError(err instanceof UniswapSDKError ? err.message : 'Failed to fetch pool info');
    } finally {
      setLoading(false);
    }
  }, [publicClient, fee, tokenA, tokenB]);

  useEffect(() => {
    fetchPoolInfo();
  }, [fetchPoolInfo]);

  return {
    poolInfo,
    loading,
    error,
    refetch: fetchPoolInfo,
  };
}

// Hook for getting swap quotes
export function useSwapQuote(
  inputToken: Token,
  outputToken: Token,
  inputAmount: string,
  options: SwapOptions,
) {
  const publicClient = usePublicClient();
  const [quote, setQuote] = useState<SwapQuote | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getQuote = useCallback(async () => {
    if (!publicClient || !inputAmount || parseFloat(inputAmount) <= 0) {
      setQuote(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const amountInWei = parseTokenAmount(inputAmount, inputToken.decimals);
      const quoteResult = await getSwapQuote(
        publicClient,
        inputToken,
        outputToken,
        amountInWei,
        options,
      );
      setQuote(quoteResult);
    } catch (err) {
      console.error('Error getting swap quote:', err);
      setError(err instanceof UniswapSDKError ? err.message : 'Failed to get swap quote');
      setQuote(null);
    } finally {
      setLoading(false);
    }
  }, [publicClient, inputToken, outputToken, inputAmount, options]);

  // Debounced quote fetching
  useEffect(() => {
    const timer = setTimeout(() => {
      getQuote();
    }, 500);

    return () => clearTimeout(timer);
  }, [getQuote]);

  return {
    quote,
    loading,
    error,
    refetch: getQuote,
  };
}

// Hook for MVN/USDC pool specifically
export function useMVNUSDCPool(fee: FeeAmount = FeeAmount.MEDIUM) {
  return usePoolInfo(MVN_TOKEN, USDC_TOKEN, fee);
}

// Hook for position calculations
export function usePositionCalculations(
  poolInfo: PoolInfo | null,
  amount0: string,
  amount1: string,
  tickLower?: number,
  tickUpper?: number,
) {
  const position = useMemo(() => {
    if (!poolInfo || !amount0 || !amount1) return null;

    try {
      const amountInWei0 = parseTokenAmount(amount0, poolInfo.token0.decimals);
      const amountInWei1 = parseTokenAmount(amount1, poolInfo.token1.decimals);

      return createPosition(poolInfo.pool, amountInWei0, amountInWei1, tickLower, tickUpper);
    } catch (error) {
      console.error('Error creating position:', error);
      return null;
    }
  }, [poolInfo, amount0, amount1, tickLower, tickUpper]);

  const positionInfo = useMemo((): PositionInfo | null => {
    if (!position) return null;

    return {
      position,
      liquidity: position.liquidity.toString(),
      amount0: position.amount0.quotient.toString(),
      amount1: position.amount1.quotient.toString(),
      tickLower: position.tickLower,
      tickUpper: position.tickUpper,
    };
  }, [position]);

  return {
    position,
    positionInfo,
  };
}

// Hook for pool statistics
export function usePoolStatistics(poolInfo: PoolInfo | null) {
  const [stats, setStats] = useState({
    tvl: '$0',
    volume24h: '$0',
    fees24h: '$0',
    apr: '0%',
  });

  useEffect(() => {
    if (!poolInfo) return;

    // In a real implementation, you would fetch these from:
    // - Uniswap subgraph
    // - DeFiLlama API
    // - Your own analytics service

    // For now, we'll calculate basic metrics from pool data
    const liquidity = parseFloat(poolInfo.liquidity);
    const price = poolInfo.pool.token1Price.toSignificant(6);

    // Estimate TVL (this is simplified)
    const estimatedTVL = liquidity * parseFloat(price) * 2; // Rough estimate

    setStats({
      tvl: `$${estimatedTVL.toLocaleString()}`,
      volume24h: '$8,500', // Mock data - would fetch from subgraph
      fees24h: '$85', // Mock data
      apr: '12.5%', // Mock data
    });
  }, [poolInfo]);

  return stats;
}

// Hook for token balances using Uniswap SDK tokens
export function useTokenBalance(token: Token, address?: string) {
  const publicClient = usePublicClient();
  const [balance, setBalance] = useState<string>('0');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!publicClient || !address) return;

    const fetchBalance = async () => {
      setLoading(true);
      try {
        const balance = await publicClient.getBalance({
          address: address as `0x${string}`,
        });
        setBalance(balance.toString());
      } catch (error) {
        console.error('Error fetching balance:', error);
        setBalance('0');
      } finally {
        setLoading(false);
      }
    };

    fetchBalance();
  }, [publicClient, address, token.address]);

  return {
    balance,
    loading,
    formatted: parseFloat(balance) / Math.pow(10, token.decimals),
  };
}

// Hook for calculating optimal amounts for liquidity provision
export function useOptimalAmounts(
  poolInfo: PoolInfo | null,
  inputAmount: string,
  inputToken: Token,
) {
  const [optimalAmounts, setOptimalAmounts] = useState<{
    amount0: string;
    amount1: string;
  }>({ amount0: '0', amount1: '0' });

  useEffect(() => {
    if (!poolInfo || !inputAmount || parseFloat(inputAmount) <= 0) {
      setOptimalAmounts({ amount0: '0', amount1: '0' });
      return;
    }

    try {
      const price = poolInfo.pool.token1Price;
      const isToken0Input = inputToken.address === poolInfo.token0.address;

      if (isToken0Input) {
        // Input is token0, calculate required token1
        const amount0 = inputAmount;
        const amount1 = (parseFloat(inputAmount) * parseFloat(price.toSignificant(6))).toString();
        setOptimalAmounts({ amount0, amount1 });
      } else {
        // Input is token1, calculate required token0
        const amount1 = inputAmount;
        const amount0 = (parseFloat(inputAmount) / parseFloat(price.toSignificant(6))).toString();
        setOptimalAmounts({ amount0, amount1 });
      }
    } catch (error) {
      console.error('Error calculating optimal amounts:', error);
      setOptimalAmounts({ amount0: '0', amount1: '0' });
    }
  }, [poolInfo, inputAmount, inputToken]);

  return optimalAmounts;
}
