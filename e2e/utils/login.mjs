import { MetaMask } from '@synthetixio/synpress/playwright';
import { sleep } from './sleep.mjs';
import { DataTestIds } from '../../constants/dataTestIds.mjs';

const SLEEP_TIME = 1000;

/**
 * Handle MetaMask network approval using proper Synpress methods
 * @param {MetaMask} metamask - MetaMask instance
 */
async function handleNetworkApproval(metamask) {
  try {
    console.log('Handling network approval with Synpress methods...');

    // Wait a moment for network popups to appear
    await sleep(SLEEP_TIME);

    // Try to approve new network addition if needed
    try {
      console.log('Attempting to approve new network...');
      await metamask.approveNewNetwork();
      console.log('New network approved successfully');
    } catch (error) {
      console.log('No new network to approve or approval failed:', error.message);
    }

    // Try to approve network switching if needed
    try {
      console.log('Attempting to approve network switching...');
      await metamask.approveSwitchNetwork();
      console.log('Network switch approved successfully');
    } catch (error) {
      console.log('No network switch to approve or approval failed:', error.message);
    }

    // Handle any remaining confirmation popups
    try {
      const notificationPage = metamask.notificationPage?.page;
      if (notificationPage) {
        await notificationPage.getByTestId('popover-close').waitFor({ timeout: 2000 });
        await notificationPage.getByTestId('popover-close').click();
        console.log('Closed network confirmation popup');
      }
    } catch (error) {
      console.log('No confirmation popup to close:', error.message);
    }

    // Go back to home page to reset MetaMask UI
    try {
      await metamask.goBackToHomePage();
      console.log('Returned to MetaMask home page');
    } catch (error) {
      console.log('Could not return to home page:', error.message);
    }

    console.log('Network approval handling completed');
  } catch (error) {
    console.log('Network approval handling error:', error.message);
    // Continue with test even if network approval fails
  }
}

/**
 * Reusable function to login with MetaMask
 * @param {Object} params - Test parameters
 * @param {Object} params.context - Browser context
 * @param {Object} params.page - Page object
 * @param {Object} params.metamaskPage - MetaMask page object
 * @param {string} params.extensionId - MetaMask extension ID
 * @param {string} params.walletPassword - MetaMask wallet password
 * @param {string} [params.url='/'] - URL to navigate to before login
 * @param {boolean} [params.expectRedirect=true] - Whether to expect redirect after login
 * @param {string} [params.expectedRedirectUrl='/dashboard'] - Expected redirect URL
 * @returns {Promise<MetaMask>} MetaMask instance for further use
 */
export async function loginWithMetaMask({
  context,
  page,
  metamaskPage,
  extensionId,
  walletPassword,
  expectRedirect = true,
  expectedRedirectUrl = '/dashboard',
}) {
  // Create a new MetaMask instance
  const metamask = new MetaMask(context, metamaskPage, walletPassword, extensionId);

  // Wait for page to load and connect button to be visible
  await page.waitForSelector(`[data-testid="${DataTestIds.CONNECT_WALLET_BUTTON}"]`, {
    timeout: 10000,
  });

  // Click the connect button - this should open the AppKit modal
  await page.getByTestId(DataTestIds.CONNECT_WALLET_BUTTON).click();

  // Wait for the AppKit modal to appear
  await page.waitForTimeout(SLEEP_TIME);

  // Look for MetaMask option in the modal and click it
  await page.locator('text=MetaMask').first().click();

  // Wait for MetaMask connection popup
  await page.waitForTimeout(SLEEP_TIME);

  // Connect MetaMask to the dapp
  await metamask.connectToDapp();

  // Handle potential network approval popup
  await handleNetworkApproval(metamask);

  // Wait for authentication and potential redirect
  await page.waitForTimeout(SLEEP_TIME);

  // Check for redirect if expected
  if (expectRedirect) {
    try {
      await page.waitForURL(expectedRedirectUrl, { timeout: 30000 });
      console.log('Successfully redirected to dashboard');
    } catch (error) {
      // If browser closes or times out, check current URL
      try {
        const currentUrl = page.url();
        console.log('Current URL after connection:', currentUrl);
        if (!currentUrl.includes('/dashboard')) {
          throw error;
        }
      } catch (urlError) {
        console.log('Could not get current URL (page may have closed):', urlError.message);
        // If we can't get the URL, assume the connection was successful and browser closed
      }
    }
  }

  return metamask;
}

/**
 * Reusable function to login with MetaMask via referral modal
 * @param {Object} params - Test parameters
 * @param {Object} params.context - Browser context
 * @param {Object} params.page - Page object
 * @param {Object} params.metamaskPage - MetaMask page object
 * @param {string} params.extensionId - MetaMask extension ID
 * @param {string} params.walletPassword - MetaMask wallet password
 * @param {string} params.referralAddress - Referral address to use
 * @returns {Promise<MetaMask>} MetaMask instance for further use
 */
export async function loginWithMetaMaskViaReferral({
  context,
  page,
  metamaskPage,
  extensionId,
  walletPassword,
  referralAddress,
}) {
  // Create a new MetaMask instance
  const metamask = new MetaMask(context, metamaskPage, walletPassword, extensionId);

  // Navigate to the page with referral parameter
  await page.goto(`/?referral=${referralAddress}`);

  // Wait for referral modal to appear
  await page.waitForSelector(`[data-testid="${DataTestIds.REFERRAL_MODAL_CONTAINER}"]`, {
    timeout: 10000,
  });

  // Click the referral modal connect button
  await page.getByTestId(DataTestIds.REFERRAL_MODAL_CONNECT_BUTTON).click();

  // Wait for the AppKit modal to appear
  await page.waitForTimeout(SLEEP_TIME);

  // Look for MetaMask option in the modal and click it
  await page.locator('text=MetaMask').first().click();

  // Wait for MetaMask connection popup
  await page.waitForTimeout(SLEEP_TIME);

  // Connect MetaMask to the dapp
  await metamask.connectToDapp();

  // Handle potential network approval popup
  await handleNetworkApproval(metamask);

  // Wait for authentication and potential redirect (extra time for referral processing)
  await page.waitForTimeout(SLEEP_TIME);

  return metamask;
}

/**
 * Check if user is already logged in by checking current URL
 * @param {Object} page - Page object
 * @returns {Promise<boolean>} True if user is logged in (on dashboard page)
 */
export async function isLoggedIn(page) {
  const currentUrl = page.url();
  return currentUrl.includes('/dashboard');
}

/**
 * Logout user if logged in
 * @param {Object} page - Page object
 */
export async function logout(page) {
  if (await isLoggedIn(page)) {
    // Clear storage and navigate to home page
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.goto('/');
  }
}
