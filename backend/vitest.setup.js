// backend/vitest.setup.js
import { vi } from 'vitest';

// Add this to the TOP of your test files
vi.mock('mongoose', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    connect: vi.fn().mockResolvedValue(true),
    connection: {
      ...actual.connection,
      readyState: 1,
      db: { dropDatabase: vi.fn().mockResolvedValue(true) },
      close: vi.fn().mockResolvedValue(true),
    },
  };
});