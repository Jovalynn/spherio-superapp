// lib/apiBase.ts
export function getApiBase() {
  // If explicitly set, always use it.
  const envBase =
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    process.env.API_BASE_URL ||
    "";

  if (envBase) return envBase.replace(/\/+$/, "");

  // On the server (SSR), relative fetch("/api/...") is invalid.
  // In Docker Compose, "nginx" is a resolvable service name.
  if (typeof window === "undefined") return "http://nginx";

  // In the browser, relative is fine (goes through nginx at /api)
  return "";
}

export function apiUrl(path: string) {
  const base = getApiBase();
  if (!path.startsWith("/")) path = "/" + path;
  return base ? `${base}${path}` : path;
}

