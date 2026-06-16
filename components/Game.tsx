"use client";

import { useGame } from "./useGame";
import Modal from "./Modal";
import Welcome from "./screens/Welcome";
import Instructions from "./screens/Instructions";
import Setup from "./screens/Setup";
import GameScreen from "./screens/GameScreen";
import Win from "./screens/Win";
import Results from "./screens/Results";
import GuidedTour from "./GuidedTour";
import { getDict } from "@/lib/i18n";
import type { Locale } from "@/lib/engine/types";

export default function Game({ locale }: { locale: Locale }) {
  const { state, trials, actions } = useGame(locale);
  const t = getDict(locale);

  return (
    <div
      data-locale={locale}
      dir={t.dir}
      className={state.boardAns ? "answer-mode" : undefined}
      style={{ minHeight: "100vh", background: "var(--honey)" }}
    >
      {state.screen === "sw" && <Welcome t={t} actions={actions} locale={locale} />}
      {state.screen === "ss" && <Setup t={t} actions={actions} level={state.level} />}
      {state.screen === "sg" && (
        <GameScreen t={t} state={state} actions={actions} locale={locale} />
      )}
      {state.screen === "swin" && <Win t={t} state={state} trials={trials} actions={actions} />}
      {state.screen === "sresults" && <Results t={t} actions={actions} />}
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
    </div>
  );
}
