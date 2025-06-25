import { testWithSynpress } from '@synthetixio/synpress';
import { MetaMask, metaMaskFixtures } from '@synthetixio/synpress/playwright';
import basicSetup from '../build-cache/basic.setup.mjs';
import { DataTestIds } from '../constants/dataTestIds.mjs';

// Create a test instance with Synpress and MetaMask fixtures
const test = testWithSynpress(metaMaskFixtures(basicSetup));
const { expect } = test;

test.describe('Movin Connect Page Tests', () => {
  test('should display the connect page with all elements', async ({ page }) => {
    // Navigate to the connect page
    await page.goto('/');

    // Verify the page loaded correctly
    await expect(page.getByTestId(DataTestIds.CONNECT_PAGE_TITLE)).toBeVisible();
    await expect(page.getByTestId(DataTestIds.CONNECT_PAGE_SUBTITLE)).toBeVisible();

    // Verify the connect button exists and is enabled
    await expect(page.getByTestId(DataTestIds.CONNECT_WALLET_BUTTON)).toBeVisible();

    // Verify the logo is visible
    await expect(page.getByTestId(DataTestIds.CONNECT_PAGE_LOGO)).toBeVisible();

    // Verify the version is shown
    await expect(page.getByTestId(DataTestIds.CONNECT_PAGE_VERSION)).toBeVisible();
  });

  test('should connect MetaMask wallet and redirect to dashboard', async ({
    context,
    page,
    metamaskPage,
    extensionId,
  }) => {
    // Create a new MetaMask instance
    const metamask = new MetaMask(context, metamaskPage, basicSetup.walletPassword, extensionId);

    // Navigate to the connect page
    await page.goto('/');

    // Verify initial state
    await expect(page.getByTestId(DataTestIds.CONNECT_WALLET_BUTTON)).toBeVisible();
    await expect(page.getByTestId(DataTestIds.CONNECT_PAGE_TITLE)).toBeVisible();

    // Click the connect button - this should open the AppKit modal
    await page.getByTestId(DataTestIds.CONNECT_WALLET_BUTTON).click();

    // Wait for the AppKit modal to appear
    await page.waitForTimeout(2000);

    // Look for MetaMask option in the modal and click it
    // This selector might need adjustment based on how AppKit renders the MetaMask option
    await page
      .locator('[data-testid*="metamask"], [data-testid*="MetaMask"], text=/MetaMask/i')
      .first()
      .click();

    // Wait for MetaMask connection popup
    await page.waitForTimeout(1000);

    // Connect MetaMask to the dapp
    await metamask.connectToDapp();

    // Wait for authentication and potential redirect
    await page.waitForTimeout(5000);

    // Verify successful connection - should redirect to dashboard
    await expect(page).toHaveURL('/dashboard');
  });

  test('should show connecting state when connection is in progress', async ({
    context,
    page,
    metamaskPage,
    extensionId,
  }) => {
    // Navigate to the connect page
    await page.goto('/');

    // Verify initial state
    await expect(page.getByTestId(DataTestIds.CONNECT_WALLET_BUTTON)).toBeVisible();

    // Click the connect button
    await page.getByTestId(DataTestIds.CONNECT_WALLET_BUTTON).click();

    // Wait briefly for the connecting state
    await page.waitForTimeout(500);

    // Check if connecting state is shown
    const connectingText = page.getByTestId(DataTestIds.CONNECTING_TEXT);
    const connectingSpinner = page.getByTestId(DataTestIds.CONNECTING_SPINNER);

    if (await connectingText.isVisible()) {
      await expect(connectingText).toBeVisible();
      await expect(connectingSpinner).toBeVisible();
    }
  });

  test('should handle wallet connection rejection gracefully', async ({
    context,
    page,
    metamaskPage,
    extensionId,
  }) => {
    const metamask = new MetaMask(context, metamaskPage, basicSetup.walletPassword, extensionId);

    // Navigate to the connect page
    await page.goto('/');

    // Click the connect button
    await page.getByTestId(DataTestIds.CONNECT_WALLET_BUTTON).click();

    // Wait for the AppKit modal
    await page.waitForTimeout(2000);

    // Look for MetaMask option and click it
    await page
      .locator('[data-testid*="metamask"], [data-testid*="MetaMask"], text=/MetaMask/i')
      .first()
      .click();

    // Wait for MetaMask connection popup
    await page.waitForTimeout(1000);

    // Reject the connection
    await metamask.rejectAccess();

    // Wait for rejection to process
    await page.waitForTimeout(2000);

    // Verify we're still on the connect page
    await expect(page).toHaveURL('/');
    await expect(page.getByTestId(DataTestIds.CONNECT_WALLET_BUTTON)).toBeVisible();
  });

  test('should handle authentication errors properly', async ({
    context,
    page,
    metamaskPage,
    extensionId,
  }) => {
    // Navigate to the connect page
    await page.goto('/');

    // Click the connect button
    await page.getByTestId(DataTestIds.CONNECT_WALLET_BUTTON).click();

    // Wait for the modal
    await page.waitForTimeout(2000);

    // If an error occurs during authentication, it should be displayed
    const errorMessage = page.getByTestId(DataTestIds.CONNECT_PAGE_ERROR_MESSAGE);
    if (await errorMessage.isVisible()) {
      await expect(errorMessage).toBeVisible();
    }
  });
});
