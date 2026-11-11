import { auth } from "./firebase";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://localhost:4000/api/v1").replace(/\/$/, "");

export async function backendRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");
  const currentUser = auth.currentUser;
  if (currentUser) headers.set("Authorization", `Bearer ${await currentUser.getIdToken()}`);

  const response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
  if (response.status === 204) return undefined as T;
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = typeof data?.message === "string" ? data.message : "Сервер сұрауды орындай алмады.";
    throw new Error(message);
  }
  return data as T;
}
