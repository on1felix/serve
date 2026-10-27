import { useState } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, Loader2, ShieldAlert, X } from "lucide-react";
import type { ServiceInfo } from "../types";
import { useI18n } from "../i18n";
import {
  displayDescription,
  displayName,
  serviceNote,
  startTypeKeys,
} from "../serviceText";

interface Props {
  service: ServiceInfo;
  busy: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function ConfirmDialog({ service, busy, onCancel, onConfirm }: Props) {
  const [ack, setAck] = useState(false);
  const { t, lang } = useI18n();
  const title = displayName(service, lang);
  const startLabel = `${t(startTypeKeys[service.startType])}${
    service.delayed && service.startType === "auto" ? t("start.delayedSuffix") : ""
  }`;
  const description = displayDescription(service, lang, t, startLabel);
  const note = serviceNote(service, lang);

  return (
    <motion.div
      className="fixed inset-0 z-50 grid place-items-center bg-black/65 p-6 backdrop-blur-[3px]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onCancel}
    >
      <motion.div
        className="panel w-full max-w-[540px] overflow-hidden"
        initial={{ opacity: 0, y: 14, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 8, scale: 0.98 }}
        transition={{ duration: 0.18, ease: "easeOut" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3 border-b border-line/70 bg-bad/[0.05] px-5 py-4">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-bad/25 bg-bad/10">
            <ShieldAlert size={18} className="text-bad" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-[15px] font-semibold text-ink">{t("confirm.title")}</h2>
            <p className="mt-1 text-[12px] leading-relaxed text-muted">{t("confirm.text")}</p>
          </div>
          <button
            onClick={onCancel}
            aria-label={t("common.close")}
            className="grid h-7 w-7 place-items-center rounded-md text-dim transition-colors hover:bg-white/[0.07] hover:text-ink"
          >
            <X size={15} />
          </button>
        </div>

        <div className="space-y-3 px-5 py-4">
          <div className="rounded-xl border-2 border-line bg-white/[0.02] px-3 py-2.5">
            <p className="text-[13px] font-medium text-ink">{title}</p>
            <p className="mt-0.5 font-mono text-[11.5px] text-dim">{service.name}</p>
            <p className="mt-2 line-clamp-3 text-[12px] leading-relaxed text-muted">
              {description}
            </p>
          </div>

          {note && (
            <div className="flex items-start gap-2 rounded-xl border border-warn/20 bg-warn/[0.05] px-3 py-2 text-[12px] leading-relaxed text-warn/90">
              <AlertTriangle size={13} className="mt-[1px] shrink-0" />
              <span>{note}</span>
            </div>
          )}

          <ul className="space-y-1.5 text-[12px] leading-relaxed text-muted">
            <li className="flex gap-2">
              <span className="mt-[6px] h-1 w-1 shrink-0 rounded-full bg-bad/70" />
              {t("confirm.willBreak")}
            </li>
            <li className="flex gap-2">
              <span className="mt-[6px] h-1 w-1 shrink-0 rounded-full bg-bad/70" />
              {t("confirm.reversible")}
            </li>
          </ul>

          <label className="flex cursor-pointer select-none items-start gap-2.5 rounded-xl border-2 border-line bg-white/[0.02] px-3 py-2.5 transition-colors hover:border-line2">
            <input
              type="checkbox"
              checked={ack}
              onChange={(e) => setAck(e.target.checked)}
              className="mt-[2px] h-3.5 w-3.5 cursor-pointer accent-[#f26d6d]"
            />
            <span className="text-[12px] leading-relaxed text-muted">{t("confirm.ack")}</span>
          </label>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-line/70 bg-white/[0.015] px-5 py-3">
          <button onClick={onCancel} className="btn btn-ghost px-3.5">
            {t("common.cancel")}
          </button>
          <button
            onClick={onConfirm}
            disabled={!ack || busy}
            className="btn btn-danger px-3.5"
          >
            {busy ? <Loader2 size={12} className="animate-spin" /> : <ShieldAlert size={12} />}
            {t("confirm.action")}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
