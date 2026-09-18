/**
 * Persistência leve da sessão pra rejoin após F5 / “Continuar partida”.
 */
import type { PlayerSession } from "../types/session";

const KEY = "truco.session";

export function saveSession(session: PlayerSession) {
  try {
    localStorage.setItem(KEY, JSON.stringify(session));
  } catch {
    // storage cheio / privado
  }
}

export function loadSession(): PlayerSession | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as PlayerSession;
    if (!data?.gameId || !data?.playerId || !data?.playerName) return null;
    return data;
  } catch {
    return null;
  }
}

export function clearSession() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}
