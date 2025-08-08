type ToastFn = (opts: { title: string; description: string; variant?: "destructive" | "default" }) => void;

// Ahora acepta un toastFn opcional
export async function fetchWithAuth(
  url: string,
  options: RequestInit = {},
  toastFn?: ToastFn
) {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  if (!token) {
    if (toastFn) {
      toastFn({
        title: "Sesión expirada",
        description: "Por favor inicia sesión nuevamente.",
        variant: "destructive",
      });
    }
    window.location.href = "/login";
    throw new Error("No token");
  }
  const headers = {
    ...(options.headers || {}),
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
  const res = await fetch(url, { ...options, headers });

  if (!res.ok) {
    let errorText = await res.text();
    let backendMsg = "";
    try {
      const json = JSON.parse(errorText);
      backendMsg = json.message || errorText;
    } catch {
      backendMsg = errorText;
    }

    const lowerMsg = backendMsg.toLowerCase();

    // 1. Caso: CERRAR TU CAJA (aunque incluya "fuera de horario" o similar)
    if (res.status === 403 && lowerMsg.includes("cerrar tu caja")) {
      if (toastFn) {
        toastFn({
          title: "Atención",
          description: backendMsg,
          variant: "destructive",
        });
      }
      // Solo redirige si NO estás ya en /dashboard/caja
      if (typeof window !== "undefined" && window.location.pathname !== "/dashboard/caja") {
        window.location.href = "/dashboard/caja";
      }
      // NO borres el token ni redirijas al login, solo retorna null para que la UI lo maneje
      return null;
    }

    // 2. Caso: FUERA DE HORARIO SIN "cerrar tu caja"
    if (
      res.status === 403 &&
      (lowerMsg.includes("fuera de tu horario") || lowerMsg.includes("fuera de horario"))
    ) {
      if (toastFn) {
        toastFn({
          title: "Acceso fuera de turno",
          description: backendMsg,
          variant: "destructive",
        });
      }
      localStorage.removeItem("token");
      localStorage.removeItem("usuario");
      window.location.href = "/login";
      throw new Error(backendMsg);
    }

    // 3. Caso: 401 (token inválido)
    if (res.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("usuario");
      if (toastFn) {
        toastFn({
          title: "Sesión expirada",
          description: "Por seguridad, inicia sesión nuevamente.",
          variant: "destructive",
        });
      }
      window.location.href = "/login";
      throw new Error("Sesión expirada");
    }

    // 4. Otros errores
    if (toastFn) {
      toastFn({
        title: "Error",
        description: backendMsg || `Error en la petición: ${res.status}`,
        variant: "destructive",
      });
    }
    throw new Error(backendMsg || `Error en la petición: ${res.status}`);
  }

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
  return fetchWithAuth("http://62.169.28.77:8080/productos");
}

// Obtener historial de cajas
export async function getHistorial() {
  return fetchWithAuth("http://62.169.28.77:8080/api/cajas/historial");
}

// Agregar movimiento a caja
export async function agregarMovimiento(data: any) {
  return fetchWithAuth("http://62.169.28.77:8080/api/cajas/movimiento", {
    method: "POST",
    body: JSON.stringify(data),
    headers: { "Content-Type": "application/json" },
  });
}

// Obtener caja actual con token y usuario
export async function fetchWithToken() {
  const usuarioStr = typeof window !== "undefined" ? localStorage.getItem("usuario") : null;
  const usuario = usuarioStr ? JSON.parse(usuarioStr) : {};
  return fetchWithAuth(`http://62.169.28.77:8080/api/cajas/actual?dniUsuario=${usuario.dni}`);
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
  return fetchWithAuth(`http://62.169.28.77:8080/api/boletas?${params}`);
}

// Nuevo: Crear producto (POST)
// data debe ser el objeto ProductoRequest (ver backend)
export async function crearProducto(data: any) {
  return fetchWithAuth("http://62.169.28.77:8080/productos/nuevo", {
    method: "POST",
    body: JSON.stringify(data),
    headers: { "Content-Type": "application/json" },
  });
}

// Nuevo: Actualizar producto por código de barras (PUT)
export async function actualizarProducto(codigoBarras: string, data: any) {
  return fetchWithAuth(`http://62.169.28.77:8080/productos/${codigoBarras}`, {
    method: "PUT",
    body: JSON.stringify(data),
    headers: { "Content-Type": "application/json" },
  });
}

// Nuevo: Eliminar producto por código de barras (DELETE)
export async function eliminarProducto(codigoBarras: string) {
  return fetchWithAuth(`http://62.169.28.77:8080/productos/${codigoBarras}`, {
    method: "DELETE"
  });
}

// Obtener stock protegido por token
export async function getStock() {
  return fetchWithAuth("http://62.169.28.77:8080/api/stock");
}

// Actualizar stock protegido por token
export async function actualizarStock(id: number, data: any) {
  return fetchWithAuth(`http://62.169.28.77:8080/api/stock/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
    headers: { "Content-Type": "application/json" },
  });
}

// Obtener resumen del dashboard protegido por JWT
export async function getDashboardResumen() {
  return fetchWithAuth("http://62.169.28.77:8080/api/dashboard/resumen");
}