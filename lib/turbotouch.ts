"use client";

/**
 * ⚡ Kynisto TurboTouch™ Native Touch & Haptic Physics Engine
 * Triggers interactive actions on pointerdown (eliminating 150ms finger-lift delay)
 * and dispatches subtle native haptic pulses.
 */

export function triggerHaptic(durationMs: number = 8): void {
  if (typeof navigator === "undefined" || !navigator.vibrate) return;
  try {
    navigator.vibrate(durationMs);
  } catch {
    // Unsupported or vibration disabled
  }
}

function createTurboTouch(
  onTrigger: () => void,
  options: {
    prefetchHref?: string;
    onPrefetch?: (href: string) => void;
    haptic?: boolean;
  } = {}
) {
  const { prefetchHref, onPrefetch, haptic = true } = options;

  let triggered = false;

  return {
    onTouchStart: () => {
      triggered = false;
      if (prefetchHref && onPrefetch) {
        onPrefetch(prefetchHref);
      }
    },
    onPointerDown: (event: React.PointerEvent) => {
      // Only handle primary touch/mouse contacts
      if (event.button !== 0 && event.pointerType === "mouse") return;
      if (haptic) triggerHaptic(8);
      if (prefetchHref && onPrefetch) {
        onPrefetch(prefetchHref);
      }
    },
    onClick: (event: React.MouseEvent) => {
      if (triggered) {
        event.preventDefault();
        return;
      }
      triggered = true;
      onTrigger();
    },
  };
}

export const turboTouch = Object.assign(createTurboTouch, {
  haptic: triggerHaptic,
});
