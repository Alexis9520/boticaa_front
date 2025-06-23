import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth" // Asegúrate de tener este método en tu proyecto

export async function GET() {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ message: "No autenticado" }, { status: 401 })
  }
  return NextResponse.json({ user: session.user })
}