export async function login(dni: string, password: string): Promise<boolean> {
  const res = await fetch("http://51.161.10.179:8080/auth/login", {
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
      const userRes = await fetch("http://51.161.10.179:8080/usuarios/me", {
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
}

export async function checkSession() {
  if (typeof window === "undefined") throw new Error("No token (SSR)");
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No token");

  const res = await fetch("http://51.161.10.179:8080/usuarios/me", {
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
}

export function logout() {
  if (typeof window !== "undefined") {
    localStorage.removeItem("token");
    localStorage.removeItem("usuario");
  }
}