import { cookies } from "next/headers";
const BACKEND_URL = "http://localhost:8080";

export async function GET() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("session");
  if (!sessionCookie) {
    return new Response(JSON.stringify({ message: "Unauthorized" }), { status: 401 });
  }
  const session = JSON.parse(sessionCookie.value);

  const res = await fetch(`${BACKEND_URL}/api/ventas`, {
    headers: {
      "Authorization": `Bearer ${session.token}`,
    },
    // credentials: "include", // Solo si tu backend lo requiere (normalmente con cookies)
  });
  const data = await res.text();
  return new Response(data, { status: res.status });
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("session");
  if (!sessionCookie) {
    return new Response(JSON.stringify({ message: "Unauthorized" }), { status: 401 });
  }
  const session = JSON.parse(sessionCookie.value);

  const body = await request.text();

  const res = await fetch(`${BACKEND_URL}/api/ventas`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${session.token}`,
      "Content-Type": "application/json",
    },
    body,
  });

  const data = await res.text();
  return new Response(data, { status: res.status });
}