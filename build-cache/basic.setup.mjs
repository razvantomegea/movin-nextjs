import { defineWalletSetup } from '@synthetixio/synpress';
import { MetaMask } from '@synthetixio/synpress/playwright';

// Define a test seed phrase and password
export const SEED_PHRASE = 'test test test test test test test test test test test junk';
export const PASSWORD = 'Tester@1234';

// Define the basic wallet setup - minimal to avoid popup conflicts
export default defineWalletSetup(PASSWORD, async (context, walletPage) => {
  // Create a new MetaMask instance
  const metamask = new MetaMask(context, walletPage, PASSWORD);

  // Import the wallet using the seed phrase
  await metamask.importWallet(SEED_PHRASE);

  // Don't add networks during setup to avoid triggering popups
  // Networks can be added during individual tests if needed
});
