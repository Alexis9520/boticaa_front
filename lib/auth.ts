import { buildApiUrl, endpoints } from './config';

/**
 * Login user with DNI and password
 */
export async function login(dni: string, password: string): Promise<boolean> {
  try {
    const res = await fetch(buildApiUrl(endpoints.auth.login), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dni, contrasena: password }),
    });

    if (!res.ok) return false;

    const data = await res.json();
    if (data.token) {
      if (typeof window !== "undefined") {
        localStorage.setItem("token", data.token);

        // Obtener usuario y guardar en localStorage
        const userRes = await fetch(buildApiUrl(endpoints.usuarios.me), {
          headers: {
            Authorization: `Bearer ${data.token}`,
          },
        });
        if (userRes.ok) {
          const usuario = await userRes.json();
          localStorage.setItem("usuario", JSON.stringify(usuario));
        }
      }
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error durante el login:', error);
    return false;
  }
}

/**
 * Check if current session is valid
 */
export async function checkSession() {
  if (typeof window === "undefined") throw new Error("No token (SSR)");
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No token");

  try {
    const res = await fetch(buildApiUrl(endpoints.usuarios.me), {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    // Verifica que la respuesta sea JSON y válida
    const contentType = res.headers.get("content-type");
    if (!res.ok) throw new Error("Sesión inválida");
    if (contentType && contentType.indexOf("application/json") !== -1) {
      return res.json();
    } else {
      throw new Error("Respuesta inválida del backend");
    }
  } catch (error) {
    console.error('Error verificando sesión:', error);
    throw error;
  }
}

/**
 * Logout user and clear stored data
 */
export function logout() {
  if (typeof window !== "undefined") {
    localStorage.removeItem("token");
    localStorage.removeItem("usuario");
  }
}