import { useState } from "react";
import { FiUser, FiArrowRight, FiGrid } from "react-icons/fi";
import { createGame, type CreateGameResponse } from "../services/gameService";
import styles from "./CreateGame.module.css";

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
      setError("Nome é obrigatório");
      return;
    }
    setLoading(true);
    try {
      const response = await createGame({
        playerId: crypto.randomUUID(),
        playerName: name.trim(),
      });
      setCreatedGame(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  };

  return (
    <article className={styles.panel}>
      <header className={styles.header}>
        <span className={styles.headerIcon} aria-hidden>
          <FiGrid />
        </span>
        <div>
          <h2 className={styles.title}>Criar Partida</h2>
          <p className={styles.subtitle}>
            Configure a mesa e convide um oponente
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

      {loading && <p className={styles.status}>Criando partida…</p>}
      {error && <p className={styles.error}>{error}</p>}
      {createdGame && (
        <p className={styles.success}>
          Partida criada! ID: <strong>{createdGame.id}</strong> ·{" "}
          {createdGame.gameStatus}
        </p>
      )}

      <footer className={styles.footer}>
        <span className={styles.footerNote}>✓ 12 tentos finais</span>
        <button
          type="button"
          className={styles.submit}
          onClick={handleCreateGame}
          disabled={loading}
        >
          Criar Partida
          <FiArrowRight aria-hidden />
        </button>
      </footer>
    </article>
  );
}

export default CreateGame;
