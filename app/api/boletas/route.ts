import { cookies } from "next/headers";

const BACKEND_URL = "http://localhost:8080";

export async function GET(request: Request) {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("session");
  if (!sessionCookie) {
    return new Response(JSON.stringify({ message: "Unauthorized" }), { status: 401 });
  }

  const session = JSON.parse(sessionCookie.value);

  const url = new URL(request.url);
  const params = url.searchParams.toString();
  const fetchUrl = `${BACKEND_URL}/api/boletas${params ? `?${params}` : ""}`;

  const res = await fetch(fetchUrl, {
    headers: {
      "Authorization": `Bearer ${session.token}`,
    },
  });

  const data = await res.text();
  return new Response(data, { status: res.status });
}