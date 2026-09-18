import { Injectable } from '@nestjs/common';

export interface Carta {
  naipe: string;
  value: string;
}

@Injectable()
export class DeckService {
  private readonly naipes = ['PAUS', 'COPAS', 'ESPADAS', 'OUROS'];
  private readonly values = ['4', '5', '6', '7', 'Q', 'J', 'K', 'A', '2', '3'];

  createDeck() {
    const baralho: Carta[] = [];
    for (const naipe of this.naipes) {
      for (const value of this.values) {
        baralho.push({ naipe, value });
      }
    }
    return baralho;
  }

  shuffleDeck(deck: Carta[]) {
    deck.sort(() => Math.random() - 0.5);
    return deck;
  }

  /**
   * Distribui 3 cartas para cada jogador + 1 vira.
   * playerCount: 2 ou 4.
   */
  dealCards(deck: Carta[], playerCount: number) {
    const hands: Carta[][] = [];
    for (let i = 0; i < playerCount; i++) {
      hands.push(deck.splice(0, 3));
    }
    const vira = deck.splice(0, 1)[0];
    return { hands, vira };
  }

  getValues() {
    return this.values;
  }

  getManilha(vira: Carta) {
    const index = this.values.findIndex((v) => v == vira.value);
    return index == this.values.length - 1
      ? this.values[0]
      : this.values[index + 1];
  }

  /**
   * Compara duas cartas.
   * @returns 1 se carta1 vence, 2 se carta2 vence, 0 se empate.
   */
  compareCards(carta1: Carta, carta2: Carta, manilha: string) {
    if (carta1.value == manilha) {
      if (carta2.value == manilha) {
        const indexCarta1 = this.naipes.findIndex((n) => n == carta1.naipe);
        const indexCarta2 = this.naipes.findIndex((n) => n == carta2.naipe);
        if (indexCarta1 < indexCarta2) return 1;
        return 2;
      }
      return 1;
    }

    if (carta2.value == manilha) return 2;

    const indexCarta1 = this.values.findIndex((v) => v == carta1.value);
    const indexCarta2 = this.values.findIndex((v) => v == carta2.value);

    if (indexCarta1 > indexCarta2) return 1;
    if (indexCarta2 > indexCarta1) return 2;
    return 0;
  }

  createTestDeck() {
    return [
      { naipe: 'COPAS', value: '6' },
      { naipe: 'OUROS', value: '4' },
      { naipe: 'ESPADAS', value: 'A' },
      { naipe: 'PAUS', value: '6' },
      { naipe: 'COPAS', value: '3' },
      { naipe: 'OUROS', value: 'K' },
      { naipe: 'PAUS', value: '5' },
    ] as Carta[];
  }
}
