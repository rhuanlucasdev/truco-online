import { useState } from "react";
import { FiUser, FiHash, FiLogIn, FiKey } from "react-icons/fi";
import { joinGame, type Game } from "../services/gameService";
import styles from "./JoinGame.module.css";

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
      setError("Id da partida e nome do jogador são obrigatórios");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const playerId = crypto.randomUUID();
      setMyPlayerId(playerId);
      const response = await joinGame(gameId.trim(), {
        playerId,
        playerName: playerName.trim(),
      });
      setJoinedGame(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  };

  const myHand = joinedGame?.playersList.find(
    (p) => p.playerId === myPlayerId,
  )?.hand;

  return (
    <article className={styles.panel}>
      <header className={styles.header}>
        <span className={styles.headerIcon} aria-hidden>
          <FiKey />
        </span>
        <div>
          <h2 className={styles.title}>Entrar na Partida</h2>
          <p className={styles.subtitle}>
            Digite o código enviado pelo seu parceiro
          </p>
        </div>
      </header>

      <label className={styles.field}>
        <span className={styles.labelRow}>
          <span>ID da Partida</span>
          <span className={styles.labelHint}>Código da mesa</span>
        </span>
        <span className={styles.inputWrap}>
          <FiHash aria-hidden />
          <input
            type="text"
            value={gameId}
            placeholder="Ex: 42"
            onChange={(e) => setGameId(e.target.value)}
            autoComplete="off"
          />
        </span>
      </label>

      <label className={styles.field}>
        <span className={styles.labelRow}>
          <span>Nome do Jogador</span>
        </span>
        <span className={styles.inputWrap}>
          <FiUser aria-hidden />
          <input
            type="text"
            value={playerName}
            placeholder="Digite seu nome"
            onChange={(e) => setPlayerName(e.target.value)}
            autoComplete="nickname"
          />
        </span>
      </label>

      {loading && <p className={styles.status}>Entrando na partida…</p>}
      {error && <p className={styles.error}>{error}</p>}
      {joinedGame && (
        <div className={styles.successBox}>
          <p>
            Entrou! ID: <strong>{joinedGame.id}</strong> ·{" "}
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
          {myHand && myHand.length > 0 && (
            <p>
              Minhas cartas:{" "}
              {myHand.map((c) => `${c.value} de ${c.naipe}`).join(", ")}
            </p>
          )}
        </div>
      )}

      <footer className={styles.footer}>
        <span className={styles.footerNote}>Pronto para duelizar</span>
        <button
          type="button"
          className={styles.submit}
          onClick={handleJoinGame}
          disabled={loading}
        >
          Entrar na Partida
          <FiLogIn aria-hidden />
        </button>
      </footer>
    </article>
  );
};

export default JoinGame;
