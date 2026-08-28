import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  retries: 1,
  use: {
    baseURL: "http://127.0.0.1:4173",
    trace: "retain-on-failure",
  },
  webServer: {
    command: "pnpm run dev --host 127.0.0.1 --port 4173",
    url: "http://127.0.0.1:4173",
    // CI always starts an isolated server; local verification can reuse Vite started by the developer.
    reuseExistingServer: !process.env.CI,
  },
});
