/**
 * Formulario: entrar / reentrar (PATCH /game/:id).
 */
import { useEffect, useState } from "react";
import { FiUser, FiHash, FiLogIn, FiKey } from "react-icons/fi";
import { joinGame, type GameView } from "../../../services/gameService";
import type { PlayerSession } from "../../../types/session";
import { saveSession } from "../../../utils/sessionStorage";
import styles from "./JoinGame.module.css";

type JoinGameProps = {
  initialGameId?: string;
  onJoined: (session: PlayerSession, game: GameView) => void;
};

type TeamId = 0 | 1;

function JoinGame({ initialGameId = "", onJoined }: JoinGameProps) {
  const [gameId, setGameId] = useState(initialGameId);
  const [playerName, setPlayerName] = useState("");
  const [teamId, setTeamId] = useState<TeamId>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialGameId) setGameId(initialGameId);
  }, [initialGameId]);

  async function handleSubmit() {
    if (!gameId.trim() || !playerName.trim()) {
      setError("Id da partida e nome do jogador são obrigatórios");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const playerId = crypto.randomUUID();
      const response = await joinGame(gameId.trim(), {
        playerId,
        playerName: playerName.trim(),
        teamId,
      });

      const session = {
        gameId: response.id,
        playerId,
        playerName: playerName.trim(),
      };
      saveSession(session);
      onJoined(session, response);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  }

  return (
    <article className={styles.panel}>
      <header className={styles.header}>
        <span className={styles.headerIcon} aria-hidden>
          <FiKey />
        </span>
        <div>
          <h2 className={styles.title}>Entrar na Partida</h2>
          <p className={styles.subtitle}>
            Digite o código e escolha seu time
          </p>
        </div>
      </header>

      <label className={styles.field}>
        <span className={styles.labelRow}>
          <span>ID da Partida</span>
          <span className={styles.labelHint}>Código numérico</span>
        </span>
        <span className={`${styles.inputWrap} ${styles.inputId}`}>
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

      <fieldset className={styles.field}>
        <span className={styles.labelRow}>
          <span>Seu time</span>
        </span>
        <div className={styles.modeRow} role="group" aria-label="Time">
          <button
            type="button"
            className={`${styles.modeBtn} ${teamId === 0 ? styles.modeBtnActive : ""}`}
            onClick={() => setTeamId(0)}
          >
            Time 1
          </button>
          <button
            type="button"
            className={`${styles.modeBtn} ${teamId === 1 ? styles.modeBtnActive : ""}`}
            onClick={() => setTeamId(1)}
          >
            Time 2
          </button>
        </div>
      </fieldset>

      {loading && <p className={styles.status}>Entrando na partida…</p>}
      {error && <p className={styles.error}>{error}</p>}

      <footer className={styles.footer}>
        <button
          type="button"
          className={styles.submit}
          onClick={handleSubmit}
          disabled={loading}
        >
          Entrar na Partida
          <FiLogIn aria-hidden />
        </button>
      </footer>
    </article>
  );
}

export default JoinGame;
