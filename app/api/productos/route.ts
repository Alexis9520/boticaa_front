import { cookies } from "next/headers";

const BACKEND_URL = "http://localhost:8080";

export async function GET() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("session");
  if (!sessionCookie) {
    return new Response(JSON.stringify([]), { status: 401 });
  }
  const session = JSON.parse(sessionCookie.value);

  const res = await fetch(`${BACKEND_URL}/productos`, {
    headers: {
      "Authorization": `Bearer ${session.token}`,
    },
  });

  const data = await res.text();
  return new Response(data, { status: res.status });
}