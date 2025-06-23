"use server"

import { cookies } from "next/headers"

const BACKEND_URL = "http://localhost:8080"; 

export async function login(dni: string, password: string) {
  try {
    const res = await fetch(`${BACKEND_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dni, contrasena: password }), 
    });

    if (!res.ok) return false;

    const data = await res.json();

    // Ajusta esto según la respuesta de tu backend
    if (data.token) {
      const session = {
        user: data.usuario || {}, 
        token: data.token,
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      };

      const cookieStore = await cookies();
      cookieStore.set("session", JSON.stringify(session), {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24, // 24 horas
        path: "/",
      });

      if (typeof window !== "undefined") {
        localStorage.setItem("token", data.token);
      }
      return true;
    }

    return false;
  } catch (e) {
    return false;
  }
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete("session");
}

export async function getSession() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("session");

  if (!sessionCookie) {
    return null;
  }

  try {
    const session = JSON.parse(sessionCookie.value);

    if (new Date(session.expires) < new Date()) {
      return null;
    }

    return session;
  } catch (error) {
    return null;
  }
}

export async function checkSession() {
  const session = await getSession();

  if (!session) {
    throw new Error("No session found");
  }

  return session.user;
}