import { testWithSynpress } from '@synthetixio/synpress';
import { metaMaskFixtures } from '@synthetixio/synpress/playwright';
import { loginWithMetaMask } from './utils/login.mjs';
import basicSetup from '../build-cache/basic.setup.mjs';

const test = testWithSynpress(metaMaskFixtures(basicSetup));
const { expect } = test;

// Mock the geolocation API
const mockGeolocation = async (page, latitude, longitude) => {
  await page.context().grantPermissions(['geolocation']);
  await page.evaluate(
    (coords) => {
      navigator.geolocation.getCurrentPosition = (success) => {
        success({
          coords: {
            latitude: coords.latitude,
            longitude: coords.longitude,
            accuracy: 10,
          },
        });
      };
      navigator.geolocation.watchPosition = (success) => {
        success({
          coords: {
            latitude: coords.latitude,
            longitude: coords.longitude,
            accuracy: 10,
          },
        });
        return { clear() {} };
      };
    },
    { latitude, longitude },
  );
};

test('Route Tracking Modal - Single Route', async ({
  context,
  page,
  metamaskPage,
  extensionId,
}) => {
  // Login with MetaMask
  await loginWithMetaMask({
    context,
    page,
    metamaskPage,
    extensionId,
    walletPassword: basicSetup.walletPassword,
    expectRedirect: true,
    expectedRedirectUrl: '/dashboard',
  });

  // 1. Mock location permission and set initial location
  await mockGeolocation(page, 40.7128, -74.006); // New York City

  // Open route tracking modal
  await page.getByRole('button', { name: 'Track Route' }).click();

  // Verify that the route type modal is open
  await expect(page.getByText('Select Route Type')).toBeVisible();

  // Select single route tracking
  await page.getByRole('button', { name: 'Single Route' }).click();

  // Verify that the route tracking modal is open
  await expect(page.getByText('Track Route')).toBeVisible();

  // 2. Start tracking
  await page.getByRole('button', { name: 'Start' }).click();

  // Verify that the pause button is visible
  await expect(page.getByRole('button', { name: 'Pause' })).toBeVisible();

  // 3. Pause tracking after 5 seconds
  await page.waitForTimeout(5000);
  await page.getByRole('button', { name: 'Pause' }).click();

  // Verify that the start button is visible
  await expect(page.getByRole('button', { name: 'Start' })).toBeVisible();

  // 4. Save route
  // Mock the activity save
  await page.route('/api/admin/set-transaction-sync/*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ message: 'Activity saved successfully' }),
    });
  });

  await page.getByRole('button', { name: 'Save' }).click();

  // 5. Assert success message
  await expect(page.getByText(/Route Saved as Activity/)).toBeVisible();
});
