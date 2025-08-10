import { apiUrl } from "../components/config"; 

export async function login(dni: string, password: string): Promise<{ ok: boolean, error?: string }> {
  const res = await fetch(apiUrl("/auth/login"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ dni, contrasena: password }),
  });

  if (!res.ok) {
    let backendMsg = "";
    try {
      const data = await res.json();
      backendMsg = data.message || JSON.stringify(data) || "Error de autenticación";
    } catch {
      try {
        backendMsg = await res.text();
      } catch {
        backendMsg = "Error de autenticación";
      }
    }
    return { ok: false, error: backendMsg };
  }

  const data = await res.json();
  if (data.token) {
    if (typeof window !== "undefined") {
      localStorage.setItem("token", data.token);

      // Obtener usuario y guardar en localStorage
      const userRes = await fetch(apiUrl("/usuarios/me"), {
        headers: {
          Authorization: `Bearer ${data.token}`,
        },
      });
      if (userRes.ok) {
        const usuario = await userRes.json();
        localStorage.setItem("usuario", JSON.stringify(usuario));
      }
    }
    return { ok: true };
  }
  return { ok: false, error: "Token no recibido" };
}

export async function checkSession() {
  if (typeof window === "undefined") throw new Error("No token (SSR)");
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No token");

  const res = await fetch(apiUrl("/usuarios/me"), {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const contentType = res.headers.get("content-type");
  if (!res.ok) throw new Error("Sesión inválida");
  if (contentType && contentType.indexOf("application/json") !== -1) {
    return res.json();
  } else {
    throw new Error("Respuesta inválida del backend");
  }
}

export function logout() {
  if (typeof window !== "undefined") {
    localStorage.removeItem("token");
    localStorage.removeItem("usuario");
  }
}