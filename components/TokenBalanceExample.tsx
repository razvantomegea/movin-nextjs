'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ErrorAlert } from '@/components/ui/error-alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useMovinToken } from '@/lib/hooks/useMovinToken';
import { useAppDispatch } from '@/lib/redux/hooks';
import { showSuccessToast } from '@/lib/redux/slices/toastSlice';

export default function TokenBalanceExample() {
  const { address, isConnected } = useAccount();
  const {
    useTokenSymbol,
    useTokenName,
    useTokenDecimals,
    useTokenBalance,
    useTokenAllowance,
    useApproveTokens,
    useTransferTokens,
    getTokenAddress,
  } = useMovinToken();

  // Form state
  const [spenderAddress, setSpenderAddress] = useState('');
  const [approveAmount, setApproveAmount] = useState('');
  const [recipientAddress, setRecipientAddress] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [formError, setFormError] = useState('');

  // Redux dispatch
  const dispatch = useAppDispatch();

  // Contract data
  const { data: symbol } = useTokenSymbol();
  const { data: name } = useTokenName();
  const { data: decimals } = useTokenDecimals();
  const { formattedBalance, isLoading: isBalanceLoading } = useTokenBalance();
  const { formattedAllowance, isLoading: isAllowanceLoading } = useTokenAllowance(
    spenderAddress || '0x0000000000000000000000000000000000000000',
  );

  // Transaction hooks
  const {
    approveTokens,
    isPending: isApprovePending,
    isLoading: isApproveLoading,
    isSuccess: isApproveSuccess,
  } = useApproveTokens();

  const {
    transferTokens,
    isPending: isTransferPending,
    isLoading: isTransferLoading,
    isSuccess: isTransferSuccess,
  } = useTransferTokens();

  // Reset form error when inputs change
  const resetFormError = () => {
    setFormError('');
  };

  // Handle approve submission
  const handleApprove = async () => {
    resetFormError();

    if (!spenderAddress) {
      setFormError('Please enter a spender address');
      return;
    }

    if (!approveAmount || Number(approveAmount) <= 0) {
      setFormError('Please enter a valid amount');
      return;
    }

    try {
      const success = await approveTokens(spenderAddress, approveAmount);
      if (success) {
        dispatch(
          showSuccessToast({
            title: 'Approval Transaction Initiated',
            description: `Approval for ${approveAmount} ${symbol} is being processed.`,
          }),
        );
      }
    } catch (err) {
      setFormError(
        `Error initiating approval: ${err instanceof Error ? err.message : 'Unknown error'}`,
      );
    }
  };

  // Handle transfer submission
  const handleTransfer = async () => {
    resetFormError();

    if (!recipientAddress) {
      setFormError('Please enter a recipient address');
      return;
    }

    if (!transferAmount || Number(transferAmount) <= 0) {
      setFormError('Please enter a valid amount');
      return;
    }

    try {
      const success = await transferTokens(recipientAddress, transferAmount);
      if (success) {
        dispatch(
          showSuccessToast({
            title: 'Transfer Transaction Initiated',
            description: `Transfer of ${transferAmount} ${symbol} is being processed.`,
          }),
        );
      }
    } catch (err) {
      setFormError(
        `Error initiating transfer: ${err instanceof Error ? err.message : 'Unknown error'}`,
      );
    }
  };

  // Handle success effects
  if (isApproveSuccess) {
    setApproveAmount('');
  }

  if (isTransferSuccess) {
    setTransferAmount('');
    setRecipientAddress('');
  }

  if (!isConnected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Token Balance</CardTitle>
          <CardDescription>Connect your wallet to view your token balance</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      {/* Token Information Card */}
      <Card>
        <CardHeader>
          <CardTitle>Token Information</CardTitle>
          <CardDescription>View details about the MVN token</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Name</p>
              <p className="text-lg font-semibold">{name || 'Loading...'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Symbol</p>
              <p className="text-lg font-semibold">{symbol || 'Loading...'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Decimals</p>
              <p className="text-lg font-semibold">
                {decimals !== undefined ? decimals.toString() : 'Loading...'}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Contract</p>
              <p className="text-lg font-semibold truncate">{getTokenAddress()}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Balance Card */}
      <Card>
        <CardHeader>
          <CardTitle>Token Balance</CardTitle>
          <CardDescription>Your current token balance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between py-4">
            <div>
              <h3 className="text-lg font-medium">Current Balance</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Connected:{' '}
                {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Not connected'}
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold">
                {isBalanceLoading ? 'Loading...' : `${formattedBalance} ${symbol || 'MVN'}`}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Approve Card */}
      <Card>
        <CardHeader>
          <CardTitle>Approve Tokens</CardTitle>
          <CardDescription>Allow another address to spend your tokens</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="spender">Spender Address</Label>
            <Input
              id="spender"
              placeholder="0x..."
              value={spenderAddress}
              onChange={(e) => {
                setSpenderAddress(e.target.value);
                resetFormError();
              }}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="approve-amount">Amount to Approve</Label>
            <Input
              id="approve-amount"
              placeholder="0.0"
              type="number"
              value={approveAmount}
              onChange={(e) => {
                setApproveAmount(e.target.value);
                resetFormError();
              }}
            />
          </div>

          {spenderAddress && (
            <div className="pt-2">
              <p className="text-sm">
                Current Allowance:{' '}
                {isAllowanceLoading ? 'Loading...' : `${formattedAllowance()} ${symbol || 'MVN'}`}
              </p>
            </div>
          )}

          {formError && <ErrorAlert message={formError} />}
        </CardContent>
        <CardFooter>
          <Button
            onClick={handleApprove}
            disabled={!spenderAddress || !approveAmount || isApprovePending || isApproveLoading}
            className="w-full"
          >
            {isApprovePending || isApproveLoading ? 'Approving...' : 'Approve Tokens'}
          </Button>
        </CardFooter>
      </Card>

      {/* Transfer Card */}
      <Card>
        <CardHeader>
          <CardTitle>Transfer Tokens</CardTitle>
          <CardDescription>Send tokens to another address</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="recipient">Recipient Address</Label>
            <Input
              id="recipient"
              placeholder="0x..."
              value={recipientAddress}
              onChange={(e) => {
                setRecipientAddress(e.target.value);
                resetFormError();
              }}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="transfer-amount">Amount to Transfer</Label>
            <Input
              id="transfer-amount"
              placeholder="0.0"
              type="number"
              value={transferAmount}
              onChange={(e) => {
                setTransferAmount(e.target.value);
                resetFormError();
              }}
            />
          </div>

          {formError && <ErrorAlert message={formError} />}
        </CardContent>
        <CardFooter>
          <Button
            onClick={handleTransfer}
            disabled={
              !recipientAddress || !transferAmount || isTransferPending || isTransferLoading
            }
            className="w-full"
          >
            {isTransferPending || isTransferLoading ? 'Transferring...' : 'Transfer Tokens'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
