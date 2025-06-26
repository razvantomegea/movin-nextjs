import { testWithSynpress } from '@synthetixio/synpress';
import { metaMaskFixtures } from '@synthetixio/synpress/playwright';
import { loginWithMetaMask } from './utils/login.mjs';
import basicSetup from '../build-cache/basic.setup.mjs';
import { DataTestIds } from '../constants/dataTestIds.mjs';

const test = testWithSynpress(metaMaskFixtures(basicSetup));
const { expect } = test;

test.describe('Movin Dashboard Empty State', () => {
  test('should show empty dashboard and workouts when no data is present', async ({
    context,
    page,
    metamaskPage,
    extensionId,
  }) => {
    // Login with MetaMask (reusing the connect-page logic)
    await loginWithMetaMask({
      context,
      page,
      metamaskPage,
      extensionId,
      walletPassword: basicSetup.walletPassword,
      expectRedirect: true,
      expectedRedirectUrl: '/dashboard',
    });

    // Wait for dashboard to load
    await expect(page.getByTestId(DataTestIds.DASHBOARD_CONTAINER)).toBeVisible();

    // Check for empty state (no activity data)
    await expect(page.getByTestId(DataTestIds.DASHBOARD_EMPTY_STATE)).toBeVisible();
    await expect(page.getByTestId(DataTestIds.DASHBOARD_EMPTY_STATE)).toContainText(
      'No activity data recorded for today',
    );

    // Check for empty workouts state
    await expect(page.getByTestId(DataTestIds.DASHBOARD_EMPTY_WORKOUTS)).toBeVisible();
    await expect(page.getByTestId(DataTestIds.DASHBOARD_EMPTY_WORKOUTS)).toContainText(
      'No workouts recorded today',
    );
  });
});
