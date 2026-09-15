import { useState } from "react";
import { createGame, type CreateGameResponse } from "../services/gameService";

function CreateGame() {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdGame, setCreatedGame] = useState<CreateGameResponse | null>(
    null,
  );

  const handleCreateGame = async () => {
    setError(null);
    setCreatedGame(null);
    if (!name.trim()) {
      setError("Nome e obrigatorio");
      return;
    }
    setLoading(true);
    try {
      const response = await createGame({
        playerId: crypto.randomUUID(),
        playerName: name,
      });
      setCreatedGame(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  };
  return (
    <div>
      <h2>Criar partida</h2>

      <input type="text" onChange={(e) => setName(e.target.value)} />
      <p>Nome: {name}</p>
      {loading && <p>Criando partida...</p>}
      {error && <p>{error}</p>}
      {createdGame && (
        <p>
          Partida criada com sucesso! ID: {createdGame.id}
          Status: {createdGame.gameStatus}
        </p>
      )}
      <button onClick={handleCreateGame} disabled={loading}>
        Criar Partida
      </button>
    </div>
  );
}

export default CreateGame;
