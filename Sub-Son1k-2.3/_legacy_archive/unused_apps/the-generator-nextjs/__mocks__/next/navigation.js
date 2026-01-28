// Mock para next/navigation
export const useRouter = () => ({
  push: jest.fn(),
  replace: jest.fn(),
  prefetch: jest.fn(),
});

export const useSearchParams = () => ({
  get: jest.fn(),
});

export const usePathname = () => '/mocked-path';

export const redirect = jest.fn();

export default {
  useRouter,
  useSearchParams,
  usePathname,
  redirect,
};
