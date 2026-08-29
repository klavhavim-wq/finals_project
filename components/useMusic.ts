"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/** Remembers the player's choice between sessions, so a class that turns the
 *  music off once doesn't have to turn it off again every game. */
const STORE_KEY = "dogylishios:music-muted";

/** Two formats: the loop is seamless in browsers that take Vorbis, and Safari
 *  falls back to the MP3. */
const OGG = "/music-seaside.ogg";
const MP3 = "/music-seaside.mp3";

/** Quiet enough to sit under the game's text without competing with it. */
const VOLUME = 0.25;

/** Background music. Browsers refuse to start audio before the player has
 *  interacted with the page, so `playing` should only turn true after a click
 *  has happened. */
export function useMusic(playing: boolean) {
  // Read the saved choice up front. There is no localStorage on the server, and
  // nothing visible depends on this until the board opens, so the first paint
  // still matches.
  const [muted, setMuted] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    try {
      return localStorage.getItem(STORE_KEY) === "1";
    } catch {
      /* private mode / storage blocked — just start unmuted */
      return false;
    }
  });

  const audio = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const a = new Audio();
    a.src = a.canPlayType("audio/ogg; codecs=vorbis") ? OGG : MP3;
    a.loop = true;
    a.volume = VOLUME;
    a.preload = "auto";
    audio.current = a;
    return () => {
      a.pause();
      audio.current = null;
    };
  }, []);

  useEffect(() => {
    const a = audio.current;
    if (!a) return;
    if (playing && !muted) {
      // Still rejected if the browser hasn't seen a gesture yet; harmless.
      a.play().catch(() => {});
    } else {
      a.pause();
    }
  }, [playing, muted]);

  const toggle = useCallback(() => {
    setMuted((m) => {
      const next = !m;
      try {
        localStorage.setItem(STORE_KEY, next ? "1" : "0");
      } catch {
        /* nothing to remember it with — the toggle still works this session */
      }
      return next;
    });
  }, []);

  return { muted, toggle };
}
