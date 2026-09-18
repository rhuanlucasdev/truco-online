/**
 * Entrada da aplicação.
 * create → waiting; join WAITING → waiting; PLAYING → mesa.
 * Rejoin via localStorage (“Continuar partida”).
 */
import { useCallback, useEffect, useState } from "react";
import LobbyPage from "./pages/LobbyPage";
import WaitingRoomPage from "./pages/WaitingRoomPage";
import GameTablePage from "./pages/GameTablePage";
import type { PlayerSession } from "./types/session";
import {
  getGame,
  joinGame,
  type GameView,
} from "./services/gameService";
import {
  clearSession,
  loadSession,
  saveSession,
} from "./utils/sessionStorage";

type AppView = "lobby" | "waiting" | "playing";

function readJoinFromUrl(): string {
  if (typeof window === "undefined") return "";
  return new URLSearchParams(window.location.search).get("join")?.trim() ?? "";
}

function App() {
  const [view, setView] = useState<AppView>("lobby");
  const [session, setSession] = useState<PlayerSession | null>(null);
  const [game, setGame] = useState<GameView | null>(null);
  const [initialJoinId, setInitialJoinId] = useState("");
  const [endedNotice, setEndedNotice] = useState<string | null>(null);
  const [savedSession, setSavedSession] = useState<PlayerSession | null>(null);
  const [resuming, setResuming] = useState(false);

  useEffect(() => {
    setInitialJoinId(readJoinFromUrl());
    setSavedSession(loadSession());
  }, []);

  function clearJoinQuery() {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    if (!url.searchParams.has("join")) return;
    url.searchParams.delete("join");
    window.history.replaceState({}, "", url.pathname + url.search);
  }

  const goToGame = useCallback(
    (next: PlayerSession, nextGame: GameView) => {
      saveSession(next);
      setSession(next);
      setGame(nextGame);
      setSavedSession(next);
      setView(nextGame.gameStatus === "PLAYING" ? "playing" : "waiting");
    },
    [],
  );

  const handleGameCreated = useCallback((next: PlayerSession) => {
    setEndedNotice(null);
    setSession(next);
    setGame(null);
    setSavedSession(next);
    setView("waiting");
  }, []);

  const handleGameJoined = useCallback(
    (next: PlayerSession, nextGame: GameView) => {
      clearJoinQuery();
      setEndedNotice(null);
      goToGame(next, nextGame);
    },
    [goToGame],
  );

  const handleWaitingReady = useCallback((nextGame: GameView) => {
    setGame(nextGame);
    setView("playing");
  }, []);

  const handleLeave = useCallback(() => {
    setSession(null);
    setGame(null);
    setView("lobby");
    setSavedSession(loadSession());
  }, []);

  const handleGameEnded = useCallback(() => {
    clearSession();
    setSession(null);
    setGame(null);
    setSavedSession(null);
    setView("lobby");
    setEndedNotice("A mesa foi encerrada pelo anfitrião.");
  }, []);

  async function handleResume() {
    const saved = loadSession();
    if (!saved) {
      setSavedSession(null);
      return;
    }

    setResuming(true);
    setEndedNotice(null);
    try {
      let view = await getGame(saved.gameId, saved.playerId);
      const me = view.playersList.find((p) => p.playerId === saved.playerId);

      if (me && !me.connected) {
        view = await joinGame(saved.gameId, {
          playerId: saved.playerId,
          playerName: saved.playerName,
        });
      }

      goToGame(saved, view);
    } catch (err) {
      clearSession();
      setSavedSession(null);
      setEndedNotice(
        err instanceof Error
          ? err.message
          : "Não foi possível voltar à partida.",
      );
    } finally {
      setResuming(false);
    }
  }

  if (view === "playing" && session) {
    return (
      <GameTablePage
        session={session}
        initialGame={game}
        onLeave={handleLeave}
        onGameEnded={handleGameEnded}
      />
    );
  }

  if (view === "waiting" && session) {
    return (
      <WaitingRoomPage
        session={session}
        initialGame={game}
        onLeave={handleLeave}
        onGameReady={handleWaitingReady}
        onGameEnded={handleGameEnded}
      />
    );
  }

  return (
    <>
      {endedNotice && (
        <p
          style={{
            margin: 0,
            padding: "0.75rem 1rem",
            textAlign: "center",
            background: "#5c1212",
            color: "#ffe8e8",
            fontSize: "0.9rem",
          }}
        >
          {endedNotice}
        </p>
      )}
      {savedSession && (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.75rem",
            padding: "0.75rem 1rem",
            background: "#302922",
            borderBottom: "1px solid #403830",
          }}
        >
          <span style={{ color: "#eee0d5", fontSize: "0.9rem" }}>
            Mesa #{savedSession.gameId} salva neste navegador
          </span>
          <button
            type="button"
            onClick={() => void handleResume()}
            disabled={resuming}
            style={{
              padding: "0.4rem 0.9rem",
              border: "none",
              borderRadius: 8,
              background: "#f4bd61",
              color: "#432c00",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            {resuming ? "Entrando…" : "Continuar partida"}
          </button>
          <button
            type="button"
            onClick={() => {
              clearSession();
              setSavedSession(null);
            }}
            style={{
              padding: "0.4rem 0.9rem",
              border: "1px solid #403830",
              borderRadius: 8,
              background: "transparent",
              color: "#c0c9bf",
              cursor: "pointer",
            }}
          >
            Descartar
          </button>
        </div>
      )}
      <LobbyPage
        onGameCreated={handleGameCreated}
        onGameJoined={handleGameJoined}
        initialJoinId={initialJoinId}
      />
    </>
  );
}

export default App;
