import { NextRequest, NextResponse } from 'next/server';
import { createWalletClient, http, publicActions } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { base } from 'viem/chains';
import movinEarnAbi from '@/lib/abi/movin-earn-abi.json';
import { mapError } from '@/utils/errors';

export async function POST(req: NextRequest) {
  try {
    const { user, score } = await req.json();

    if (!user || typeof score !== 'number') {
      return NextResponse.json({ message: 'Missing user or score' }, { status: 400 });
    }

    const contractAddress = process.env.NEXT_PUBLIC_MOVIN_EARN_CONTRACT_ADDRESS as `0x${string}`;
    const ownerAddress = process.env.OWNER_ADDRESS as `0x${string}`;
    const privateKey = process.env.OWNER_PRIVATE_KEY as `0x${string}`;

    if (!privateKey || !ownerAddress || !contractAddress) {
      console.error(
        'Server configuration error: one or more environment variables are not set (OWNER_PRIVATE_KEY, OWNER_ADDRESS, NEXT_PUBLIC_MOVIN_EARN_CONTRACT_ADDRESS)',
      );
      return NextResponse.json({ message: 'Server configuration error' }, { status: 500 });
    }

    const ownerAccount = privateKeyToAccount(privateKey);
    if (ownerAccount.address.toLowerCase() !== ownerAddress.toLowerCase()) {
      console.error('Owner private key does not match owner address.');
      return NextResponse.json({ message: 'Server configuration error' }, { status: 500 });
    }

    const infuraId = process.env.NEXT_PUBLIC_INFURA_ID;

    if (!infuraId) {
      console.error('Infura ID is not set.');
      return NextResponse.json({ message: 'Server configuration error' }, { status: 500 });
    }

    const rpcUrl = `https://base-mainnet.infura.io/v3/${infuraId}`;

    const client = createWalletClient({
      account: ownerAccount,
      chain: base,
      transport: http(rpcUrl),
    }).extend(publicActions);

    const { request } = await client.simulateContract({
      address: contractAddress,
      abi: movinEarnAbi,
      functionName: 'claimMealRewards',
      args: [user, score],
      account: ownerAccount,
    });

    const hash = await client.writeContract(request);
    await client.waitForTransactionReceipt({ hash });

    return NextResponse.json({ hash });
  } catch (error) {
    console.error('Transaction error:', error);
    if (error instanceof Error) {
      console.error('Contract call error:', error.cause);
    }
    const errorMessage = mapError(error);
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}
