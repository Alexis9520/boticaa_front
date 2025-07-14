/**
 * Configuration file for the application
 */
export const config = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080',
  appName: process.env.NEXT_PUBLIC_APP_NAME || 'Boticas Said',
  appVersion: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
  isDevelopment: process.env.NODE_ENV === 'development',
} as const;

/**
 * API endpoints configuration
 */
export const endpoints = {
  auth: {
    login: '/auth/login',
    me: '/usuarios/me',
  },
  usuarios: {
    me: '/usuarios/me',
  },
  productos: {
    list: '/productos',
    create: '/productos/nuevo',
    update: (codigoBarras: string) => `/productos/${codigoBarras}`,
    delete: (codigoBarras: string) => `/productos/${codigoBarras}`,
  },
  cajas: {
    historial: '/api/cajas/historial',
    movimiento: '/api/cajas/movimiento',
    actual: '/api/cajas/actual',
  },
  boletas: {
    list: '/api/boletas',
  },
  stock: {
    list: '/api/stock',
    update: (id: number) => `/api/stock/${id}`,
  },
} as const;

/**
 * Build full URL for API endpoint
 */
export const buildApiUrl = (endpoint: string, params?: Record<string, string>) => {
  const url = new URL(endpoint, config.apiUrl);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });
  }
  return url.toString();
};