// Global TypeScript declarations
interface ResizeObserverSize {
  inlineSize: number;
  blockSize: number;
}

interface ResizeObserverEntry {
  target: Element;
  contentRect: DOMRectReadOnly;
  borderBoxSize: ReadonlyArray<ResizeObserverSize>;
  contentBoxSize: ReadonlyArray<ResizeObserverSize>;
}

declare global {
  class ResizeObserver {
    constructor(callback: (entries: ResizeObserverEntry[], observer: ResizeObserver) => void);
    disconnect(): void;
    observe(target: Element, options?: ResizeObserverOptions): void;
    unobserve(target: Element): void;
  }
}

export {};
