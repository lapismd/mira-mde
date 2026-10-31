import { copyFileSync, realpathSync, writeFileSync } from "node:fs";
import path from "node:path";

export function writeMathTypesFixture(directory) {
  // Match package import resolution, rather than a logical pnpm symlink path.
  const installedMath = path.join(
    realpathSync(path.join(directory, "node_modules/@lapismd/mira")),
    "dist/preview/math-plugins.js",
  );
  writeFileSync(
    path.join(directory, "math-types.ts"),
    `import { remarkMath, rehypeKatex } from ${JSON.stringify(installedMath)};
type IsAny<T> = 0 extends (1 & T) ? true : false;
const remarkIsAny: IsAny<typeof remarkMath> = false;
const rehypeIsAny: IsAny<typeof rehypeKatex> = false;
void [remarkIsAny, rehypeIsAny];\n`,
  );
  writeFileSync(
    path.join(directory, "tsconfig.math.json"),
    JSON.stringify(
      {
        compilerOptions: {
          noEmit: true,
          strict: true,
          skipLibCheck: false,
          target: "ES2022",
          module: "NodeNext",
          moduleResolution: "NodeNext",
        },
        include: ["math-types.ts"],
      },
      null,
      2,
    ) + "\n",
  );
}

export function writeMathPackageFixture(directory, tarball) {
  writeFileSync(
    path.join(directory, ".npmrc"),
    "node-linker=isolated\nhoist=false\n",
  );
  writeFileSync(
    path.join(directory, "package.json"),
    JSON.stringify(
      {
        name: "mira-math-runtime-consumer",
        private: true,
        type: "module",
        dependencies: { "@lapismd/mira": `file:${tarball}` },
        devDependencies: {
          "@sveltejs/vite-plugin-svelte": "^6.2.1",
          "@types/node": "^24.10.2",
          playwright: "1.62.1",
          svelte: "^5.46.1",
          typescript: "^5.9.3",
          vite: "^7.3.7",
        },
      },
      null,
      2,
    ) + "\n",
  );
  writeMathRuntimeFixture(directory);
}

