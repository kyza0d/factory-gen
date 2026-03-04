// __mocks__/convex/react.ts
import { vi } from 'vitest';

export const mockUseQuery = vi.fn();
export const mockUseMutation = vi.fn(() => vi.fn());

// Explicitly define the mock for the module
const convexReactMock = {
  useQuery: mockUseQuery,
  useMutation: mockUseMutation,
};

export default convexReactMock;
