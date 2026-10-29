import { useEffect, useState } from "react";
import type { MouseEvent } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { getVersion } from "@tauri-apps/api/app";
import { motion } from "framer-motion";
import { Loader2, Minus, ServerCog, ShieldCheck, ShieldOff, Square, X } from "lucide-react";

import { isTauri } from "../api";
import { useI18n } from "../i18n";
import type { Lang } from "../i18n";

interface Props {
  admin: boolean;
  onElevate: () => void;
  elevating: boolean;
}

export default function TitleBar({ admin, onElevate, elevating }: Props) {
  const win = isTauri() ? getCurrentWindow() : null;
  const { t } = useI18n();
  const [version, setVersion] = useState("");

  useEffect(() => {
    if (!isTauri()) return;
    getVersion()
      .then(setVersion)
      .catch(() => undefined);
  }, []);

  const isControl = (target: EventTarget | null) =>
    target instanceof Element && !!target.closest("button, a, input, select");

  const startDrag = (event: MouseEvent<HTMLElement>) => {
    if (isControl(event.target)) return;
    event.preventDefault();
    void win?.startDragging().catch(() => undefined);
  };

  const toggleMaximize = () => void win?.toggleMaximize().catch(() => undefined);

  const onDoubleClick = (event: MouseEvent<HTMLElement>) => {
    if (isControl(event.target)) return;
    toggleMaximize();
  };

  return (
    <header
      onMouseDown={startDrag}
      onDoubleClick={onDoubleClick}
      className="relative z-30 flex h-10 shrink-0 select-none items-center justify-between bg-[#121317]/80 pl-3 pr-4 backdrop-blur"
    >
      <div className="flex min-w-0 items-center gap-2 pointer-events-none">
        <div className="grid h-5 w-5 place-items-center rounded-[5px] bg-gradient-to-br from-accent to-[#5b4bd6] shadow-[0_4px_14px_-4px_rgba(139,124,246,0.9)]">
          <ServerCog size={12.5} className="text-white" strokeWidth={2.2} />
        </div>
        <span className="text-[13px] font-semibold tracking-wide text-ink">Servo</span>
        <span className="hidden text-[11.5px] text-dim sm:inline">{t("app.subtitle")}</span>
        {version && (
          <span className="rounded border border-line/70 bg-white/[0.03] px-1.5 py-[1px] font-mono text-[10.5px] text-dim/90">
            v{version}
          </span>
        )}
      </div>

      <div className="flex items-center gap-3">
        {admin ? (
          <span className="inline-flex items-center gap-1.5 rounded-md border border-ok/20 bg-ok/[0.07] px-2 py-1 text-[11.5px] font-medium text-ok">
            <ShieldCheck size={12} />
            {t("app.admin")}
          </span>
        ) : (
          <button
            onClick={onElevate}
            disabled={elevating}
            className="inline-flex items-center gap-1.5 rounded-md border border-warn/25 bg-warn/[0.08] px-2 py-1 text-[11.5px] font-medium text-warn transition-colors hover:border-warn/50 hover:bg-warn/[0.14] disabled:opacity-50"
          >
            {elevating ? (
              <Loader2 size={12} className="animate-spin" />
            ) : (
              <ShieldOff size={12} />
            )}
            {elevating ? t("app.elevating") : t("app.elevate")}
          </button>
        )}

        <LangToggle />

        <div className="flex items-center gap-1">
          <button
            onClick={() => void win?.minimize().catch(() => undefined)}
            aria-label={t("window.minimize")}
            className="flex h-8 w-8 items-center justify-center rounded transition-colors duration-150 hover:bg-white/10"
          >
            <Minus size={16} className="text-[#656571]" />
          </button>
          <button
            onClick={toggleMaximize}
            aria-label={t("window.maximize")}
            className="flex h-8 w-8 items-center justify-center rounded transition-colors duration-150 hover:bg-white/10"
          >
            <Square size={14} className="text-[#656571]" />
          </button>
          <button
            onClick={() => void win?.close().catch(() => undefined)}
            aria-label={t("window.close")}
            className="group flex h-8 w-8 items-center justify-center rounded transition-colors duration-150 hover:bg-[#ff3b30]/30"
          >
            <X
              size={16}
              className="text-[#656571] transition-colors duration-150 group-hover:text-[#ff6666]"
            />
          </button>
        </div>
      </div>

      <span className="divider pointer-events-none absolute inset-x-3 bottom-0" />
    </header>
  );
}

function LangToggle() {
  const { lang, setLang, t } = useI18n();

  const tone = (value: Lang, active: boolean) => {
    if (value === "ru") {
      return active
        ? "text-[#4ae072]"
        : "text-muted hover:text-[#4ae072]/70";
    }
    return active ? "text-[#ff7b1d]" : "text-muted hover:text-[#ff7b1d]/70";
  };

  return (
    <div
      className="relative flex select-none items-center rounded-md bg-[#1c1c22]/90 p-0.5"
      aria-label={t("lang.title")}
    >
      <motion.span
        initial={false}
        animate={{ x: lang === "en" ? 32 : 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className={`absolute bottom-[2px] left-[2px] top-[2px] w-8 rounded-[5px] border-2 bg-black/25 transition-[border-color] duration-300 ${
          lang === "ru" ? "border-[#45e06a]/50" : "border-[#ff7b1d]/50"
        }`}
      />
      {(["ru", "en"] as const).map((value) => (
        <button
          key={value}
          onClick={() => setLang(value)}
          aria-pressed={lang === value}
          className={`relative z-10 grid h-6 w-8 cursor-pointer place-items-center text-[11px] font-bold uppercase tracking-wide transition-colors duration-150 ${tone(
            value,
            lang === value
          )}`}
        >
          {value}
        </button>
      ))}
    </div>
  );
}
