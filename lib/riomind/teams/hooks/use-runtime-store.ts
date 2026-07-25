"use client";

import {
  useSyncExternalStore,
} from "react";
import type {
  RuntimeStore,
} from "../runtime/store-core";

export function useRuntimeStore<T>(
  store: RuntimeStore<T>,
): T {
  return useSyncExternalStore(
    (listener) =>
      store.subscribe(() => listener()),
    () => store.getSnapshot(),
    () => store.getSnapshot(),
  );
}
