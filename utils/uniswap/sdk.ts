import { Token, CurrencyAmount, TradeType, Percent, Currency } from '@uniswap/sdk-core';
import { AlphaRouter, SwapType } from '@uniswap/smart-order-router';
import {
  Pool,
  Position,
  NonfungiblePositionManager,
  FeeAmount,
  computePoolAddress,
  TickMath,
  nearestUsableTick,
} from '@uniswap/v3-sdk';
import { PublicClient } from 'viem';

// Base network configuration
export const BASE_CHAIN_ID = 8453;
export const UNISWAP_V3_FACTORY_ADDRESS = '0x33128a8fC17869897dcE68Ed026d694621f6FDfD';
export const NONFUNGIBLE_POSITION_MANAGER_ADDRESS = '0x03a520b32C04BF3bEEf7BF5885f4f7B2e7b54a8';
export const SWAP_ROUTER_ADDRESS = '0x2626664c2603336E57B271c5C0b26F421741e481';

// Pool ABI for fetching pool data
export const POOL_ABI = [
  'function slot0() external view returns (uint160 sqrtPriceX96, int24 tick, uint16 observationIndex, uint16 observationCardinality, uint16 observationCardinalityNext, uint8 feeProtocol, bool unlocked)',
  'function liquidity() external view returns (uint128)',
  'function ticks(int24) external view returns (uint128 liquidityGross, int128 liquidityNet, uint256 feeGrowthOutside0X128, uint256 feeGrowthOutside1X128, int56 tickCumulativeOutside, uint160 secondsPerLiquidityOutsideX128, uint32 secondsOutside, bool initialized)',
] as const;

// Token definitions for Base network
export const MVN_TOKEN = new Token(
  BASE_CHAIN_ID,
  '0x3082c5301afD22543866Fe510C0fB351E3CfF561', // MVN token address
  18,
  'MVN',
  'Movin',
);

export const USDC_TOKEN = new Token(
  BASE_CHAIN_ID,
  '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // USDC on Base
  6,
  'USDC',
  'USD Coin',
);

export const WETH_TOKEN = new Token(
  BASE_CHAIN_ID,
  '0x4200000000000000000000000000000000000006', // WETH on Base
  18,
  'WETH',
  'Wrapped Ether',
);

// Error classes
export class UniswapSDKError extends Error {
  constructor(
    public message: string,
    public cause?: Error,
  ) {
    super(message);
    this.name = 'UniswapSDKError';
  }
}

// Pool utilities
export function getPoolAddress(tokenA: Token, tokenB: Token, fee: FeeAmount): string {
  return computePoolAddress({
    factoryAddress: UNISWAP_V3_FACTORY_ADDRESS,
    tokenA,
    tokenB,
    fee,
  });
}

export interface PoolInfo {
  pool: Pool;
  poolAddress: string;
  token0: Token;
  token1: Token;
  fee: FeeAmount;
  sqrtPriceX96: string;
  tick: number;
  liquidity: string;
}

export async function getPoolInfo(
  publicClient: PublicClient,
  tokenA: Token,
  tokenB: Token,
  fee: FeeAmount = FeeAmount.MEDIUM,
): Promise<PoolInfo> {
  try {
    const poolAddress = getPoolAddress(tokenA, tokenB, fee);

    const [slot0, liquidity] = await Promise.all([
      publicClient.readContract({
        address: poolAddress as `0x${string}`,
        abi: POOL_ABI,
        functionName: 'slot0',
      }),
      publicClient.readContract({
        address: poolAddress as `0x${string}`,
        abi: POOL_ABI,
        functionName: 'liquidity',
      }) as Promise<bigint>,
    ]);

    const [token0, token1] = tokenA.sortsBefore(tokenB) ? [tokenA, tokenB] : [tokenB, tokenA];

    const pool = new Pool(
      token0,
      token1,
      fee,
      (slot0 as { sqrtPriceX96: bigint; tick: number }).sqrtPriceX96.toString(),
      (liquidity as bigint).toString(),
      (slot0 as { tick: number }).tick,
    );

    return {
      pool,
      poolAddress,
      token0,
      token1,
      fee,
      sqrtPriceX96: (slot0 as { sqrtPriceX96: bigint }).sqrtPriceX96.toString(),
      tick: (slot0 as { tick: number }).tick,
      liquidity: (liquidity as bigint).toString(),
    };
  } catch (error) {
    throw new UniswapSDKError(
      `Failed to get pool info for ${tokenA.symbol}/${tokenB.symbol}`,
      error as Error,
    );
  }
}

// Swap utilities
export interface SwapOptions {
  recipient: string;
  slippageTolerance: number; // Percentage (e.g., 1 for 1%)
  deadline?: number; // Timestamp in seconds
}

export interface SwapQuote {
  route: any;
  inputAmount: CurrencyAmount<Currency>;
  outputAmount: CurrencyAmount<Currency>;
  priceImpact: Percent;
  estimatedGasUsed: string;
  methodParameters?: {
    calldata: string;
    to: string;
    value: string;
  };
}

