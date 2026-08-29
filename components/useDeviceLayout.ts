"use client";

import { useEffect, useState } from "react";
import type { Device } from "@/lib/i18n";

/**
 * Which of the two layouts this screen gets — and, because the guides describe
 * where things are, which wording the guides use.
 *
 *   desktop — every panel (in-turn controls, bank, door values, route, helper)
 *             is on screen at once, in a column beside the board. Every desktop
 *             and laptop width, however short the window is, plus tablets held
 *             sideways.
 *   mobile  — phones, including a phone turned sideways: the board keeps the
 *             whole screen and the panels slide in from the edge tab.
 *
 * Width decides; the height floor only guards a window squashed to a sliver,
 * where the side column would leave no usable board either way.
 *
 * Server-rendered markup starts on the desktop wording and corrects itself on
 * the first client measurement, exactly as the board layout always has.
 */
export function useDeviceLayout(): Device {
  const [device, setDevice] = useState<Device>("desktop");

  useEffect(() => {
    const onResize = () => {
      const w = window.innerWidth, h = window.innerHeight;
      const desktopWidth = w > 820 && h >= 420;
      const tabletLandscape = w >= 640 && w > h && h >= 600;
      setDevice(desktopWidth || tabletLandscape ? "desktop" : "mobile");
    };
    onResize();
    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onResize);
    };
  }, []);

  return device;
}
