// Mock para next-auth/react
export const signIn = jest.fn();
export const signOut = jest.fn();

export const useSession = jest.fn(() => ({
  data: null,
  status: 'unauthenticated',
  update: jest.fn(),
}));

export const getSession = jest.fn(() => Promise.resolve(null));

export const getProviders = jest.fn(() =>
  Promise.resolve({
    google: {
      id: 'google',
      name: 'Google',
      type: 'oauth',
      signinUrl: 'http://localhost:3000/api/auth/signin/google',
      callbackUrl: 'http://localhost:3000/api/auth/callback/google',
    },
  })
);

export const getCsrfToken = jest.fn(() => Promise.resolve('mocked-csrf-token'));

export default {
  signIn,
  signOut,
  useSession,
  getSession,
  getCsrfToken,
};
