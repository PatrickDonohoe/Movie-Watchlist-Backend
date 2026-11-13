import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    env: {
      NODE_ENV: 'test',
      DATABASE_URL: 'postgresql://test:test@localhost:5433/test',
      DATABASE_URL_POOLED: 'postgresql://test:test@localhost:5433/test',
      JWT_SECRET: '3j0KJV857exY+id+tDgh00kSMOIR1opjFkgpJjmk6yo=',
    },
    restoreMocks: true,
  },
});
