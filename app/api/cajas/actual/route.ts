import { cookies } from "next/headers";

const BACKEND_URL = "http://localhost:8080";

export async function GET(request: Request) {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("session");
  if (!sessionCookie) {
    return new Response(JSON.stringify({ message: "Unauthorized" }), { status: 401 });
  }

  // Obtén el query param de la request (dniUsuario)
  const { searchParams } = new URL(request.url);
  const dniUsuario = searchParams.get("dniUsuario");
  if (!dniUsuario) {
    return new Response(JSON.stringify({ message: "dniUsuario requerido" }), { status: 400 });
  }

  const session = JSON.parse(sessionCookie.value);

  // Llama al backend con el Bearer token y el parámetro dniUsuario
  const res = await fetch(`${BACKEND_URL}/api/cajas/actual?dniUsuario=${dniUsuario}`, {
    headers: {
      "Authorization": `Bearer ${session.token}`,
    },
    // Si tu backend requiere cookies y no Bearer, deberías reenviar la cookie aquí
    // credentials: "include", // <-- SOLO si el backend acepta cookies
  });

  const data = await res.text();
  return new Response(data, { status: res.status });
}