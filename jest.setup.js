// Import jest-dom testing library
import '@testing-library/jest-dom';

// Mock the matchMedia function for tests
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
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

// Set up global date mock to have consistent dates in tests
jest.spyOn(global.Date, 'now').mockImplementation(() => new Date('2023-06-15T12:00:00Z').valueOf());

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