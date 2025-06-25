# E2E Testing with Playwright and Synpress

This directory contains end-to-end tests for the Movin app using Playwright with Synpress for MetaMask integration.

## Setup

The project is already configured with the necessary dependencies:

- `@playwright/test` - Playwright testing framework
- `@synthetixio/synpress` - MetaMask integration for Playwright

### Initial Setup (Required)

Before running tests for the first time, you must build the Synpress cache:

```bash
npx synpress build-cache
```

This command will:

- Download MetaMask extension
- Create a cached wallet setup
- Initialize the test environment

**Note**: You only need to run this once, or when you change wallet setup configurations.

## Running Tests

### Basic Commands

```bash
# Run all e2e tests
pnpm test:e2e

# Run tests with UI mode (great for development and debugging)
pnpm test:e2e:ui

# Run tests in headed mode (see the browser)
pnpm test:e2e:headed

# Run tests in debug mode
pnpm test:e2e:debug

# Run specific test file
pnpm exec playwright test e2e/connect-page.spec.ts

# Run specific test by name
pnpm exec playwright test --grep "should connect MetaMask wallet"
```

## Test Files

- `connect-page.spec.ts` - Tests for the wallet connection functionality on the main connect page
- `metamask-connect.spec.ts` - General MetaMask connection tests

## Test Configuration

The tests are configured in `playwright.config.ts` with:

- Single worker execution (required for MetaMask tests)
- Automatic Next.js dev server startup
- Chrome browser testing
- Base URL: `http://localhost:3000`

## Wallet Setup

The MetaMask wallet setup is configured in `wallet-setup/basic.setup.ts` with:

- Test seed phrase: "test test test test test test test test test test test junk"
- Test password: "Tester@1234"
- Automatic wallet import

## Test Scenarios

The tests cover:

1. **Basic UI Display** - Verifies all elements are displayed correctly
2. **Successful Connection** - Tests complete wallet connection flow with redirect to dashboard
3. **Connection States** - Tests loading/connecting states
4. **Connection Rejection** - Tests handling of user rejection
5. **Error Handling** - Tests error scenarios and error message display

## Debugging

For debugging tests:

1. Use `pnpm test:e2e:ui` to run tests in UI mode
2. Use `pnpm test:e2e:debug` to run with debugger
3. Use `--headed` flag to see the browser in action
4. Add `await page.pause()` in test code to pause execution

## Notes

- Tests run against your local development server (`http://localhost:3000`)
- MetaMask extension is automatically installed and configured
- Tests use a test wallet with predefined seed phrase
- All tests are isolated and don't affect real wallet data

## Troubleshooting

If tests fail:

1. Ensure your Next.js dev server is running on port 3000
2. Check that all dependencies are installed (`pnpm install`)
3. Verify MetaMask extension loads properly
4. Check browser console for errors during test execution
5. Use headed mode to visually debug test execution

## AppKit Integration

The tests are designed to work with your Reown AppKit integration:

- Tests look for MetaMask option in the AppKit modal
- Handles the specific connection flow used by your app
- Waits for authentication and redirect to dashboard
