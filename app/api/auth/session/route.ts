import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("session");
  if (!sessionCookie) {
    return NextResponse.json({ message: "No autenticado" }, { status: 401 });
  }
  const session = JSON.parse(sessionCookie.value);

  if (!session.user) {
    return NextResponse.json({ message: "Usuario no encontrado en sesión" }, { status: 400 });
  }
  return NextResponse.json({ usuario: session.user });
}