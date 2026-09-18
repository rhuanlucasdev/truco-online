/**
 * Mesa de jogo — 1v1 ou 2v2.
 * Sync: Socket.IO + polling. Host pode apagar a mesa.
 */
import { useEffect, useMemo, useState } from "react";
import { FiLogOut } from "react-icons/fi";
import {
  RiPokerClubsFill,
  RiPokerDiamondsFill,
  RiPokerHeartsFill,
  RiPokerSpadesFill,
} from "react-icons/ri";
import PlayingCard from "../../components/cards/PlayingCard";
import {
  deleteGame,
  getGame,
  leaveGame,
  playCard,
  type Carta,
  type GameView,
  type PlayerView,
} from "../../services/gameService";
import { connectGameSocket } from "../../services/gameSocket";
import type { PlayerSession } from "../../types/session";
import { clearSession } from "../../utils/sessionStorage";
import { cartaToVisual, naipeLabel } from "../../utils/cardVisual";
import styles from "./GameTablePage.module.css";

type GameTablePageProps = {
  session: PlayerSession;
  initialGame?: GameView | null;
  onLeave: () => void;
  onGameEnded: () => void;
};

function cardKey(card: Carta) {
  return `${card.naipe}-${card.value}`;
}

function GameTablePage({
  session,
  initialGame = null,
  onLeave,
  onGameEnded,
}: GameTablePageProps) {
  const [game, setGame] = useState<GameView | null>(initialGame);
  const [error, setError] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [selected, setSelected] = useState<Carta | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const view = await getGame(session.gameId, session.playerId);
        if (!cancelled) setGame(view);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Falha ao carregar mesa",
          );
        }
      }
    }

    if (!initialGame) void load();

    const socket = connectGameSocket(session.gameId, session.playerId, {
      onState: (view) => {
        if (!cancelled) {
          setGame(view);
          setError(null);
        }
      },
      onEnded: () => {
        if (!cancelled) onGameEnded();
      },
      onError: (message) => {
        if (!cancelled) setError(message);
      },
    });

    const pollId = window.setInterval(() => {
      void load();
    }, 2500);

    return () => {
      cancelled = true;
      socket.disconnect();
      window.clearInterval(pollId);
    };
  }, [session.gameId, session.playerId, initialGame, onGameEnded]);

  const me = game?.playersList.find((p) => p.playerId === session.playerId);
  const others = useMemo(
    () =>
      (game?.playersList ?? []).filter((p) => p.playerId !== session.playerId),
    [game?.playersList, session.playerId],
  );

  const partner = others.find((p) => p.teamId === me?.teamId);
  const opponents = others.filter((p) => p.teamId !== me?.teamId);

  const isMyTurn = game?.currentPlayerId === session.playerId;
  const isHost = game?.hostPlayerId === session.playerId;
  const myTeam = me?.teamId ?? 0;
  const oppTeam = (myTeam === 0 ? 1 : 0) as 0 | 1;
  const myScore = game?.teamScores[myTeam] ?? 0;
  const oppScore = game?.teamScores[oppTeam] ?? 0;

  const myPlay = game?.currentRound.find(
    (j) => j.playerId === session.playerId,
  );

  const turnName =
    game?.playersList.find((p) => p.playerId === game.currentPlayerId)?.name ??
    "…";

  async function handlePlay(card: Carta) {
    if (!game || !isMyTurn || playing || myPlay) return;

    setPlaying(true);
    setError(null);
    setSelected(card);

    try {
      const view = await playCard(session.gameId, {
        playerId: session.playerId,
        naipe: card.naipe,
        value: card.value,
      });
      setGame(view);
      setSelected(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível jogar");
    } finally {
      setPlaying(false);
    }
  }

  async function handleConfirmDelete() {
    setDeleting(true);
    setError(null);
    try {
      await deleteGame(session.gameId, session.playerId);
      clearSession();
      onLeave();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao apagar mesa");
      setConfirmDelete(false);
    } finally {
      setDeleting(false);
    }
  }

  async function handleLeaveTable() {
    setDeleting(true);
    setError(null);
    try {
      // PLAYING: desconecta mas mantém session no localStorage p/ “Continuar”.
      await leaveGame(session.gameId, session.playerId);
      onLeave();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao sair");
    } finally {
      setDeleting(false);
    }
  }

  function handleExitClick() {
    if (isHost) {
      setConfirmDelete(true);
      return;
    }
    void handleLeaveTable();
  }

  function playFor(playerId: string) {
    return game?.currentRound.find((j) => j.playerId === playerId);
  }

  function renderFaceDown(count: number) {
    return Array.from({ length: count }).map((_, i) => (
      <div key={i} className={styles.cardBack} aria-hidden />
    ));
  }

  function renderSeat(player: PlayerView | undefined, label: string) {
    if (!player) return null;
    const play = playFor(player.playerId);
    const visual = play ? cartaToVisual(play.card) : null;

    return (
      <div className={styles.seat}>
        <div className={styles.seatInfo}>
          <div className={styles.avatar} aria-hidden>
            {player.name[0]?.toUpperCase()}
          </div>
          <div>
            <p className={styles.seatName}>{player.name}</p>
            <p className={styles.seatMeta}>
              {label}
              {!player.connected ? " · Offline" : ""} · {player.handCount} carta
              {player.handCount === 1 ? "" : "s"}
            </p>
          </div>
        </div>
        <div className={styles.seatCards}>
          {renderFaceDown(player.handCount)}
          {visual && (
            <PlayingCard
              rank={visual.rank}
              suit={visual.suit}
              className={styles.miniPlayed}
            />
          )}
        </div>
      </div>
    );
  }

  const paddedId = session.gameId.padStart(4, "0");
  const team0Names =
    game?.playersList
      .filter((p) => p.teamId === myTeam)
      .map((p) => p.name)
      .join(" · ") ?? session.playerName;
  const team1Names =
    game?.playersList
      .filter((p) => p.teamId === oppTeam)
      .map((p) => p.name)
      .join(" · ") ?? "…";

  return (
    <div className={styles.page}>
      <header className={styles.topBar}>
        <div className={styles.brandBlock}>
          <div className={styles.brandRow}>
            <p className={styles.brand}>Truco Online</p>
            <span className={styles.paulista}>
              {game?.maxPlayers === 4 ? "2v2" : "1v1"}
            </span>
          </div>
          <p className={styles.mesaMeta}>Mesa #{paddedId} · Baralho limpo</p>
        </div>

        <div className={styles.scoreboard}>
          <div className={styles.scoreSide}>
            <p className={styles.scoreName}>
              Seu time <span className={styles.youTag}>(Você)</span>
            </p>
            <p className={styles.scoreNames}>{team0Names}</p>
            <p className={styles.scoreNum}>{String(myScore).padStart(2, "0")}</p>
          </div>

          <div className={styles.scoreCenter}>
            <p className={styles.scoreVs}>
              {myScore} <span>x</span> {oppScore}
            </p>
            <p className={styles.quedaLabel}>Valendo 1 tento</p>
          </div>

          <div className={`${styles.scoreSide} ${styles.scoreSideRight}`}>
            <p className={styles.scoreName}>Adversários</p>
            <p className={styles.scoreNames}>{team1Names}</p>
            <p className={styles.scoreNum}>
              {String(oppScore).padStart(2, "0")}
            </p>
          </div>
        </div>

        <div className={styles.topActions}>
          <button type="button" className={styles.exitBtn} onClick={handleExitClick}>
            <FiLogOut aria-hidden />
            {isHost ? "Encerrar mesa" : "Sair"}
          </button>
        </div>
      </header>

      <main className={styles.tableShell}>
        <div className={styles.felt}>
          {game?.maxPlayers === 4 ? (
            <section className={styles.seats4}>
              <div className={styles.seatTop}>
                {renderSeat(partner, "Parceiro")}
              </div>
              <div className={styles.seatsSides}>
                {renderSeat(opponents[0], "Adversário")}
                {renderSeat(opponents[1], "Adversário")}
              </div>
            </section>
          ) : (
            <section className={styles.opponentRow}>
              {opponents[0] && (
                <>
                  <div className={styles.oppInfo}>
                    <div className={styles.avatar} aria-hidden>
                      {opponents[0].name[0]?.toUpperCase()}
                    </div>
                    <div>
                      <p className={styles.oppName}>{opponents[0].name}</p>
                      <p className={styles.oppStatus}>
                        {isMyTurn
                          ? "Aguardando sua jogada…"
                          : "Pensando na próxima carta…"}
                      </p>
                    </div>
                  </div>
                  <div className={styles.oppHand}>
                    {renderFaceDown(opponents[0].handCount)}
                  </div>
                </>
              )}
            </section>
          )}

          <p
            className={`${styles.turnBanner} ${isMyTurn ? styles.turnMine : styles.turnWait}`}
          >
            {isMyTurn
              ? "Sua vez! Selecione uma carta da mão."
              : `Vez de ${turnName}…`}
          </p>

          <section className={styles.playArea}>
            <div className={styles.viraBlock}>
              <div className={styles.monte} aria-hidden>
                <div className={styles.cardBack} />
                <span>Monte</span>
              </div>
              <div className={styles.viraCard}>
                {game?.vira && cartaToVisual(game.vira) ? (
                  <PlayingCard
                    rank={cartaToVisual(game.vira)!.rank}
                    suit={cartaToVisual(game.vira)!.suit}
                    className={styles.tableCard}
                  />
                ) : (
                  <div className={styles.cardSlotEmpty} />
                )}
                <span>Vira</span>
              </div>
              {game?.manilha && (
                <p className={styles.manilhaHint}>
                  Manilha: <strong>{game.manilha}</strong>
                  <span className={styles.suitOrder} aria-hidden>
                    <RiPokerClubsFill />
                    <RiPokerHeartsFill />
                    <RiPokerSpadesFill />
                    <RiPokerDiamondsFill />
                  </span>
                </p>
              )}
            </div>

            <div className={styles.centerPlays}>
              {(game?.playersList ?? []).map((player) => {
                const play = playFor(player.playerId);
                const visual = play ? cartaToVisual(play.card) : null;
                const isSelf = player.playerId === session.playerId;

                return (
                  <div key={player.playerId} className={styles.playSlot}>
                    <p className={styles.slotLabel}>
                      {isSelf ? "Sua jogada" : player.name}
                    </p>
                    {visual ? (
                      <PlayingCard
                        rank={visual.rank}
                        suit={visual.suit}
                        className={styles.tableCard}
                      />
                    ) : (
                      <div
                        className={`${styles.cardSlotEmpty} ${isSelf ? styles.cardSlotDashed : ""}`}
                      >
                        {isSelf && <span>Clique na carta abaixo</span>}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          <section className={styles.handRow}>
            <div className={styles.myAvatar} aria-hidden>
              {session.playerName[0]?.toUpperCase() ?? "?"}
            </div>
            <ul className={styles.hand}>
              {(me?.hand ?? []).map((card) => {
                const visual = cartaToVisual(card);
                if (!visual) return null;
                const isSelected =
                  selected &&
                  selected.naipe === card.naipe &&
                  selected.value === card.value;

                return (
                  <li key={cardKey(card)}>
                    <button
                      type="button"
                      className={`${styles.handCardBtn} ${isSelected ? styles.handCardSelected : ""} ${!isMyTurn || playing ? styles.handCardDisabled : ""}`}
                      disabled={!isMyTurn || playing || Boolean(myPlay)}
                      onClick={() => void handlePlay(card)}
                      aria-label={`Jogar ${card.value} de ${naipeLabel(card.naipe)}`}
                    >
                      <PlayingCard
                        rank={visual.rank}
                        suit={visual.suit}
                        className={styles.handCard}
                      />
                      <span className={styles.handCardHint}>
                        {naipeLabel(card.naipe)}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        </div>
      </main>

      {error && <p className={styles.errorToast}>{error}</p>}

      {confirmDelete && (
        <div className={styles.modalOverlay} role="dialog" aria-modal="true">
          <div className={styles.modal}>
            <h2 className={styles.modalTitle}>Encerrar a mesa?</h2>
            <p className={styles.modalText}>
              A partida será apagada para todos os jogadores.
            </p>
            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.modalCancel}
                onClick={() => setConfirmDelete(false)}
                disabled={deleting}
              >
                Voltar
              </button>
              <button
                type="button"
                className={styles.modalConfirm}
                onClick={() => void handleConfirmDelete()}
                disabled={deleting}
              >
                {deleting ? "Encerrando…" : "Encerrar mesa"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default GameTablePage;
