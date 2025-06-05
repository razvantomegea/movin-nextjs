import { base } from '@reown/appkit/networks';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';
import { cookieStorage, http, createStorage, fallback } from 'wagmi';

export const projectId = process.env.NEXT_PUBLIC_REOWN_PROJECT_ID;
export const infuraId = process.env.NEXT_PUBLIC_INFURA_ID;

if (!projectId) {
  throw new Error('NEXT_PUBLIC_REOWN_PROJECT_ID is not defined. Please set it in .env.local');
}

if (!infuraId) {
  console.warn('NEXT_PUBLIC_INFURA_ID is not defined. Using public RPC endpoint as fallback.');
}

export const networks = [base];

export const wagmiAdapter = new WagmiAdapter({
  storage: createStorage({
    storage: cookieStorage,
  }),
  transports: {
    [base.id]: infuraId
      ? fallback(
          [http(`https://base-mainnet.infura.io/v3/${infuraId}`), http('https://mainnet.base.org')],
          { rank: false },
        )
      : http('https://mainnet.base.org'),
  },
  ssr: true,
  networks,
  projectId,
});

export const config = wagmiAdapter.wagmiConfig;
