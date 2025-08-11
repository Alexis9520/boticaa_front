// Archivo para centralizar la base URL y el helper apiUrl
export const BASE_URL = "http://localhost:8080";

export function apiUrl(path: string) {
  if (path.startsWith("http")) return path;
  return `${BASE_URL}${path.startsWith("/") ? "" : "/"}${path}`;
}