export async function getSwapQuote(
  publicClient: PublicClient,
  inputToken: Token,
  outputToken: Token,
  inputAmount: string,
  options: SwapOptions,
): Promise<SwapQuote> {
  try {
    const router = new AlphaRouter({
      chainId: BASE_CHAIN_ID,
      provider: publicClient as any,
    });

    const inputCurrencyAmount = CurrencyAmount.fromRawAmount(inputToken, inputAmount);

    const route = await router.route(inputCurrencyAmount, outputToken, TradeType.EXACT_INPUT, {
      recipient: options.recipient,
      slippageTolerance: new Percent(Math.floor(options.slippageTolerance * 100), 10000),
      deadline: options.deadline || Math.floor(Date.now() / 1000) + 600,
      type: SwapType.SWAP_ROUTER_02,
    });

    if (!route) {
      throw new UniswapSDKError('No route found for swap');
    }

    return {
      route: route.route,
      inputAmount: route.trade.inputAmount,
      outputAmount: route.trade.outputAmount,
      priceImpact: route.trade.priceImpact,
      estimatedGasUsed: route.estimatedGasUsed.toString(),
      methodParameters: route.methodParameters,
    };
  } catch (error) {
    throw new UniswapSDKError(
      `Failed to get swap quote for ${inputToken.symbol} -> ${outputToken.symbol}`,
      error as Error,
    );
  }
}

// Position utilities
export interface PositionInfo {
  position: Position;
  tokenId?: string;
  liquidity: string;
  amount0: string;
  amount1: string;
  fees0?: string;
  fees1?: string;
  tickLower: number;
  tickUpper: number;
}

export function createPosition(
  pool: Pool,
  amount0: string,
  amount1: string,
  tickLower?: number,
  tickUpper?: number,
): Position {
  try {
    // Use default tick range if not provided (full range)
    const lower = tickLower ?? nearestUsableTick(TickMath.MIN_TICK, pool.tickSpacing);
    const upper = tickUpper ?? nearestUsableTick(TickMath.MAX_TICK, pool.tickSpacing);

    return Position.fromAmounts({
      pool,
      tickLower: lower,
      tickUpper: upper,
      amount0,
      amount1,
      useFullPrecision: false,
    });
  } catch (error) {
    throw new UniswapSDKError('Failed to create position', error as Error);
  }
}

export interface AddLiquidityOptions {
  recipient: string;
  slippageTolerance: number;
  deadline?: number;
  createPool?: boolean;
}

export function getAddLiquidityCalldata(position: Position, options: AddLiquidityOptions) {
  try {
    return NonfungiblePositionManager.addCallParameters(position, {
      slippageTolerance: new Percent(Math.floor(options.slippageTolerance * 100), 10000),
      deadline: options.deadline || Math.floor(Date.now() / 1000) + 600,
      recipient: options.recipient,
      createPool: options.createPool || false,
    });
  } catch (error) {
    throw new UniswapSDKError('Failed to generate add liquidity calldata', error as Error);
  }
}

export interface RemoveLiquidityOptions {
  liquidityPercentage: number; // Percentage (e.g., 50 for 50%)
  slippageTolerance: number;
  deadline?: number;
  recipient: string;
  tokenId: string;
  collectOptions?: {
    expectedCurrencyOwed0: CurrencyAmount<Currency>;
    expectedCurrencyOwed1: CurrencyAmount<Currency>;
    recipient: string;
  };
}

export function getRemoveLiquidityCalldata(position: Position, options: RemoveLiquidityOptions) {
  try {
    return NonfungiblePositionManager.removeCallParameters(position, {
      tokenId: options.tokenId,
      liquidityPercentage: new Percent(options.liquidityPercentage, 100),
      slippageTolerance: new Percent(Math.floor(options.slippageTolerance * 100), 10000),
      deadline: options.deadline || Math.floor(Date.now() / 1000) + 600,
      collectOptions: options.collectOptions || {
        expectedCurrencyOwed0: CurrencyAmount.fromRawAmount(position.pool.token0, 0),
        expectedCurrencyOwed1: CurrencyAmount.fromRawAmount(position.pool.token1, 0),
        recipient: options.recipient,
      },
    });
  } catch (error) {
    throw new UniswapSDKError('Failed to generate remove liquidity calldata', error as Error);
  }
}

// Utility functions
export function formatTokenAmount(amount: string, decimals: number, precision: number = 6): string {
  const divisor = Math.pow(10, decimals);
  const value = parseFloat(amount) / divisor;
  return value.toFixed(precision);
}

export function parseTokenAmount(amount: string, decimals: number): string {
  const multiplier = Math.pow(10, decimals);
  return (parseFloat(amount) * multiplier).toFixed(0);
}

export function calculatePriceImpact(
  inputAmount: CurrencyAmount<Currency>,
  outputAmount: CurrencyAmount<Currency>,
  pool: Pool,
): number {
  try {
    // Calculate the current price
    const currentPrice = pool.token0Price;

    // Calculate the execution price
    const executionPrice = inputAmount.divide(outputAmount);

    // Calculate price impact as percentage
    const priceImpact = currentPrice.subtract(executionPrice).divide(currentPrice);
    return parseFloat(priceImpact.toSignificant(2));
  } catch (error) {
    return 0;
  }
}

export const COMMON_BASES = [WETH_TOKEN, USDC_TOKEN];
export const SUGGESTED_FEES = [FeeAmount.LOW, FeeAmount.MEDIUM, FeeAmount.HIGH];
