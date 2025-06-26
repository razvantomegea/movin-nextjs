import { defineWalletSetup } from '@synthetixio/synpress';
import { MetaMask } from '@synthetixio/synpress/playwright';

// Define a test seed phrase and password
export const SEED_PHRASE = 'test test test test test test test test test test test junk';
export const PASSWORD = 'Tester@1234';

// Base network configuration (matches the app's default network)
const BASE_NETWORK = {
  networkName: 'Base Mainnet',
  rpcUrl: 'https://mainnet.base.org',
  chainId: '8453',
  symbol: 'ETH',
  blockExplorer: 'https://basescan.org',
  isTestnet: false,
};

// Define the basic wallet setup with Base network pre-configured
export default defineWalletSetup(PASSWORD, async (context, walletPage) => {
  // Create a new MetaMask instance
  const metamask = new MetaMask(context, walletPage, PASSWORD);

  // Import the wallet using the seed phrase
  await metamask.importWallet(SEED_PHRASE);

  // Add Base network to match app's default network
  try {
    await metamask.addNetwork(BASE_NETWORK);
    console.log('Base network added successfully');

    // Switch to Base network
    await metamask.changeNetwork('Base Mainnet');
    console.log('Switched to Base network');
  } catch (error) {
    console.log('Network setup error (continuing anyway):', error.message);
    // Continue even if network setup fails - will be handled in tests
  }
});
