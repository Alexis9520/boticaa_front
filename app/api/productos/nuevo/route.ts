import { cookies } from "next/headers";

const BACKEND_URL = "http://localhost:8080";

export async function POST(req: Request) {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("session");
  if (!sessionCookie) {
    return new Response("No autenticado", { status: 401 });
  }
  const session = JSON.parse(sessionCookie.value);

  const body = await req.json();

  const res = await fetch(`${BACKEND_URL}/productos/nuevo`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${session.token}`,
    },
    body: JSON.stringify(body),
  });

  const data = await res.text();
  return new Response(data, { status: res.status });
}