import { buildApiUrl, endpoints } from './config';

/**
 * API Error class for better error handling
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public endpoint: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Función util para cualquier endpoint protegido
 */
export async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<any> {
  // Obtiene el token JWT desde localStorage
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  if (!token) {
    if (typeof window !== "undefined") {
      window.location.href = "/";
    }
    throw new ApiError("No token", 401, url);
  }

  // Construye los headers con Authorization Bearer
  const headers = {
    ...(options.headers || {}),
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  try {
    const res = await fetch(url, { ...options, headers });

    if (!res.ok) {
      if (res.status === 401) {
        // Token expirado o inválido
        if (typeof window !== "undefined") {
          localStorage.removeItem("token");
          localStorage.removeItem("usuario");
          window.location.href = "/";
        }
        throw new ApiError("Token inválido", 401, url);
      }
      const errorText = await res.text();
      throw new ApiError(errorText || `Error en la petición: ${res.status}`, res.status, url);
    }

    // Manejar respuestas vacías para métodos como DELETE
    const contentLength = res.headers.get("content-length");
    if (res.status === 204 || contentLength === "0") {
      return null;
    }

    const text = await res.text();
    if (!text) return null;

    try {
      return JSON.parse(text);
    } catch {
      return null;
    }
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(`Error de red: ${error instanceof Error ? error.message : 'Unknown error'}`, 0, url);
  }
}

// Obtener listado de productos
export async function getProductos() {
  return fetchWithAuth(buildApiUrl(endpoints.productos.list));
}

// Obtener historial de cajas
export async function getHistorial() {
  return fetchWithAuth(buildApiUrl(endpoints.cajas.historial));
}

// Agregar movimiento a caja
export async function agregarMovimiento(data: any) {
  return fetchWithAuth(buildApiUrl(endpoints.cajas.movimiento), {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// Obtener caja actual con token y usuario
export async function fetchWithToken() {
  const usuarioStr = typeof window !== "undefined" ? localStorage.getItem("usuario") : null;
  const usuario = usuarioStr ? JSON.parse(usuarioStr) : {};
  return fetchWithAuth(buildApiUrl(endpoints.cajas.actual, { dniUsuario: usuario.dni }));
}

// Obtener boletas con filtros (page, limit, search, from, to)
export async function getBoletas({ page, limit, search, from, to }: {
  page: number,
  limit: number,
  search?: string,
  from?: string,
  to?: string
}) {
  const params: Record<string, string> = {
    page: String(page),
    limit: String(limit),
  };
  
  if (search) params.search = search;
  if (from) params.from = from;
  if (to) params.to = to;

  return fetchWithAuth(buildApiUrl(endpoints.boletas.list, params));
}

// Crear producto (POST)
export async function crearProducto(data: any) {
  return fetchWithAuth(buildApiUrl(endpoints.productos.create), {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// Actualizar producto por código de barras (PUT)
export async function actualizarProducto(codigoBarras: string, data: any) {
  return fetchWithAuth(buildApiUrl(endpoints.productos.update(codigoBarras)), {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

// Eliminar producto por código de barras (DELETE)
export async function eliminarProducto(codigoBarras: string) {
  return fetchWithAuth(buildApiUrl(endpoints.productos.delete(codigoBarras)), {
    method: "DELETE"
  });
}

// Obtener stock protegido por token
export async function getStock() {
  return fetchWithAuth(buildApiUrl(endpoints.stock.list));
}

// Actualizar stock protegido por token
export async function actualizarStock(id: number, data: any) {
  return fetchWithAuth(buildApiUrl(endpoints.stock.update(id)), {
    method: "PUT",
    body: JSON.stringify(data),
  });
}