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
        const card = {
          naipe: naipe,
          value: value,
        };
        baralho.push(card);
      }
    }
    return baralho;
  }

  shuffleDeck(deck: Carta[]) {
    deck.sort(() => Math.random() - 0.5);
    return deck;
  }

  dealCards(deck: Carta[]) {
    const player1Hand = deck.splice(0, 3);
    const player2Hand = deck.splice(0, 3);
    const vira = deck.splice(0, 1)[0];

    return {
      player1Hand,
      player2Hand,
      vira,
    };
  }

  getValues() {
    return this.values;
  }

  getManilha(vira: Carta) {
    const index = this.values.findIndex((v) => v == vira.value);

    const manilha =
      index == this.values.length - 1 ? this.values[0] : this.values[index + 1];

    return manilha;
  }

  compareCards(carta1: Carta, carta2: Carta, manilha: string) {
    // verifica se carta1 e manilha
    if (carta1.value == manilha) {
      if (carta2.value == manilha) {
        // compara os naipes
        const indexCarta1 = this.naipes.findIndex((n) => n == carta1.naipe);
        const indexCarta2 = this.naipes.findIndex((n) => n == carta2.naipe);

        if (indexCarta1 < indexCarta2) {
          return 1;
        } else {
          return 2;
        }
      }
      return 1;
    }

    if (carta2.value == manilha) {
      return 2;
    }

    const indexCarta1 = this.values.findIndex((v) => v == carta1.value);
    const indexCarta2 = this.values.findIndex((v) => v == carta2.value);

    if (indexCarta1 > indexCarta2) {
      return 1;
    }

    if (indexCarta2 > indexCarta1) {
      return 2;
    }

    return 0;
  }

  createTestDeck() {
    const baralho: Carta[] = [
      // Player 1
      { naipe: 'COPAS', value: '6' },
      { naipe: 'OUROS', value: '4' },
      { naipe: 'ESPADAS', value: 'A' },

      // Player 2
      { naipe: 'PAUS', value: '6' },
      { naipe: 'COPAS', value: '3' },
      { naipe: 'OUROS', value: 'K' },

      // Vira
      { naipe: 'PAUS', value: '5' },
    ];

    return baralho;
  }
}
