import { useEffect } from 'react';
import { useAppKitAccount } from '@reown/appkit/react';
import { formatUnits, parseUnits } from 'viem';
import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import movinTokenAbi from '@/lib/abi/movin-token-abi.json';
import { useAppDispatch } from '@/lib/redux/hooks';
import { showErrorToast } from '@/lib/redux/slices/toastSlice';
import { formatBalanceWithSuffix } from '@/utils/crypto';
import { parseError } from '@/utils/errors';

// MovinToken contract address (Base network)
const TOKEN_ADDRESS = '0x3082c5301afD22543866Fe510C0fB351E3CfF561';

/**
 * Hook for interacting with the MovinToken contract
 * Provides methods for reading and writing to the contract
 */
export function useMovinToken() {
  const dispatch = useAppDispatch();
  const { address } = useAppKitAccount();
  const addressLower = address?.toLowerCase();

  /**
   * Returns the token address
   * @returns The token address
   */
  const getTokenAddress = (): string => {
    return TOKEN_ADDRESS;
  };

  /**
   * Gets token decimals
   * @returns Number of decimals for the token
   */
  const useTokenDecimals = () => {
    return {
      data: 18,
      isLoading: false,
      error: { message: '' },
    };

    // return useReadContract({
    //   address: TOKEN_ADDRESS,
    //   abi: movinTokenAbi,
    //   functionName: 'decimals',
    // }) as { data: number | undefined; isLoading: boolean; error: Error | null };
  };

  /**
   * Gets token name
   * @returns Token name
   */
  const useTokenName = () => {
    return {
      data: 'Movin',
      isLoading: false,
      error: { message: '' },
    };

    // return useReadContract({
    //   address: TOKEN_ADDRESS,
    //   abi: movinTokenAbi,
    //   functionName: 'name',
    // }) as { data: string | undefined; isLoading: boolean; error: Error | null };
  };

  /**
   * Gets token symbol
   * @returns Token symbol
   */
  const useTokenSymbol = () => {
    return {
      data: 'MVN',
      isLoading: false,
      error: { message: '' },
    };

    // return useReadContract({
    //   address: TOKEN_ADDRESS,
    //   abi: movinTokenAbi,
    //   functionName: 'symbol',
    // }) as { data: string | undefined; isLoading: boolean; error: Error | null };
  };

  /**
   * Gets the total supply of the token
   * @returns Total supply in wei
   */
  const useTokenTotalSupply = () => {
    const result = useReadContract({
      address: TOKEN_ADDRESS,
      abi: movinTokenAbi,
      functionName: 'totalSupply',
    });

    const formattedTotalSupply = (): string => {
      if (result.data) {
        return formatUnits(result.data as bigint, 18);
      }
      return '0';
    };

    return {
      ...result,
      formattedTotalSupply,
    };
  };

  /**
   * Gets the balance of the current user's wallet
   * @returns Balance in wei
   */
  const useTokenBalance = () => {
    const result = useReadContract({
      address: TOKEN_ADDRESS,
      abi: movinTokenAbi,
      functionName: 'balanceOf',
      args: addressLower ? [addressLower] : undefined,
      query: {
        enabled: !!addressLower,
      },
    });

    const symbolResult = useTokenSymbol();
    const decimalsResult = useTokenDecimals();

    const formattedBalance = result.data
      ? formatUnits(result.data as bigint, decimalsResult.data || 18)
      : '0';

    const formattedBalanceWithSuffix = `${formatBalanceWithSuffix(formattedBalance)} ${
      symbolResult.data
    }`;

    return {
      ...result,
      formattedBalance,
      formattedBalanceWithSuffix,
    };
  };

  /**
   * Gets the allowance of the token for a spender
   * @param spender The spender address
   * @param owner The owner address
   * @returns Allowance in wei
   */
  const useTokenAllowance = (spender: string, owner?: string) => {
    const ownerAddress = owner || addressLower;

    const result = useReadContract({
      address: TOKEN_ADDRESS,
      abi: movinTokenAbi,
      functionName: 'allowance',
      args: ownerAddress && spender ? [ownerAddress, spender] : undefined,
      query: {
        enabled: !!ownerAddress && !!spender,
      },
    });

    const formattedAllowance = (): string => {
      if (result.data) {
        return formatUnits(result.data as bigint, 18);
      }
      return '0';
    };

    return {
      ...result,
      formattedAllowance,
    };
  };

  /**
   * Hook to approve tokens for a spender
   * @returns Hook result with approve function
   */
  const useApproveTokens = () => {
    const decimalsResult = useTokenDecimals();
    const { writeContract, data: hash, error, isPending } = useWriteContract();
    const { isLoading, isSuccess } = useWaitForTransactionReceipt({ hash });

    // Handle user rejection in the wallet
    useEffect(() => {
      if (error) {
        const parsedError = parseError(error);
        dispatch(
          showErrorToast({
            title: 'Transaction Rejected',
            description: parsedError.message,
          }),
        );
      }
    }, [error]);

    /**
     * Approves tokens for a spender
     * @param spender The spender address
     * @param amount The amount to approve in ether
     * @returns A promise resolved when the transaction is initiated
     */
    const approveTokens = async (spender: string, amount: string): Promise<boolean> => {
      try {
        if (!decimalsResult.data) {
          throw new Error('Token decimals not loaded');
        }

        const decimals = decimalsResult.data;
        const amountWei = parseUnits(amount, decimals);

        writeContract({
          address: TOKEN_ADDRESS,
          abi: movinTokenAbi,
          functionName: 'approve',
          args: [spender, amountWei],
        });

        return true;
      } catch (err) {
        const parsedError = parseError(err);
        dispatch(
          showErrorToast({
            title: 'Error Approving Tokens',
            description: parsedError.message,
          }),
        );
        return false;
      }
    };

    return {
      approveTokens,
      hash,
      error,
      isPending,
      isLoading,
      isSuccess,
    };
  };

  /**
   * Hook to transfer tokens to a recipient
   * @returns Hook result with transfer function
   */
  const useTransferTokens = () => {
    const decimalsResult = useTokenDecimals();
    const { writeContract, data: hash, error, isPending } = useWriteContract();
    const { isLoading, isSuccess } = useWaitForTransactionReceipt({ hash });

    // Handle user rejection in the wallet
    useEffect(() => {
      if (error) {
        const parsedError = parseError(error);
        dispatch(
          showErrorToast({
            title: 'Transaction Rejected',
            description: parsedError.message,
          }),
        );
      }
    }, [error]);

    /**
     * Transfers tokens to a recipient
     * @param recipient The recipient address
     * @param amount The amount to transfer in ether
     * @returns A promise resolved when the transaction is initiated
     */
    const transferTokens = async (recipient: string, amount: string): Promise<boolean> => {
      try {
        if (!decimalsResult.data) {
          throw new Error('Token decimals not loaded');
        }

        const decimals = decimalsResult.data;
        const amountWei = parseUnits(amount, decimals);

        writeContract({
          address: TOKEN_ADDRESS,
          abi: movinTokenAbi,
          functionName: 'transfer',
          args: [recipient, amountWei],
        });

        return true;
      } catch (err) {
        const parsedError = parseError(err);
        dispatch(
          showErrorToast({
            title: 'Error Transferring Tokens',
            description: parsedError.message,
          }),
        );
        return false;
      }
    };

    return {
      transferTokens,
      hash,
      error,
      isPending,
      isLoading,
      isSuccess,
    };
  };

  /**
   * Hook to check if the contract is paused
   * @returns Hook result with pause state
   */
  const useIsPaused = () => {
    return useReadContract({
      address: TOKEN_ADDRESS,
      abi: movinTokenAbi,
      functionName: 'paused',
    });
  };

  return {
    getTokenAddress,
    useTokenDecimals,
    useTokenName,
    useTokenSymbol,
    useTokenBalance,
    useTokenTotalSupply,
    useTokenAllowance,
    useApproveTokens,
    useTransferTokens,
    useIsPaused,
  };
}
