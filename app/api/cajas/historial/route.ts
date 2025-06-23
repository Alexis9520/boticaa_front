import { cookies } from "next/headers";

const BACKEND_URL = "http://localhost:8080";

export async function GET() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("session");
  if (!sessionCookie) {
    return new Response(JSON.stringify({ message: "Unauthorized" }), { status: 401 });
  }
  const session = JSON.parse(sessionCookie.value);

  const res = await fetch(`${BACKEND_URL}/api/cajas/historial`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${session.token}`,
      "Content-Type": "application/json",
    },
  });

  const data = await res.text();
  return new Response(data, { status: res.status, headers: { "Content-Type": "application/json" } });
}