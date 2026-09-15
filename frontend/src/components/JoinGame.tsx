import { useState } from "react";
import { joinGame, type Game } from "../services/gameService";

const JoinGame = () => {
  const [gameId, setGameId] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [joinedGame, setJoinedGame] = useState<Game | null>(null);
  const [myPlayerId, setMyPlayerId] = useState<string | null>(null);

  const handleJoinGame = async () => {
    setJoinedGame(null);
    if (!gameId.trim() || !playerName.trim()) {
      setError("Id da partida e nome do jogador sao obrigatorios");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const playerId = crypto.randomUUID();
      setMyPlayerId(playerId);
      const response = await joinGame(gameId.trim(), {
        playerId: playerId,
        playerName: playerName.trim(),
      });
      setJoinedGame(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Entrar em uma partida</h2>
      <label htmlFor="gameId">ID da partida</label>
      <input
        type="text"
        name="gameId"
        id="gameId"
        value={gameId}
        onChange={(e) => setGameId(e.target.value)}
      />
      <label htmlFor="playerName">Nome do jogador</label>
      <input
        type="text"
        name="playerName"
        id="playerName"
        value={playerName}
        onChange={(e) => setPlayerName(e.target.value)}
      />
      <button onClick={handleJoinGame} disabled={loading}>
        Entrar na partida {loading && <span>Carregando...</span>}
      </button>
      {error && <span>{error}</span>}
      {joinedGame && (
        <div>
          <p>
            Partida encontrada com sucesso! ID: {joinedGame.id} Status:{" "}
            {joinedGame.gameStatus}
          </p>
          <p>
            Jogadores:{" "}
            {joinedGame.playersList.map((player) => player.name).join(", ")}
          </p>
          {joinedGame.vira && (
            <p>
              Vira: {joinedGame.vira.value} de {joinedGame.vira.naipe}
            </p>
          )}
          {myPlayerId && (
            <p>
              Minhas Cartas:{" "}
              {joinedGame.playersList
                .find((p) => p.playerId === myPlayerId)
                ?.hand.map((c) => `${c.value} de ${c.naipe}`)
                .join(", ")}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default JoinGame;
