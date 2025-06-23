import { cookies } from "next/headers";

const BACKEND_URL = "http://localhost:8080";

// Editar usuario
export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("session");
  if (!sessionCookie) {
    return new Response("No autenticado", { status: 401 });
  }
  const session = JSON.parse(sessionCookie.value);
  const body = await req.json();

  const res = await fetch(`${BACKEND_URL}/usuarios/${params.id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${session.token}`,
    },
    body: JSON.stringify(body),
  });

  const data = await res.text();
  return new Response(data, { status: res.status });
}

// Eliminar usuario
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("session");
  if (!sessionCookie) {
    return new Response("No autenticado", { status: 401 });
  }
  const session = JSON.parse(sessionCookie.value);

  const res = await fetch(`${BACKEND_URL}/usuarios/${params.id}`, {
    method: "DELETE",
    headers: {
      "Authorization": `Bearer ${session.token}`,
    },
  });

  const data = await res.text();
  return new Response(data, { status: res.status });
}

