/**
 * Cliente HTTP genérico.
 * Único lugar que fala com fetch — UI e gameService não conhecem URL/método bruto.
 */
const base = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export async function request<T>(
  method: string,
  path: string,
  body?: unknown,
): Promise<T> {
  const response = await fetch(`${base}${path}`, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    let detail = `HTTP ${response.status}`;
    try {
      const data = (await response.json()) as { message?: string | string[] };
      if (typeof data.message === "string") detail = data.message;
      else if (Array.isArray(data.message)) detail = data.message.join(", ");
    } catch {
      // corpo não-JSON — mantém status
    }
    throw new Error(detail);
  }

  return response.json() as Promise<T>;
}
