const BACKEND_URL = "http://51.161.10.179:8080"; // Cambia esto por la IP real de tu VPS o dominio

// LOGIN: Guarda el token y usuario en localStorage si es exitoso
export async function login(dni: string, password: string) {
  try {
    const res = await fetch(`${BACKEND_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dni, contrasena: password }),
    });

    if (!res.ok) return false;

    const data = await res.json();

    if (data.token) {
      if (typeof window !== "undefined") {
        localStorage.setItem("token", data.token);
        if (data.usuario) {
          localStorage.setItem("user", JSON.stringify(data.usuario));
        }
      }
      return true;
    }

    return false;
  } catch (e) {
    return false;
  }
}

// LOGOUT: Borra el token y usuario del localStorage
export function logout() {
  if (typeof window !== "undefined") {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  }
}

// OBTENER TOKEN
export function getToken() {
  if (typeof window !== "undefined") {
    return localStorage.getItem("token");
  }
  return null;
}

// OBTENER USUARIO
export function getUser() {
  if (typeof window !== "undefined") {
    const u = localStorage.getItem("user");
    return u ? JSON.parse(u) : null;
  }
  return null;
}

// CHECK SESSION: Devuelve true si hay token
export function checkSession() {
  if (typeof window !== "undefined") {
    return !!localStorage.getItem("token");
  }
  return false;
}
