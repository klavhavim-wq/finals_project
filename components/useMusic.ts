"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/** Remembers the player's choices between sessions, so a class that sets the
 *  music once doesn't have to set it again every game. */
const STORE_MUTED = "dogylishios:music-muted";
const STORE_VOLUME = "dogylishios:music-volume";

/** Two formats: the loop is seamless in browsers that take Vorbis, and Safari
 *  falls back to the MP3. */
const OGG = "/music-seaside.ogg";
const MP3 = "/music-seaside.mp3";

const DEFAULT_VOLUME = 0.6;

function readStored<T>(key: string, parse: (raw: string) => T, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? fallback : parse(raw);
  } catch {
    /* private mode / storage blocked — just use the default */
    return fallback;
  }
}

function store(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* nothing to remember it with — the controls still work this session */
  }
}

/** Background music. Browsers refuse to start audio before the player has
 *  interacted with the page, so `playing` should only turn true after a click
 *  has happened. */
export function useMusic(playing: boolean) {
  // Read the saved choices up front. There is no localStorage on the server,
  // and nothing visible depends on these until the board opens, so the first
  // paint still matches.
  const [muted, setMuted] = useState<boolean>(() =>
    readStored(STORE_MUTED, (raw) => raw === "1", false)
  );
  const [volume, setVolumeState] = useState<number>(() =>
    readStored(
      STORE_VOLUME,
      (raw) => {
        const n = Number(raw);
        return Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : DEFAULT_VOLUME;
      },
      DEFAULT_VOLUME
    )
  );

  const audio = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const a = new Audio();
    a.src = a.canPlayType("audio/ogg; codecs=vorbis") ? OGG : MP3;
    a.loop = true;
    a.preload = "auto";
    audio.current = a;
    return () => {
      a.pause();
      audio.current = null;
    };
  }, []);

  useEffect(() => {
    const a = audio.current;
    if (a) a.volume = volume;
  }, [volume]);

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
      store(STORE_MUTED, next ? "1" : "0");
      return next;
    });
  }, []);

  /** Moving the slider is also how you unmute — dragging it up while silent
   *  and hearing nothing would be baffling. Dragging it to zero mutes. */
  const setVolume = useCallback((v: number) => {
    const next = Math.min(1, Math.max(0, v));
    setVolumeState(next);
    store(STORE_VOLUME, String(next));
    setMuted(next === 0);
    store(STORE_MUTED, next === 0 ? "1" : "0");
  }, []);

  return { muted, volume, toggle, setVolume };
}
