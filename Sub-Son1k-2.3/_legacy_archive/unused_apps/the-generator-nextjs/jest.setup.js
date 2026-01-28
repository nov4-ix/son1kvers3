import '@testing-library/jest-dom';

// Los mocks ahora están en archivos separados en la carpeta __mocks__

// Configuración global de Jest
global.console = {
  ...console,
  // Opcional: silenciar advertencias específicas durante las pruebas
  warn: jest.fn(),
  error: jest.fn(),
};

// Mock de fetch global
if (!global.fetch) {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      json: () => Promise.resolve({}),
      ok: true,
    })
  );
}
