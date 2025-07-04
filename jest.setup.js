/* eslint-env jest */
// Import jest-dom testing library
import '@testing-library/jest-dom';

// Mock the matchMedia function for tests
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // Deprecated
    removeListener: jest.fn(), // Deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Note: We've removed the global Date.now mock to avoid conflicts
// with per-test date mocking. Individual tests should mock Date.now
// when needed and clean up afterwards.

// Mock the ResizeObserver API
global.ResizeObserver = class ResizeObserver {
  constructor(cb) {
    this.cb = cb;
  }
  observe() {
    return null;
  }
  unobserve() {
    return null;
  }
  disconnect() {
    return null;
  }
};

global.TextEncoder = require('util').TextEncoder;
global.TextDecoder = require('util').TextDecoder;
