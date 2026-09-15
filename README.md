# Backend do jogo de truco online com websockets

## Regras:

- A principio:
- 2 players,
- Cada player recebe 3 cartas,
- tem uma vira
- tem uma manilha
- Partida inicia valendo 1 ponto,
- O objetivo e chegar a 12 pontos,
- Cada mao possui 3 rodadas,
- quem ganhar 2 rodadas ganha a mao!

## Integracao frontend (REST) — status

Camadas atuais no frontend:

- `services/api.ts` — cliente HTTP generico
- `services/gameService.ts` — `createGame`, `joinGame`, `playCard`
- UI: `CreateGame`, `JoinGame` (play ainda sem tela de mesa)

## Dividas tecnicas (proximos tickets)

Nao misturar isso como gambiarra na UI enquanto o contrato nao estiver estavel:

1. **Sem `GET /game/:id`** — o player 1 nao descobre sozinho que o player 2 entrou; falta polling ou WebSocket para ambos irem a mesa.
2. **`playerId` some no reload** — hoje vive so em state React; falta persistir (ex. localStorage) se o jogador precisar voltar a partida.
3. **Retorno de `playCard` inconsistente** — as vezes `currentRound`, as vezes vencedor/`null`; frontend e backend precisam de um contrato unico.
4. **Resposta com as duas maos** — ok em desenvolvimento; em multiplayer real o backend deve filtrar a mao do oponente.
5. **Sem rota de mesa** — create/join ainda nao navegam para a tela de jogo; `playCard` no servico ainda sem UI dedicada.
6. **WebSockets** — o README aponta realtime; a integracao atual e REST. Realtime fica para depois que o fluxo create → join → play estiver claro.
