/**
 * Painel Create | Join — âncora #acesso usada pelos CTAs do hero.
 */
import CreateGame from "../CreateGame";
import JoinGame from "../JoinGame";
import type { PlayerSession } from "../../../types/session";
import type { GameView } from "../../../services/gameService";
import styles from "./AccessSection.module.css";

type AccessSectionProps = {
  onGameCreated: (session: PlayerSession) => void;
  onGameJoined: (session: PlayerSession, game: GameView) => void;
  initialJoinId?: string;
};

function AccessSection({
  onGameCreated,
  onGameJoined,
  initialJoinId = "",
}: AccessSectionProps) {
  return (
    <section id="acesso" className={styles.access}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>Painel de acesso rápido</p>
        <h2 className={styles.title}>Partidas e Acesso</h2>
      </header>

      <div className={styles.grid}>
        <CreateGame onCreated={onGameCreated} />
        <JoinGame initialGameId={initialJoinId} onJoined={onGameJoined} />
      </div>
    </section>
  );
}

export default AccessSection;
