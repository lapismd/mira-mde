import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [sveltekit()],
  ssr: {
    noExternal: ["@lucide/svelte"],
  },
  test: {
    environment: "jsdom",
    include: ["src/**/*.test.ts"],
  },
});
