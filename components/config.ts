// Archivo para centralizar la base URL y el helper apiUrl
export const BASE_URL = "http://51.161.10.179:8080";
// export const BASE_URL = "http://62.169.28.77:8080";
export function apiUrl(path: string) {
  if (path.startsWith("http")) return path;
  return `${BASE_URL}${path.startsWith("/") ? "" : "/"}${path}`;
}