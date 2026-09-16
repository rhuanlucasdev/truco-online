import { useState } from "react";
import {
  FiUser,
  FiArrowRight,
  FiGrid,
  FiCheck,
  FiGlobe,
} from "react-icons/fi";
import { createGame, type CreateGameResponse } from "../../../services/gameService";
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
            Configure o baralho e convide um oponente
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

      <fieldset className={`${styles.modes} ${styles.comingSoon}`} disabled>
        <legend className={styles.modesLegend}>
          Modo de Jogo & Regulamento
          <span className={styles.soonBadge}>Em breve</span>
        </legend>
        <div className={styles.modeGrid}>
          <button
            type="button"
            className={`${styles.modeOption} ${styles.modeActive}`}
            disabled
            aria-pressed
          >
            <span className={styles.modeTop}>
              <span>Paulista</span>
              <FiCheck aria-hidden />
            </span>
            <span className={styles.modeDesc}>
              Vira carta define manilhas (Fixas por rodada)
            </span>
          </button>
          <button type="button" className={styles.modeOption} disabled>
            <span className={styles.modeTop}>
              <span>Mineiro</span>
            </span>
            <span className={styles.modeDesc}>
              Manilhas fixas clássicas: 4, 7, Ás e 7 de Ouros
            </span>
          </button>
        </div>
      </fieldset>

      <div className={`${styles.toggleRow} ${styles.comingSoon}`}>
        <div className={styles.toggleCopy}>
          <FiGlobe aria-hidden />
          <div>
            <p className={styles.toggleTitle}>
              Sala Aberta ao Público
              <span className={styles.soonBadge}>Em breve</span>
            </p>
            <p className={styles.toggleHint}>Qualquer duelista pode entrar</p>
          </div>
        </div>
        <button
          type="button"
          className={`${styles.toggle} ${styles.toggleOn}`}
          disabled
          role="switch"
          aria-checked
          aria-label="Sala aberta ao público (em breve)"
        >
          <span className={styles.toggleThumb} />
        </button>
      </div>

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
