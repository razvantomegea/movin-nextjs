import { useAppKitAccount } from '@reown/appkit/react';
import { formatUnits, parseUnits } from 'viem';
import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { useFunding } from '@/app/contexts/funding-provider';
import movinTokenAbi from '@/lib/abi/movin-token-abi.json';
import { useAppDispatch } from '@/lib/redux/hooks';
import { showErrorToast } from '@/lib/redux/slices/toastSlice';
import { forceLogout, isWalletConnected } from '@/utils/auth';
import { formatBalanceWithSuffix } from '@/utils/crypto';
import { mapError } from '@/utils/errors';

// MovinToken contract address (Base network)
const TOKEN_ADDRESS = '0x3082c5301afD22543866Fe510C0fB351E3CfF561';

/**
 * Hook for interacting with the MovinToken contract
 * Provides methods for reading and writing to the contract
 */
export function useMovinToken() {
  const dispatch = useAppDispatch();
  const { address, isConnected } = useAppKitAccount();
  const addressLower = address?.toLowerCase();
  const { checkAndFundWallet } = useFunding();

  /**
   * Returns the token address
   * @returns The token address
   */
  const getTokenAddress = (): string => {
    return TOKEN_ADDRESS;
  };

  /**
   * Checks if wallet is connected and forces logout if not
   * @returns boolean indicating if wallet is connected
   */
  const checkWalletConnection = (): boolean => {
    if (!isWalletConnected(address, isConnected)) {
      console.warn('Wallet disconnected during transaction attempt, forcing logout');
      forceLogout();
      return false;
    }
    return true;
  };

  /**
   * Checks wallet connection and funds wallet if balance is 0
   * @returns boolean indicating if wallet is ready for transactions
   */
  const checkWalletAndFund = async (): Promise<boolean> => {
    if (!checkWalletConnection()) {
      return false;
    }

    // Check and fund wallet if needed
    const funded = await checkAndFundWallet();
    return funded;
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
    const { writeContract, data: hash, error: writeError, isPending } = useWriteContract();
    const { isLoading, isSuccess, error: waitError } = useWaitForTransactionReceipt({ hash });

    /**
     * Approves tokens for a spender
     * @param spender The spender address
     * @param amount The amount to approve in ether
     * @returns A promise resolved when the transaction is initiated
     */
    const approveTokens = async (spender: string, amount: string): Promise<boolean> => {
      try {
        // Check wallet connection and fund if needed
        const ready = await checkWalletAndFund();
        if (!ready) {
          return false;
        }

        if (!decimalsResult.data) {
          throw new Error('Token decimals not loaded');
        }

        const decimals = decimalsResult.data;
        const amountWei = parseUnits(amount, decimals);

        await writeContract({
          address: TOKEN_ADDRESS,
          abi: movinTokenAbi,
          functionName: 'approve',
          args: [spender, amountWei],
        });

        return true;
      } catch (err) {
        const errorMessage = mapError(err);
        dispatch(
          showErrorToast({
            title: 'Error Approving Tokens',
            description: errorMessage,
          }),
        );
        return false;
      }
    };

    return {
      approveTokens,
      hash,
      error: writeError || waitError,
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
    const { writeContract, data: hash, error: writeError, isPending } = useWriteContract();
    const { isLoading, isSuccess, error: waitError } = useWaitForTransactionReceipt({ hash });

    /**
     * Transfers tokens to a recipient
     * @param recipient The recipient address
     * @param amount The amount to transfer in ether
     * @returns A promise resolved when the transaction is initiated
     */
    const transferTokens = async (recipient: string, amount: string): Promise<boolean> => {
      try {
        // Check wallet connection and fund if needed
        const ready = await checkWalletAndFund();
        if (!ready) {
          return false;
        }

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
        const errorMessage = mapError(err);
        dispatch(
          showErrorToast({
            title: 'Error Transferring Tokens',
            description: errorMessage,
          }),
        );
        return false;
      }
    };

    return {
      transferTokens,
      hash,
      error: writeError || waitError,
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
