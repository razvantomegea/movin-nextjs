import { NextApiRequest, NextApiResponse } from 'next';
import { privateKeyToAccount } from 'viem/accounts';

// EIP-712 Domain
const domain = {
  name: 'MOVINEarnV2',
  version: '2',
  chainId: 8453, // Base mainnet
  verifyingContract: '0x865E693ebd875eD997BeEc565CFfBbE687Ee5776' as `0x${string}`,
} as const;

// EIP-712 Types
const types = {
  FunctionCall: [
    { name: 'caller', type: 'address' },
    { name: 'selector', type: 'bytes4' },
    { name: 'nonce', type: 'uint256' },
    { name: 'deadline', type: 'uint256' },
  ],
} as const;

interface SignatureRequest {
  caller: string;
  selector: string;
  nonce: number;
  deadline: number;
}

interface SignatureResponse {
  signature: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SignatureResponse | { error: string }>,
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { caller, selector, nonce, deadline }: SignatureRequest = req.body;

    // Validate input
    if (!caller || !selector || nonce === undefined || !deadline) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    // Validate deadline (should be in the future but not too far)
    const currentTimestamp = Math.floor(Date.now() / 1000);
    if (deadline <= currentTimestamp) {
      return res.status(400).json({ error: 'Deadline must be in the future' });
    }

    // Check if deadline is not too far in the future (max 24 hours)
    const maxDeadline = currentTimestamp + 86400;
    if (deadline > maxDeadline) {
      return res.status(400).json({ error: 'Deadline cannot be more than 24 hours in the future' });
    }

    // Get owner private key from environment
    const ownerPrivateKey = process.env.OWNER_PRIVATE_KEY;
    if (!ownerPrivateKey || !ownerPrivateKey.startsWith('0x')) {
      console.error('OWNER_PRIVATE_KEY not found in environment variables');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    // Create account from private key
    const account = privateKeyToAccount(ownerPrivateKey as `0x${string}`);

    // Create message for signing
    const message = {
      caller: caller as `0x${string}`,
      selector: selector as `0x${string}`,
      nonce: BigInt(nonce),
      deadline: BigInt(deadline),
    };

    // Sign the message using the account's signTypedData method
    const signature = await account.signTypedData({
      domain,
      types,
      primaryType: 'FunctionCall',
      message,
    });

    return res.status(200).json({ signature });
  } catch (error) {
    console.error('Error signing function call:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
