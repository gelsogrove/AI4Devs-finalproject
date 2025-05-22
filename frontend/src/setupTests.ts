// This file is run before each test file
import * as matchers from '@testing-library/jest-dom/matchers';
import { cleanup } from '@testing-library/react';
import { afterEach, expect } from 'vitest';

// Extend vitest's expect with testing-library matchers
expect.extend(matchers);

// Cleanup after each test case
afterEach(() => {
  cleanup();
}); 