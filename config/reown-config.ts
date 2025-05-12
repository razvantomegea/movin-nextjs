import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';
import { base } from '@reown/appkit/networks';
import { cookieStorage, http, createStorage, fallback } from 'wagmi';

export const projectId = process.env.NEXT_PUBLIC_REOWN_PROJECT_ID;
export const infuraId = process.env.NEXT_PUBLIC_INFURA_ID;

if (!projectId) {
  throw new Error('NEXT_PUBLIC_PROJECT_ID is not defined. Please set it in .env.local');
}

export const networks = [base];

export const wagmiAdapter = new WagmiAdapter({
  storage: createStorage({
    storage: cookieStorage,
  }),
  transports: {
    [base.id]: fallback([http(`https://base-mainnet.infura.io/v3/${infuraId}`)], { rank: false }),
  },
  ssr: true,
  networks,
  projectId,
});

export const config = wagmiAdapter.wagmiConfig;
