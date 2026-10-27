import { invoke } from "@tauri-apps/api/core";
import type { ActionOutcome, ServiceInfo } from "./types";
import { getStoredLang, localizeBackend } from "./i18n";

function asMessage(e: unknown): string {
  const lang = getStoredLang();
  if (typeof e === "string") return localizeBackend(e, lang);
  if (e instanceof Error) return localizeBackend(e.message, lang);
  return lang === "ru" ? "Неизвестная ошибка" : "Unknown error";
}

async function call<T>(cmd: string, args?: Record<string, unknown>): Promise<T> {
  try {
    return await invoke<T>(cmd, args);
  } catch (e) {
    throw new Error(asMessage(e));
  }
}

export const api = {
  listServices: () => call<ServiceInfo[]>("list_services"),
  isAdmin: () => call<boolean>("is_admin"),
  restartAsAdmin: () => call<boolean>("restart_as_admin"),
  disable: (name: string) => call<ActionOutcome>("disable_service", { name }),
  enable: (name: string) => call<ActionOutcome>("set_startup", { name, kind: "manual" }),
  setStartup: (name: string, kind: "auto" | "auto_delayed" | "manual" | "disabled") =>
    call<ActionOutcome>("set_startup", { name, kind }),
  start: (name: string) => call<ActionOutcome>("start_service", { name }),
  stop: (name: string) => call<ActionOutcome>("stop_service", { name }),
  restart: (name: string) => call<ActionOutcome>("restart_service", { name }),
  openUrl: (url: string) => call<void>("open_url", { url }),
};

export function isTauri(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

/** Открывает ссылку в системном браузере (в dev-режиме — обычным window.open). */
export async function openExternal(url: string): Promise<void> {
  if (isTauri()) {
    try {
      await api.openUrl(url);
      return;
    } catch {
      // Если команда недоступна, пробуем браузерное открытие.
    }
  }
  window.open(url, "_blank", "noopener,noreferrer");
}
