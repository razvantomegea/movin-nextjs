import jwt from 'jsonwebtoken';
import { NextRequest, NextResponse } from 'next/server';
import { createWalletClient, http, publicActions, parseUnits } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { base } from 'viem/chains';
import { mapError } from '@/utils/errors';

export async function POST(req: NextRequest) {
  try {
    // Extract JWT token from Authorization header to get user address
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ message: 'Authentication required' }, { status: 401 });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    let userAddress: string;
    try {
      const decodedToken = jwt.decode(token) as { sub?: string };
      if (!decodedToken?.sub) {
        return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
      }
      userAddress = decodedToken.sub;
    } catch (error) {
      return NextResponse.json({ message: 'Invalid token format' }, { status: 401 });
    }

    // Get environment variables
    const senderPrivateKey = process.env.OWNER_PRIVATE_KEY as `0x${string}`;
    const infuraId = process.env.NEXT_PUBLIC_INFURA_ID;

    if (!senderPrivateKey) {
      console.error('OWNER_PRIVATE_KEY environment variable is not set');
      return NextResponse.json({ message: 'Server configuration error' }, { status: 500 });
    }

    if (!infuraId) {
      console.error('NEXT_PUBLIC_INFURA_ID environment variable is not set');
      return NextResponse.json({ message: 'Server configuration error' }, { status: 500 });
    }

    // Create wallet client for sender
    const senderAccount = privateKeyToAccount(senderPrivateKey);
    const rpcUrl = `https://base-mainnet.infura.io/v3/${infuraId}`;

    const client = createWalletClient({
      account: senderAccount,
      chain: base,
      transport: http(rpcUrl),
    }).extend(publicActions);

    // Check recipient balance
    const recipientBalance = await client.getBalance({
      address: userAddress as `0x${string}`,
    });

    // Only send if recipient balance is 0
    if (recipientBalance > BigInt(0)) {
      return NextResponse.json(
        {
          message: 'Wallet already has ETH balance',
          balance: recipientBalance.toString(),
        },
        { status: 400 },
      );
    }

    // Check sender balance
    const senderBalance = await client.getBalance({
      address: senderAccount.address,
    });

    const amountToSend = parseUnits('0.0001', 18); // 0.0001 ETH

    if (senderBalance < amountToSend) {
      console.error('Sender wallet does not have enough ETH');
      return NextResponse.json({ message: 'Insufficient funds in sender wallet' }, { status: 500 });
    }

    // Send ETH transaction
    const hash = await client.sendTransaction({
      account: senderAccount,
      to: userAddress as `0x${string}`,
      value: amountToSend,
    });

    // Wait for transaction confirmation
    await client.waitForTransactionReceipt({ hash });

    return NextResponse.json({
      success: true,
      hash,
      message: '0.0001 ETH received for gas fees',
    });
  } catch (error) {
    console.error('Fund wallet error:', error);
    const errorMessage = mapError(error);
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}
