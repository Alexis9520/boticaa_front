import { cookies } from "next/headers";
const BACKEND_URL = "http://localhost:8080";

export async function GET() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("session");
  if (!sessionCookie) {
    return new Response(JSON.stringify({ message: "Unauthorized" }), { status: 401 });
  }
  const session = JSON.parse(sessionCookie.value);

  const dni = session.user.dni;
  if (!dni) {
    return new Response(JSON.stringify({ message: "DNI no encontrado en sesión" }), { status: 400 });
  }

  const res = await fetch(`${BACKEND_URL}/usuarios/dni/${dni}`, {
    headers: {
      "Authorization": `Bearer ${session.token}`,
    },
  });
  const data = await res.text();
  return new Response(data, { status: res.status });
}