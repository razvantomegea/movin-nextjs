import { testWithSynpress } from '@synthetixio/synpress';
import { metaMaskFixtures } from '@synthetixio/synpress/playwright';
import { activitiesMock } from './__mocks__/activities.mjs';
import { loginWithMetaMask } from './utils/login.mjs';
import basicSetup from '../build-cache/basic.setup.mjs';
import { DataTestIds } from '../constants/dataTestIds.mjs';

const test = testWithSynpress(metaMaskFixtures(basicSetup));
const { expect } = test;

test.describe('Movin Dashboard Data State', () => {
  test('should show dashboard and workouts with mocked activity data', async ({
    context,
    page,
    metamaskPage,
    extensionId,
  }) => {
    await page.route(
      'https://glzwixacshqzriejlkwt.supabase.co/rest/v1/activities**',
      async (route) => {
        return await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(activitiesMock),
        });
      },
    );

    await context.route(
      'https://glzwixacshqzriejlkwt.supabase.co/rest/v1/activities**',
      async (route) => {
        return await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(activitiesMock),
        });
      },
    );

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

    // Check daily activity card values
    await expect(page.getByTestId(DataTestIds.DASHBOARD_DAILY_ACTIVITY_CARD)).toBeVisible();
    await expect(page.getByTestId(DataTestIds.DASHBOARD_DAILY_STEPS)).toHaveText('148');
    await expect(page.getByTestId(DataTestIds.DASHBOARD_DAILY_CALORIES)).toHaveText('34');
    await expect(page.getByTestId(DataTestIds.DASHBOARD_DAILY_DISTANCE)).toContainText('0.114');
    await expect(page.getByTestId(DataTestIds.DASHBOARD_DAILY_DURATION)).toHaveText('0h 0m');

    // Check that at least one workout row is rendered for today
    const workoutRows = await page
      .locator(`[data-testid="${DataTestIds.DASHBOARD_WORKOUT_ROW}"]`)
      .all();
    expect(workoutRows.length).toBeGreaterThan(0);
    // Optionally, check the first workout row contains the expected text
    await expect(workoutRows[0]).toContainText('Steps');
    await expect(workoutRows[0]).toContainText('Duration: 0 min');
    await expect(workoutRows[0]).toContainText('Distance: 114m');
    await expect(workoutRows[0]).toContainText('Calories: 34 kcal');
  });

  test('should show empty dashboard and workouts when no data is present', async ({
    context,
    page,
    metamaskPage,
    extensionId,
  }) => {
    // Disable service worker and clear caches before anything else
    await page.goto('http://localhost:3000');
    await page.evaluate(async () => {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const reg of registrations) {
        await reg.unregister();
      }
      const cacheNames = await caches.keys();
      for (const name of cacheNames) {
        await caches.delete(name);
      }
    });

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
