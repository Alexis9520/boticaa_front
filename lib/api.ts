import { apiUrl } from "../components/config"; 

type ToastFn = (opts: { title: string; description: string; variant?: "destructive" | "default" }) => void;

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

    if (res.status === 403 && lowerMsg.includes("cerrar tu caja")) {
      if (toastFn) {
        toastFn({
          title: "Atención",
          description: backendMsg,
          variant: "destructive",
        });
      }
      if (typeof window !== "undefined" && window.location.pathname !== "/dashboard/caja") {
        window.location.href = "/dashboard/caja";
      }
      return null;
    }

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

export async function getProductos() {
  return fetchWithAuth(apiUrl("/productos"));
}

export async function getHistorial() {
  return fetchWithAuth(apiUrl("/api/cajas/historial"));
}

export async function agregarMovimiento(data: any) {
  return fetchWithAuth(apiUrl("/api/cajas/movimiento"), {
    method: "POST",
    body: JSON.stringify(data),
    headers: { "Content-Type": "application/json" },
  });
}

export async function fetchWithToken() {
  const usuarioStr = typeof window !== "undefined" ? localStorage.getItem("usuario") : null;
  const usuario = usuarioStr ? JSON.parse(usuarioStr) : {};
  return fetchWithAuth(apiUrl(`/api/cajas/actual?dniUsuario=${usuario.dni}`));
}

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
  return fetchWithAuth(apiUrl(`/api/boletas?${params}`));
}

export async function crearProducto(data: any) {
  return fetchWithAuth(apiUrl("/productos/nuevo"), {
    method: "POST",
    body: JSON.stringify(data),
    headers: { "Content-Type": "application/json" },
  });
}

export async function actualizarProducto(codigoBarras: string, data: any) {
  return fetchWithAuth(apiUrl(`/productos/${codigoBarras}`), {
    method: "PUT",
    body: JSON.stringify(data),
    headers: { "Content-Type": "application/json" },
  });
}

export async function eliminarProducto(codigoBarras: string) {
  return fetchWithAuth(apiUrl(`/productos/${codigoBarras}`), {
    method: "DELETE"
  });
}

export async function getStock() {
  return fetchWithAuth(apiUrl("/api/stock"));
}

export async function actualizarStock(id: number, data: any) {
  return fetchWithAuth(apiUrl(`/api/stock/${id}`), {
    method: "PUT",
    body: JSON.stringify(data),
    headers: { "Content-Type": "application/json" },
  });
}

export async function getDashboardResumen() {
  return fetchWithAuth(apiUrl("/api/dashboard/resumen"));
}