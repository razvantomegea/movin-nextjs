import { NextRequest, NextResponse } from 'next/server';
import { createWalletClient, http, publicActions } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { base } from 'viem/chains';
import movinEarnAbi from '@/lib/abi/movin-earn-abi.json';
import { mapError } from '@/utils/errors';

export async function POST(req: NextRequest) {
  try {
    const { user, status } = await req.json();

    if (!user || typeof status !== 'boolean') {
      return NextResponse.json({ message: 'Missing user or status' }, { status: 400 });
    }

    const contractAddress = process.env.NEXT_PUBLIC_MOVIN_EARN_CONTRACT_ADDRESS;
    const ownerAddress = process.env.OWNER_ADDRESS;
    const privateKey = process.env.OWNER_PRIVATE_KEY;

    if (!privateKey || !ownerAddress || !contractAddress) {
      console.error(
        'Server configuration error: one or more environment variables are not set (OWNER_PRIVATE_KEY, OWNER_ADDRESS, NEXT_PUBLIC_MOVIN_EARN_CONTRACT_ADDRESS)',
      );
      return NextResponse.json({ message: 'Server configuration error' }, { status: 500 });
    }

    const ownerAccount = privateKeyToAccount(`0x${privateKey}`);
    if (ownerAccount.address.toLowerCase() !== ownerAddress.toLowerCase()) {
      console.error('Owner private key does not match owner address.');
      return NextResponse.json({ message: 'Server configuration error' }, { status: 500 });
    }

    const client = createWalletClient({
      account: ownerAccount,
      chain: base,
      transport: http(),
    }).extend(publicActions);

    const { request } = await client.simulateContract({
      address: contractAddress as `0x${string}`,
      abi: movinEarnAbi,
      functionName: 'setTransactionSync',
      args: [user, status],
      account: ownerAccount,
    });

    const hash = await client.writeContract(request);

    return NextResponse.json({ hash });
  } catch (error) {
    console.error(error);
    const errorMessage = mapError(error);
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}
