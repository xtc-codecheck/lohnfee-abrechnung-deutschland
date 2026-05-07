import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    include: ['bench/**/*.bench.ts'],
    benchmark: { include: ['bench/**/*.bench.ts'] },
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
});
