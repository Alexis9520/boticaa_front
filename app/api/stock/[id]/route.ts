import { cookies } from "next/headers";
const BACKEND_URL = "http://localhost:8080";

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("session");
  if (!sessionCookie) {
    return new Response(JSON.stringify({ message: "Unauthorized" }), { status: 401 });
  }
  const session = JSON.parse(sessionCookie.value);

  const body = await request.text();

  const res = await fetch(`${BACKEND_URL}/api/stock/${params.id}`, {
    method: "PUT",
    headers: {
      "Authorization": `Bearer ${session.token}`,
      "Content-Type": "application/json",
    },
    body,
  });

  const data = await res.text();
  return new Response(data, { status: res.status });
}