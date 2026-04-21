"use client";

import { useSyncExternalStore } from "react";

let nowSeconds = Math.floor(Date.now() / 1000);
const listeners = new Set<() => void>();
let timer: number | null = null;

function publishNow() {
  const next = Math.floor(Date.now() / 1000);
  if (next === nowSeconds) return;
  nowSeconds = next;
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  publishNow();

  if (timer == null) {
    timer = window.setInterval(publishNow, 30_000);
  }

  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && timer != null) {
      window.clearInterval(timer);
      timer = null;
    }
  };
}

function getSnapshot() {
  return nowSeconds;
}

export function useNowSeconds() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
