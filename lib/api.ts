// Función util para cualquier endpoint protegido
export async function fetchWithAuth(url: string, options: RequestInit = {}) {
  // Obtiene el token JWT desde localStorage
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  if (!token) {
    window.location.href = "/login";
    throw new Error("No token");
  }
  // Construye los headers con Authorization Bearer
  const headers = {
    ...(options.headers || {}),
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
  const res = await fetch(url, { ...options, headers });

  if (!res.ok) {
    if (res.status === 401) {
      // Token expirado o inválido
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    const errorText = await res.text();
    throw new Error(errorText || `Error en la petición: ${res.status}`);
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
}

// Obtener listado de productos
export async function getProductos() {
  return fetchWithAuth("http://51.161.10.179:8080/productos");
}

// Obtener historial de cajas
export async function getHistorial() {
  return fetchWithAuth("http://51.161.10.179:8080/api/cajas/historial");
}

// Agregar movimiento a caja
export async function agregarMovimiento(data: any) {
  return fetchWithAuth("http://51.161.10.179:8080/api/cajas/movimiento", {
    method: "POST",
    body: JSON.stringify(data),
    headers: { "Content-Type": "application/json" },
  });
}

// Obtener caja actual con token y usuario
export async function fetchWithToken() {
  const usuarioStr = typeof window !== "undefined" ? localStorage.getItem("usuario") : null;
  const usuario = usuarioStr ? JSON.parse(usuarioStr) : {};
  return fetchWithAuth(`http://51.161.10.179:8080/api/cajas/actual?dniUsuario=${usuario.dni}`);
}

// Obtener boletas con filtros (page, limit, search, from, to)
export async function getBoletas({ page, limit, search, from, to }: {
  page: number,
  limit: number,
  search?: string,
  from?: string,
  to?: string
}) {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
    ...(search ? { search } : {}),
    ...(from ? { from } : {}),
    ...(to ? { to } : {})
  });
  return fetchWithAuth(`http://51.161.10.179:8080/api/boletas?${params}`);
}

// Nuevo: Crear producto (POST)
// data debe ser el objeto ProductoRequest (ver backend)
export async function crearProducto(data: any) {
  return fetchWithAuth("http://51.161.10.179:8080/productos/nuevo", {
    method: "POST",
    body: JSON.stringify(data),
    headers: { "Content-Type": "application/json" },
  });
}

// Nuevo: Actualizar producto por código de barras (PUT)
export async function actualizarProducto(codigoBarras: string, data: any) {
  return fetchWithAuth(`http://51.161.10.179:8080/productos/${codigoBarras}`, {
    method: "PUT",
    body: JSON.stringify(data),
    headers: { "Content-Type": "application/json" },
  });
}

// Nuevo: Eliminar producto por código de barras (DELETE)
export async function eliminarProducto(codigoBarras: string) {
  return fetchWithAuth(`http://51.161.10.179:8080/productos/${codigoBarras}`, {
    method: "DELETE"
  });
}

// Obtener stock protegido por token
export async function getStock() {
  return fetchWithAuth("http://51.161.10.179:8080/api/stock");
}

// Actualizar stock protegido por token
export async function actualizarStock(id: number, data: any) {
  return fetchWithAuth(`http://51.161.10.179:8080/api/stock/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
    headers: { "Content-Type": "application/json" },
  });
}

// Obtener resumen del dashboard protegido por JWT
export async function getDashboardResumen() {
  return fetchWithAuth("http://51.161.10.179:8080/api/dashboard/resumen");
}