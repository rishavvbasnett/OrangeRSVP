import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globalSetup: ["./src/shared/test/globalSetup.ts"],
    setupFiles: ["./src/shared/test/setup.ts"],
    fileParallelism: false,
  },
});
