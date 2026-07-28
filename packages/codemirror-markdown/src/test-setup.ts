if (typeof Range !== "undefined") {
  Range.prototype.getBoundingClientRect ??= () =>
    ({
      bottom: 0,
      height: 0,
      left: 0,
      right: 0,
      toJSON: () => ({}),
      top: 0,
      width: 0,
      x: 0,
      y: 0,
    }) as DOMRect;
  Range.prototype.getClientRects ??= () =>
    ({
      item: () => null,
      length: 0,
      [Symbol.iterator]: function* () {},
    }) as DOMRectList;
}
