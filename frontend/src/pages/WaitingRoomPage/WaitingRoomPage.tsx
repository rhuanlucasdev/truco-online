/**
 * Sala de espera — slots dinâmicos (2 ou 4), sync socket/poll.
 * Host: Cancelar apaga a mesa (com confirmação).
 */
import { useEffect, useMemo, useState } from "react";
import {
  FiCopy,
  FiCheck,
  FiLink,
  FiShare2,
  FiHash,
  FiUsers,
  FiUserPlus,
  FiX,
  FiZap,
} from "react-icons/fi";
import { MdOutlineLightbulb } from "react-icons/md";
import { SuitWatermark } from "../../components/lobby";
import {
  deleteGame,
  getGame,
  leaveGame,
  setTeam,
  type GameView,
  type PlayerView,
} from "../../services/gameService";
import { connectGameSocket } from "../../services/gameSocket";
import type { WaitingRoomSession } from "../../types/session";
import { clearSession } from "../../utils/sessionStorage";
import styles from "./WaitingRoomPage.module.css";

type WaitingRoomPageProps = {
  session: WaitingRoomSession;
  initialGame?: GameView | null;
  onLeave: () => void;
  onGameReady: (game: GameView) => void;
  onGameEnded: () => void;
};

function WaitingRoomPage({
  session,
  initialGame = null,
  onLeave,
  onGameReady,
  onGameEnded,
}: WaitingRoomPageProps) {
  const [copiedId, setCopiedId] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [game, setGame] = useState<GameView | null>(initialGame);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const paddedId = useMemo(
    () => session.gameId.padStart(4, "0"),
    [session.gameId],
  );

  const inviteLink = useMemo(() => {
    if (typeof window === "undefined") return `mesa/${session.gameId}`;
    return `${window.location.origin}/?join=${encodeURIComponent(session.gameId)}`;
  }, [session.gameId]);

  const isHost = game
    ? game.hostPlayerId === session.playerId
    : true;

  const maxPlayers = game?.maxPlayers ?? 2;
  const players = game?.playersList ?? [];
  const modeLabel = maxPlayers === 4 ? "2v2" : "1v1";

  useEffect(() => {
    let cancelled = false;
    let ready = false;

    function handleView(view: GameView) {
      if (cancelled || ready) return;
      setGame(view);

      if (view.gameStatus === "PLAYING") {
        ready = true;
        onGameReady(view);
      }
    }

    async function poll() {
      try {
        const view = await getGame(session.gameId, session.playerId);
        handleView(view);
      } catch {
        // rede / partida apagada
      }
    }

    void poll();

    const socket = connectGameSocket(session.gameId, session.playerId, {
      onState: handleView,
      onEnded: () => {
        if (!cancelled) onGameEnded();
      },
    });

    const pollId = window.setInterval(() => {
      void poll();
    }, 2000);

    return () => {
      cancelled = true;
      socket.disconnect();
      window.clearInterval(pollId);
    };
  }, [session.gameId, session.playerId, onGameReady, onGameEnded]);

  async function copyText(value: string, setFlag: (v: boolean) => void) {
    try {
      await navigator.clipboard.writeText(value);
      setFlag(true);
      window.setTimeout(() => setFlag(false), 2000);
    } catch {
      setFlag(false);
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

  async function handleLeaveSeat() {
    setDeleting(true);
    setError(null);
    try {
      await leaveGame(session.gameId, session.playerId);
      clearSession();
      onLeave();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao sair");
    } finally {
      setDeleting(false);
    }
  }

  function handleCancelClick() {
    if (isHost) {
      setConfirmDelete(true);
      return;
    }
    void handleLeaveSeat();
  }

  async function handleChangeTeam(teamId: 0 | 1) {
    setError(null);
    try {
      const view = await setTeam(session.gameId, session.playerId, teamId);
      setGame(view);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível trocar");
    }
  }

  const myTeam =
    game?.playersList.find((p) => p.playerId === session.playerId)?.teamId ??
    0;

  function slotInitials(name: string) {
    const parts = name.trim().split(/\s+/);
    return (
      parts
        .slice(0, 2)
        .map((p) => p[0]?.toUpperCase() ?? "")
        .join("") || "?"
    );
  }

  function renderSlot(player: PlayerView | undefined, index: number) {
    if (player) {
      const host = player.playerId === game?.hostPlayerId;
      return (
        <article key={player.playerId} className={styles.slotHost}>
          <div className={styles.avatarWrap}>
            <div className={styles.avatar} aria-hidden>
              {slotInitials(player.name)}
            </div>
            <span className={styles.avatarCheck} aria-hidden>
              <FiCheck />
            </span>
          </div>
          <div className={styles.slotBody}>
            <div className={styles.nameRow}>
              <h2 className={styles.playerName}>{player.name}</h2>
              {host && <span className={styles.hostTag}>Anfitrião</span>}
              <span className={styles.teamTag}>Time {player.teamId + 1}</span>
            </div>
            <p className={styles.ready}>
              <span className={styles.readyDot} aria-hidden />
              Pronto
            </p>
          </div>
        </article>
      );
    }

    return (
      <article key={`empty-${index}`} className={styles.slotEmpty}>
        <div className={styles.emptyIcon} aria-hidden>
          <FiUserPlus />
        </div>
        <div className={styles.slotBody}>
          <h2 className={styles.emptyTitle}>Aguardando...</h2>
          <p className={styles.emptyHint}>Vaga livre na mesa</p>
        </div>
      </article>
    );
  }

  const slots = Array.from({ length: maxPlayers }, (_, i) => players[i]);

  return (
    <div className={styles.page}>
      <div className={styles.watermarkLayer} aria-hidden>
        <SuitWatermark />
      </div>

      <div className={styles.content}>
        <header className={styles.intro}>
          <h1 className={styles.title}>
            Aguardando jogadores
            <span className={styles.titleEllipsis}>...</span>
          </h1>
          <p className={styles.lead}>
            Mesa {modeLabel} · compartilhe o código até completar{" "}
            {maxPlayers} jogadores.
          </p>
        </header>

        <section className={styles.tableCard}>
          <div className={styles.brassBar} aria-hidden />

          <div className={styles.tableInner}>
            <div className={styles.idBlock}>
              <div className={styles.idCopy}>
                <p className={styles.idLabel}>
                  <FiHash aria-hidden />
                  ID da partida
                </p>
                <div className={styles.idRow}>
                  <p className={styles.idHuge}>{session.gameId}</p>
                  <p className={styles.idMeta}>Mesa #{paddedId}</p>
                </div>
                <p className={styles.idHint}>
                  Compartilhe este código para preencher a mesa ({modeLabel}).
                </p>
              </div>

              <button
                type="button"
                className={styles.copyIdBtn}
                onClick={() => copyText(session.gameId, setCopiedId)}
              >
                {copiedId ? <FiCheck aria-hidden /> : <FiCopy aria-hidden />}
                {copiedId ? "ID copiado" : "Copiar ID da Mesa"}
              </button>
            </div>

            <div className={styles.arena}>
              <div className={styles.arenaHead}>
                <p className={styles.arenaTitle}>
                  <FiUsers aria-hidden />
                  {maxPlayers === 4 ? "Duplas (2v2)" : "Confronto direto (1v1)"}
                </p>
                <span className={styles.arenaBadge}>
                  {players.length} de {maxPlayers} na mesa
                </span>
              </div>

              <div
                className={
                  maxPlayers === 4 ? styles.slotsGrid4 : styles.slots
                }
              >
                {maxPlayers === 2 ? (
                  <>
                    {renderSlot(slots[0], 0)}
                    <div className={styles.vs} aria-hidden>
                      VS
                    </div>
                    {renderSlot(slots[1], 1)}
                  </>
                ) : (
                  slots.map((player, index) => renderSlot(player, index))
                )}
              </div>

              <div className={styles.linkBar}>
                <div className={styles.linkInfo}>
                  <FiLink aria-hidden />
                  <div>
                    <p className={styles.linkLabel}>Link direto da sala</p>
                    <p className={styles.linkUrl}>{inviteLink}</p>
                  </div>
                </div>
                <button
                  type="button"
                  className={styles.copyLinkBtn}
                  onClick={() => copyText(inviteLink, setCopiedLink)}
                >
                  {copiedLink ? (
                    <FiCheck aria-hidden />
                  ) : (
                    <FiShare2 aria-hidden />
                  )}
                  {copiedLink ? "Link copiado" : "Copiar Link da Sala"}
                </button>
              </div>
            </div>

            <div className={styles.rules}>
              <div className={styles.rule}>
                <p className={styles.ruleLabel}>Modo</p>
                <p className={styles.ruleValue}>{modeLabel}</p>
                <p className={styles.ruleHint}>{maxPlayers} jogadores</p>
              </div>
              <div className={styles.rule}>
                <p className={styles.ruleLabel}>Tentos alvo</p>
                <p className={styles.ruleValue}>12</p>
                <p className={styles.ruleHint}>Queda clássica</p>
              </div>
              <div className={styles.rule}>
                <p className={styles.ruleLabel}>Baralho</p>
                <p className={styles.ruleValue}>Limpo</p>
                <p className={styles.ruleHint}>Sem 8, 9 e 10</p>
              </div>
              <div className={styles.rule}>
                <p className={styles.ruleLabel}>Times</p>
                <p className={styles.ruleValue}>
                  {maxPlayers === 4 ? "Duplas" : "Solo"}
                </p>
                <p className={styles.ruleHint}>
                  {maxPlayers === 4 ? "Parceiros intercalados" : "1x1"}
                </p>
              </div>
            </div>

            <div className={styles.actions}>
              <button
                type="button"
                className={styles.cancelBtn}
                onClick={handleCancelClick}
                disabled={deleting}
              >
                <FiX aria-hidden />
                {isHost ? "Cancelar Partida" : "Sair da mesa"}
              </button>
              <div className={styles.teamSwitch}>
                <span>Seu time:</span>
                <button
                  type="button"
                  className={myTeam === 0 ? styles.teamActive : ""}
                  onClick={() => void handleChangeTeam(0)}
                >
                  Time 1
                </button>
                <button
                  type="button"
                  className={myTeam === 1 ? styles.teamActive : ""}
                  onClick={() => void handleChangeTeam(1)}
                >
                  Time 2
                </button>
              </div>
              <p className={styles.serverHint}>
                <FiZap aria-hidden />
                Aguardando {Math.max(0, maxPlayers - players.length)} jogador
                {maxPlayers - players.length === 1 ? "" : "es"}
              </p>
            </div>
            {error && <p className={styles.errorMsg}>{error}</p>}
          </div>
        </section>

        <aside className={styles.tip}>
          <span className={styles.tipIcon} aria-hidden>
            <MdOutlineLightbulb />
          </span>
          <p>
            <strong>Dica:</strong> Escolha o time ao entrar ou troque aqui na
            espera. Cada time cabe no máximo {maxPlayers / 2} jogador
            {maxPlayers / 2 === 1 ? "" : "es"}.
          </p>
        </aside>
      </div>

      {confirmDelete && (
        <div className={styles.modalOverlay} role="dialog" aria-modal="true">
          <div className={styles.modal}>
            <h2 className={styles.modalTitle}>Apagar a mesa?</h2>
            <p className={styles.modalText}>
              Isso encerra a partida para todos os jogadores. Não dá para
              desfazer.
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
                {deleting ? "Apagando…" : "Apagar mesa"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default WaitingRoomPage;
