import { defineConfig } from 'vite';
import type { UserConfig } from 'vite';
import type { InlineConfig } from 'vitest/node';
import react from '@vitejs/plugin-react';

interface VitestConfigExport extends UserConfig {
  test?: InlineConfig;
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'node',
  },
} as VitestConfigExport);
