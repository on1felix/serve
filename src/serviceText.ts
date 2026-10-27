import type { Lang } from "./i18n";
import type { ServiceInfo, StartType } from "./types";

const CYRILLIC = /[\u0400-\u04FF]/;

/** Есть ли в строке кириллица (описания Windows приходят на языке системы). */
export function hasCyrillic(text: string): boolean {
  return CYRILLIC.test(text);
}

export const startTypeKeys: Record<StartType, string> = {
  auto: "start.auto",
  manual: "start.manual",
  disabled: "start.disabled",
  boot: "start.boot",
  system: "start.system",
  unknown: "start.unknown",
};

type Translate = (key: string, vars?: Record<string, string | number>) => string;

/**
 * Отображаемое имя службы.
 *
 * В английском режиме русские имена, которые приходят из Windows,
 * заменяются техническим именем службы — иначе EN-интерфейс снова
 * показывает кириллицу.
 */
export function displayName(
  service: Pick<ServiceInfo, "name" | "displayName">,
  lang: Lang
): string {
  const raw = service.displayName.trim();
  if (!raw) return service.name;
  return lang === "en" && hasCyrillic(raw) ? service.name : raw;
}

/**
 * Описание службы с учётом языка интерфейса.
 *
 * Если Windows отдал русское описание в EN-режиме, показываем
 * нейтральный английский текст и предлагаем проверку онлайн.
 */
export function displayDescription(
  service: Pick<ServiceInfo, "name" | "displayName" | "description">,
  lang: Lang,
  t: Translate,
  startLabel: string
): string {
  const raw = service.description.trim();
  if (raw && !(lang === "en" && hasCyrillic(raw))) return raw;

  return t(raw ? "card.localizedDesc" : "card.fallbackDesc", {
    name: displayName(service, lang),
    start: startLabel.toLowerCase(),
  });
}

/** Примечание Servo: в EN-режиме не подставляем русский текст вместо noteEn. */
export function serviceNote(
  service: Pick<ServiceInfo, "note" | "noteEn">,
  lang: Lang
): string {
  return lang === "en" ? service.noteEn : service.note;
}

/** Ключ перевода для состояния службы. */
export function statusKey(
  service: Pick<ServiceInfo, "status" | "startType">
): string {
  if (service.startType === "disabled") return "status.disabled";
  switch (service.status) {
    case "running":
      return "status.running";
    case "start_pending":
      return "status.startPending";
    case "stop_pending":
      return "status.stopPending";
    case "paused":
    case "pause_pending":
    case "continue_pending":
      return "status.paused";
    default:
      return "status.stopped";
  }
}

/**
 * Текст для поиска по службам. В EN-режиме русское описание не участвует,
 * но техническое и исходное имя остаются доступными для поиска.
 */
export function serviceSearchText(service: ServiceInfo, lang: Lang): string {
  const rawDescription = service.description.trim();
  const description =
    lang === "en" && hasCyrillic(rawDescription) ? "" : rawDescription;
  const note = serviceNote(service, lang);
  const noteExtra = lang === "en" ? "" : service.noteEn;

  return [
    displayName(service, lang),
    service.name,
    service.displayName,
    description,
    note,
    noteExtra,
  ]
    .filter(Boolean)
    .join("\n")
    .toLowerCase();
}
