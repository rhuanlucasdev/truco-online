/**
 * Formulario: criar partida (POST /game).
 * Escolhe 2/4 jogadores e o time inicial.
 */
import { useState } from "react";
import { FiUser, FiArrowRight, FiGrid, FiUsers } from "react-icons/fi";
import { createGame } from "../../../services/gameService";
import type { WaitingRoomSession } from "../../../types/session";
import { saveSession } from "../../../utils/sessionStorage";
import styles from "./CreateGame.module.css";

type CreateGameProps = {
  onCreated: (session: WaitingRoomSession) => void;
};

type MaxPlayers = 2 | 4;
type TeamId = 0 | 1;

function CreateGame({ onCreated }: CreateGameProps) {
  const [name, setName] = useState("");
  const [maxPlayers, setMaxPlayers] = useState<MaxPlayers>(2);
  const [teamId, setTeamId] = useState<TeamId>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setError(null);

    if (!name.trim()) {
      setError("Nome é obrigatório");
      return;
    }

    setLoading(true);
    try {
      const playerId = crypto.randomUUID();
      const playerName = name.trim();
      const response = await createGame({
        playerId,
        playerName,
        maxPlayers,
        teamId,
      });

      const session = {
        gameId: response.id,
        playerName,
        playerId,
      };
      saveSession(session);
      onCreated(session);
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
          <FiGrid />
        </span>
        <div>
          <h2 className={styles.title}>Criar Partida</h2>
          <p className={styles.subtitle}>
            Escolha o tamanho da mesa, seu time e convide os jogadores
          </p>
        </div>
      </header>

      <label className={styles.field}>
        <span className={styles.labelRow}>
          <span>Nome do Jogador</span>
          <span className={styles.labelHint}>Sua identidade na mesa</span>
        </span>
        <span className={styles.inputWrap}>
          <FiUser aria-hidden />
          <input
            type="text"
            value={name}
            placeholder="Seu nome"
            onChange={(e) => setName(e.target.value)}
            autoComplete="nickname"
          />
        </span>
      </label>

      <fieldset className={styles.field}>
        <span className={styles.labelRow}>
          <span>Jogadores na mesa</span>
          <span className={styles.labelHint}>Somente par</span>
        </span>
        <div className={styles.modeRow} role="group" aria-label="Tamanho da mesa">
          <button
            type="button"
            className={`${styles.modeBtn} ${maxPlayers === 2 ? styles.modeBtnActive : ""}`}
            onClick={() => setMaxPlayers(2)}
          >
            <FiUsers aria-hidden />
            2 · 1v1
          </button>
          <button
            type="button"
            className={`${styles.modeBtn} ${maxPlayers === 4 ? styles.modeBtnActive : ""}`}
            onClick={() => setMaxPlayers(4)}
          >
            <FiUsers aria-hidden />
            4 · 2v2
          </button>
        </div>
      </fieldset>

      <fieldset className={styles.field}>
        <span className={styles.labelRow}>
          <span>Seu time</span>
          <span className={styles.labelHint}>
            Cap. {maxPlayers / 2} por time
          </span>
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

      {error && <p className={styles.error}>{error}</p>}

      <footer className={styles.footer}>
        <span className={styles.footerNote}>✓ 12 tentos finais</span>
        <button
          type="button"
          className={styles.submit}
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? "Criando Partida" : "Criar partida"}
          <FiArrowRight aria-hidden />
        </button>
      </footer>
    </article>
  );
}

export default CreateGame;
