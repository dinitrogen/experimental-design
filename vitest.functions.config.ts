import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/archive-student.spec.ts', 'tests/season-rollover.spec.ts'],
    testTimeout: 20_000,
    // Specs share one emulator and clear its data, so they must not run in parallel.
    fileParallelism: false,
  },
});
