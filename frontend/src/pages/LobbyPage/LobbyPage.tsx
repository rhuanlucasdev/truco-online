/**
 * Página inicial (lobby).
 * onGameCreated → waiting; onGameJoined → mesa.
 */
import {
  AccessSection,
  DeckFeature,
  Hero,
  SuitWatermark,
} from "../../components/lobby";
import type { PlayerSession } from "../../types/session";
import type { GameView } from "../../services/gameService";
import { scrollToId } from "../../utils/scrollToId";
import styles from "./LobbyPage.module.css";
import { useEffect } from "react";

type LobbyPageProps = {
  onGameCreated: (session: PlayerSession) => void;
  onGameJoined: (session: PlayerSession, game: GameView) => void;
  initialJoinId?: string;
};

function LobbyPage({
  onGameCreated,
  onGameJoined,
  initialJoinId = "",
}: LobbyPageProps) {
  useEffect(() => {
    if (initialJoinId) scrollToId("acesso");
  }, [initialJoinId]);

  return (
    <div className={styles.page}>
      <div className={styles.watermarkLayer} aria-hidden>
        <SuitWatermark />
      </div>

      <Hero />
      <AccessSection
        onGameCreated={onGameCreated}
        onGameJoined={onGameJoined}
        initialJoinId={initialJoinId}
      />
      <DeckFeature />
    </div>
  );
}

export default LobbyPage;
