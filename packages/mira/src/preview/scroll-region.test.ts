import { expect, it } from "vitest";
import { accessibleScrollRegion } from "./scroll-region";

it("adds a named keyboard target only while the preview overflows", async () => {
  const element = document.createElement("div");
  let height = 80;
  Object.defineProperties(element, {
    clientHeight: { get: () => 100 },
    scrollHeight: { get: () => height },
    clientWidth: { get: () => 100 },
    scrollWidth: { get: () => 100 },
  });
  const action = accessibleScrollRegion(element, "Card preview");
  expect(element.hasAttribute("tabindex")).toBe(false);
  height = 200;
  element.append(document.createElement("p"));
  await Promise.resolve();
  expect(element.tabIndex).toBe(0);
  expect(element.getAttribute("role")).toBe("region");
  expect(element.getAttribute("aria-label")).toBe("Card preview");
  action.update("Renamed preview");
  expect(element.getAttribute("aria-label")).toBe("Renamed preview");
  height = 80;
  window.dispatchEvent(new Event("resize"));
  expect(element.hasAttribute("tabindex")).toBe(false);
  action.destroy();
  height = 200;
  element.append(document.createElement("p"));
  window.dispatchEvent(new Event("resize"));
  await Promise.resolve();
  expect(element.hasAttribute("tabindex")).toBe(false);
});
