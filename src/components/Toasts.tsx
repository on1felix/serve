import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from "lucide-react";
import type { Toast } from "../types";
import { useI18n } from "../i18n";

interface Props {
  toasts: Toast[];
  onDismiss: (id: string) => void;
}

const styles = {
  ok: { border: "border-ok/25", bg: "bg-[#16201b]", icon: CheckCircle2, color: "text-ok" },
  error: { border: "border-bad/30", bg: "bg-[#221618]", icon: XCircle, color: "text-bad" },
  warn: { border: "border-warn/25", bg: "bg-[#221d14]", icon: AlertTriangle, color: "text-warn" },
  info: { border: "border-line", bg: "bg-panel", icon: Info, color: "text-accent" },
} as const;

export default function Toasts({ toasts, onDismiss }: Props) {
  const { t } = useI18n();
  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[60] flex w-[370px] flex-col gap-2">
      <AnimatePresence initial={false}>
        {toasts.map((toast) => {
          const s = styles[toast.kind];
          const Icon = s.icon;
          return (
            <motion.div
              key={toast.id}
              layout
              initial={{ opacity: 0, x: 30, scale: 0.98 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 30, scale: 0.98 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className={`pointer-events-auto flex items-start gap-2.5 rounded-xl border-2 ${s.border} ${s.bg} px-3 py-2.5 shadow-panel`}
            >
              <Icon size={15} className={`mt-[1px] shrink-0 ${s.color}`} />
              <div className="min-w-0 flex-1">
                <p className="text-[12px] font-medium leading-snug text-ink">{toast.title}</p>
                {toast.text && (
                  <p className="mt-1 break-words text-[11.5px] leading-relaxed text-muted">
                    {toast.text}
                  </p>
                )}
              </div>
              <button
                onClick={() => onDismiss(toast.id)}
                className="grid h-5 w-5 shrink-0 place-items-center rounded text-dim transition-colors hover:bg-white/[0.08] hover:text-ink"
                aria-label={t("common.close")}
              >
                <X size={12} />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
