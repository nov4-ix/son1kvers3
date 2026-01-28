import { render, screen, fireEvent } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import AuthButton from '../components/AuthButton';

// Mock de los módulos necesarios
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
  signIn: jest.fn(),
  signOut: jest.fn(),
}));

describe('AuthButton', () => {
  const mockPush = jest.fn();
  const mockSignIn = jest.fn();
  const mockSignOut = jest.fn();

  beforeEach(() => {
    // Configuración inicial de los mocks
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });

    (useSession as jest.Mock).mockReturnValue({
      data: null,
      status: 'unauthenticated',
    });

    // Limpiar mocks antes de cada prueba
    jest.clearAllMocks();
  });

  it('muestra el botón de inicio de sesión cuando el usuario no está autenticado', () => {
    render(<AuthButton />);
    expect(screen.getByText('Iniciar sesión')).toBeInTheDocument();
  });

  it('muestra el botón de cierre de sesión cuando el usuario está autenticado', () => {
    (useSession as jest.Mock).mockReturnValueOnce({
      data: { user: { name: 'Test User' } },
      status: 'authenticated',
    });

    render(<AuthButton />);
    expect(screen.getByText('Cerrar sesión')).toBeInTheDocument();
  });

  it('redirige al usuario a la página de inicio de sesión al hacer clic en el botón de inicio de sesión', () => {
    render(<AuthButton />);
    const loginButton = screen.getByText('Iniciar sesión');
    fireEvent.click(loginButton);
    expect(mockPush).toHaveBeenCalledWith('/login');
  });

  it('cierra la sesión del usuario al hacer clic en el botón de cierre de sesión', () => {
    (useSession as jest.Mock).mockReturnValueOnce({
      data: { user: { name: 'Test User' } },
      status: 'authenticated',
    });

    const { signOut } = require('next-auth/react');
    signOut.mockImplementation(() => Promise.resolve());

    render(<AuthButton />);
    const logoutButton = screen.getByText('Cerrar sesión');
    fireEvent.click(logoutButton);

    expect(signOut).toHaveBeenCalled();
  });
});
