"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useGame } from "./useGame";
import { useOnlineGame } from "./useOnlineGame";
import { useMusic } from "./useMusic";
import Modal from "./Modal";
import Welcome from "./screens/Welcome";
import Instructions from "./screens/Instructions";
import Setup from "./screens/Setup";
import QuickSetup from "./screens/QuickSetup";
import GameScreen from "./screens/GameScreen";
import OnlineLobby from "./screens/OnlineLobby";
import Win from "./screens/Win";
import Results from "./screens/Results";
import GuidedTour from "./GuidedTour";
import { getDict } from "@/lib/i18n";
import type { Locale } from "@/lib/engine/types";

export default function Game({ locale, quickStart }: { locale: Locale; quickStart?: boolean }) {
  const t = getDict(locale);

  // The game played alone, exactly as it always was — no server, no network.
  const solo = useGame(locale);

  // A game played together. It sits idle and costs nothing until somebody
  // actually creates or joins a lobby.
  const [wantsTogether, setWantsTogether] = useState(false);
  const leaveTogether = useCallback(() => setWantsTogether(false), []);
  const online = useOnlineGame(locale, leaveTogether);

  // A saved seat means this device was already in a game — a tablet that went to
  // sleep, or a tab that reloaded — so it walks straight back in.
  const together = wantsTogether || !!online.seat;

  const state = together ? online.state : solo.state;
  const actions = together ? online.actions : solo.actions;
  const trials = together ? online.trials : solo.trials;

  // When this page is the dedicated quick-launch link, open straight onto the
  // quick-launch screen (once, on first load).
  const openedQuick = useRef(false);
  useEffect(() => {
    if (quickStart && !openedQuick.current && !together) {
      openedQuick.current = true;
      solo.actions.goQuick();
    }
  }, [quickStart, solo.actions, together]);

  // The music starts once the board is up. By then the player has clicked their
  // way through the welcome screens, which is what browsers require before they
  // will let any sound play.
  const music = useMusic(state.screen === "sg");

  // Before the shared game begins — and after the host closes it — this device
  // is in the lobby rather than on the board.
  const view = online.view;
  const inLobby =
    together &&
    (!view || view.phase === "waiting" || (view.phase === "ended" && view.endedReason === "host"));

  const currentName = state.players[state.cur]?.name ?? "";
  const iAmHost = view?.members.some((m) => m.seat === online.seat?.seat && m.isHost) ?? false;

  return (
    <div
      data-locale={locale}
      dir={t.dir}
      className={state.boardAns ? "answer-mode" : undefined}
      style={{ minHeight: "100vh", background: "var(--honey)" }}
    >
      {inLobby ? (
        <OnlineLobby t={t} online={online} onBack={leaveTogether} />
      ) : (
        <>
          {state.screen === "sw" && (
            <Welcome
              t={t}
              actions={actions}
              locale={locale}
              onPlayTogether={() => setWantsTogether(true)}
            />
          )}
          {state.screen === "sq" && <QuickSetup t={t} actions={actions} />}
          {state.screen === "ss" && <Setup t={t} actions={actions} level={state.level} />}
          {state.screen === "sg" && (
            <GameScreen
              t={t}
              state={state}
              actions={actions}
              locale={locale}
              musicMuted={music.muted}
              musicVolume={music.volume}
              onToggleMusic={music.toggle}
              onMusicVolume={music.setVolume}
            />
          )}
          {state.screen === "swin" && (
            <Win t={t} state={state} trials={trials} actions={actions} />
          )}
          {state.screen === "sresults" && <Results t={t} actions={actions} />}
        </>
      )}

      <Modal t={t} state={state} actions={actions} />
      {state.instOpen && (
        <Instructions
          t={t}
          idx={state.instIdx}
          actions={actions}
          mode={state.instMode}
          level={state.instLevel}
        />
      )}
      {state.tourActive && state.screen === "sg" && (
        <GuidedTour t={t} state={state} actions={actions} />
      )}

      {/* Playing together: whose turn it is, and the host's way out. A quiet
          strip rather than a blocking overlay — the bank and the help stay
          reachable while you wait for your turn. */}
      {together && !inLobby && state.screen === "sg" && (
        <div className={"online-status" + (online.isMyTurn ? " mine" : "")}>
          <span className="os-text">
            {online.isMyTurn ? t.onlineYourTurn : t.onlineWaitingFor(currentName)}
          </span>
          {iAmHost && (
            <button className="os-end" onClick={() => void online.endGame()}>
              {t.onlineEndForAll}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
