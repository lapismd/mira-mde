declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean | undefined;
}

class ResizeObserverMock {
  disconnect(): void {
    return undefined;
  }

  observe(): void {
    return undefined;
  }

  unobserve(): void {
    return undefined;
  }
}

globalThis.ResizeObserver ??= ResizeObserverMock;

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

export {};