/** A clean public-package host: no source aliases or renderer overrides. */
export function writeMathRuntimeFixture(directory) {
  copyFileSync(
    new URL("./math-compile-diagnostics.mjs", import.meta.url),
    path.join(directory, "math-compile-diagnostics.mjs"),
  );
  writeFileSync(
    path.join(directory, "index.html"),
    `<!doctype html>
<html><head><link rel="icon" href="data:,"></head><body><div id="app"></div>
<script type="module" src="/math-main.js"></script></body></html>\n`,
  );
  writeFileSync(
    path.join(directory, "math-main.js"),
    `import { mount } from "svelte";
import App from "./MathRuntime.svelte";
import "@lapismd/mira/styles.css";
mount(App, { target: document.getElementById("app") });\n`,
  );
  writeFileSync(
    path.join(directory, "MathRuntime.svelte"),
    String.raw`<script>
  import { MarkdownPreview } from "@lapismd/mira/preview";
  const inline = "Inline $x^2$.";
  const display = "$$\nx^2+y^2=z^2\n$$";
  const trust = "$\\href{https://example.com}{untrusted}$";
  const invalid = "$\\frac{1}{$";
  const safe = '<img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg==" onerror="window.__rawMathExecuted=true"> $y$';
</script>
<section data-case="inline"><MarkdownPreview value={inline} /></section>
<section data-case="display"><MarkdownPreview value={display} /></section>
<section data-case="trust"><MarkdownPreview value={trust} htmlPolicy="safe" /></section>
<section data-case="invalid"><MarkdownPreview value={invalid} /></section>
<section data-case="safe"><MarkdownPreview value={safe} htmlPolicy="safe" /></section>
`,
  );
  writeFileSync(
    path.join(directory, "math-runtime.mjs"),
    String.raw`
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { pathToFileURL } from "node:url";
import { build, createServer, preview } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { chromium } from "playwright";
import { createMathCompileDiagnostics } from "./math-compile-diagnostics.mjs";

const entry = new URL(import.meta.resolve("@lapismd/mira"));
const bundle = new URL("./preview/math-plugins.js", entry);
const require = createRequire(bundle);
const { remarkMath, rehypeKatex } = await import(bundle);
const load = (name) => import(pathToFileURL(require.resolve(name)).href);
const [{ unified }, { default: remarkParse }, { default: remarkRehype }] =
  await Promise.all(["unified", "remark-parse", "remark-rehype"].map(load));
const parser = unified().use(remarkParse).use(remarkMath).use(remarkRehype).use(rehypeKatex);
const parsed = JSON.stringify(parser.runSync(parser.parse("Inline $x^2$.\n\n$$\nx^2+y^2=z^2\n$$")));
assert(parsed.includes("katex-mathml") && parsed.includes("katex-display"));
const descriptor = Object.getOwnPropertyDescriptor(Object.prototype, "trust");
try {
  for (const writable of [true, false]) {
    Object.defineProperty(Object.prototype, "trust", { value: true, configurable: true, writable });
    const tree = JSON.stringify(parser.runSync(parser.parse("Normal $x^2$ and $\\href{https://example.com}{untrusted}$")));
    assert(!tree.includes('"tagName":"a"'));
    if (writable) assert(tree.includes("katex-mathml"));
    else assert(tree.includes("read only property"));
  }
} finally {
  if (descriptor) Object.defineProperty(Object.prototype, "trust", descriptor);
  else Reflect.deleteProperty(Object.prototype, "trust");
}
let katexDirectory = dirname(require.resolve("katex"));
while (!readManifest(katexDirectory)) {
  const parent = dirname(katexDirectory);
  if (parent === katexDirectory) throw new Error("Missing installed KaTeX manifest");
  katexDirectory = parent;
}
function readManifest(directory) {
  try { return JSON.parse(readFileSync(join(directory, "package.json"), "utf8")).name === "katex"; }
  catch (error) { if (error.code !== "ENOENT") throw error; return false; }
}
const katexVersion = JSON.parse(readFileSync(join(katexDirectory, "package.json"), "utf8")).version;
assert.match(katexVersion, /^0\.18\.(?:[2-9]|\d{2,})$/);

const mode = process.argv[2];
const config = {
  root: process.cwd(), configFile: false, logLevel: "warn", clearScreen: false,
  plugins: [svelte({ onwarn: createMathCompileDiagnostics({ mode, evidencePath: process.argv[3] }) })],
  server: { host: "127.0.0.1", port: 0, strictPort: true },
  preview: { host: "127.0.0.1", port: 0, strictPort: true },
  optimizeDeps: { force: true },
  build: { outDir: ".math-production", emptyOutDir: true },
};
let server;
let browser;
try {
  if (mode === "production") { await build(config); server = await preview(config); }
  else { server = await createServer(config); await server.listen(); }
  const address = server.httpServer.address();
  const url = "http://127.0.0.1:" + address.port;
  browser = await chromium.launch();
  let checks = 0;
  for (const pollution of ["ordinary", "writable", "readonly"]) {
    const polluted = pollution !== "ordinary";
    const context = await browser.newContext();
    if (polluted) await context.addInitScript((writable) => {
      Object.defineProperty(Object.prototype, "trust", { value: true, configurable: true, writable });
    }, pollution === "writable");
    const page = await context.newPage();
    const diagnostics = [];
    page.on("pageerror", (error) => diagnostics.push(error.message));
    page.on("console", (message) => {
      if (["warning", "error"].includes(message.type())) diagnostics.push(message.text());
    });
    try {
    await page.goto(url);
    if (pollution === "readonly") {
      const fallback = page.locator('[data-case="trust"] .katex-error');
      await fallback.waitFor();
      assert.equal(await page.locator('[data-case="trust"] a').count(), 0);
      assert.match(await fallback.getAttribute("title") ?? "", /read only property 'trust'/);
      assert(await fallback.isVisible());
      assert.deepEqual(diagnostics, []);
      checks += 4;
    } else {
    await page.locator('[data-case="safe"] .katex-mathml').waitFor();
    assert.equal(await page.locator('[data-case="inline"] annotation').textContent(), "x^2");
    assert.equal(await page.locator('[data-case="display"] .katex-display').count(), 1);
    assert.equal(await page.locator('[data-case="trust"] a').count(), 0);
    assert.equal(await page.locator('[data-case="invalid"] .katex-error').count(), 1, "invalid latex fallback");
    assert.equal(await page.locator('[data-case="safe"] img').getAttribute("onerror"), null);
    assert.equal(await page.evaluate(() => Boolean(window.__rawMathExecuted)), false);
    assert.deepEqual(diagnostics, []);
    checks += 7;
    }
    } catch (error) {
      const state = await page.evaluate(() => ({
        sections: [...document.querySelectorAll("[data-case]")].map((element) => ({
          name: element.getAttribute("data-case"),
          html: element.innerHTML.slice(0, 1600),
          math: [...element.querySelectorAll(".katex-mathml, .katex-html")].map((math) => ({
            className: math.className, display: getComputedStyle(math).display,
            visibility: getComputedStyle(math).visibility,
            height: math.getBoundingClientRect().height, width: math.getBoundingClientRect().width,
          })),
        })),
      })).catch(() => null);
      console.error(JSON.stringify({ mode, pollution, diagnostics, state }));
      throw error;
    }
    await context.close();
  }
  console.log(JSON.stringify({ mode, nodeChecks: 4, browserChecks: checks, katexVersion, diagnostics: 0 }));
} finally {
  if (browser) await browser.close();
  if (server?.close) await server.close();
  else if (server) await new Promise((resolve, reject) => server.httpServer.close((error) => error ? reject(error) : resolve()));
}
`,
  );
}
