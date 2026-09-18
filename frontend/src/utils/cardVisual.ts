/**
 * Mapeia naipe/value do backend (PAUS, COPAS…) para o PlayingCard visual.
 */
import type { Rank, Suit } from "../components/cards/PlayingCard/PlayingCard";
import type { Carta } from "../services/gameService";

const NAIPE_TO_SUIT: Record<string, Suit> = {
  PAUS: "clubs",
  COPAS: "hearts",
  ESPADAS: "spades",
  OUROS: "diamonds",
};

const VALID_RANKS = new Set<Rank>([
  "A",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "J",
  "Q",
  "K",
]);

export function cartaToVisual(card: Carta): { rank: Rank; suit: Suit } | null {
  const suit = NAIPE_TO_SUIT[card.naipe];
  const rank = card.value as Rank;
  if (!suit || !VALID_RANKS.has(rank)) return null;
  return { rank, suit };
}

export function naipeLabel(naipe: string): string {
  const map: Record<string, string> = {
    PAUS: "Paus",
    COPAS: "Copas",
    ESPADAS: "Espadas",
    OUROS: "Ouros",
  };
  return map[naipe] ?? naipe;
}
