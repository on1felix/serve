import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { motion } from "framer-motion";
import {
  Bot,
  Info,
  Loader2,
  RefreshCw,
  Search,
  SearchX,
  Sparkles,
  Timer,
  WifiOff,
  X,
} from "lucide-react";
import type { ServiceInfo } from "../types";
import { useI18n } from "../i18n";
import { openExternal } from "../api";
import {
  displayDescription,
  displayName,
  serviceNote,
  startTypeKeys,
  statusKey,
} from "../serviceText";
import { AiLookupError, lookupServiceInfo, type AiInfo } from "../online";

type LookupStatus = "idle" | "loading" | "ready" | "empty" | "error";

interface Props {
  service: ServiceInfo;
  onClose: () => void;
}

export default function ServiceInfoDialog({ service, onClose }: Props) {
  const { t, lang, locale } = useI18n();
  const [status, setStatus] = useState<LookupStatus>("idle");
  const [info, setInfo] = useState<AiInfo | null>(null);
  const [checkedAt, setCheckedAt] = useState<number | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [retryIn, setRetryIn] = useState(0);
  const [rateLimited, setRateLimited] = useState(false);
  const [asked, setAsked] = useState(false);

  const title = displayName(service, lang);
  const startLabel = `${t(startTypeKeys[service.startType])}${
    service.delayed && service.startType === "auto" ? t("start.delayedSuffix") : ""
  }`;
  const description = displayDescription(service, lang, t, startLabel);
  const note = serviceNote(service, lang);
  const statusLabel = t(statusKey(service));

  useEffect(() => {
    const controller = new AbortController();

    if (!asked) {
      setStatus("idle");
      setInfo(null);
      setCheckedAt(null);
      setRetryIn(0);
      setRateLimited(false);
      return () => controller.abort();
    }

    setStatus("loading");
    setInfo(null);
    setCheckedAt(null);
    setRetryIn(0);
    setRateLimited(false);

    lookupServiceInfo(service, lang, controller.signal)
      .then((result) => {
        if (controller.signal.aborted) return;
        setCheckedAt(Date.now());
        if (result) {
          setInfo(result);
          setStatus("ready");
        } else {
          setStatus("empty");
        }
      })
      .catch((error) => {
        if (controller.signal.aborted) return;
        setCheckedAt(Date.now());
        if (error instanceof AiLookupError && error.retryAfter !== null) {
          setRateLimited(true);
          setRetryIn(error.retryAfter);
        }
        setStatus("error");
      });

    return () => controller.abort();
    // service обновляется автообновлением; перезапрашиваем только при
    // смене самой службы или языка.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [asked, service.name, lang, attempt]);

  useEffect(() => {
    setAsked(false);
    setAttempt(0);
    setStatus("idle");
    setInfo(null);
    setCheckedAt(null);
    setRetryIn(0);
    setRateLimited(false);
  }, [service.name, lang]);

  useEffect(() => {
    if (retryIn <= 0) return;
    const timer = window.setTimeout(
      () => setRetryIn((value) => Math.max(0, value - 1)),
      1000
    );
    return () => window.clearTimeout(timer);
  }, [retryIn]);

  const statusText =
    status === "idle"
      ? ""
      : status === "loading"
        ? t("online.loading")
        : status === "ready"
          ? t("online.source")
          : status === "empty"
            ? t("online.emptyShort")
            : t("online.errorShort");

  const canRetry = status === "empty" || status === "error";
  const retryLabel =
    retryIn > 0
      ? t("online.retryIn", { seconds: retryIn })
      : t("online.retry");

  return (
    <motion.div
      className="fixed inset-0 z-[80] grid place-items-center bg-black/60 p-4 backdrop-blur-[6px]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label={t("online.title")}
        className="flex max-h-[86vh] w-full max-w-[720px] flex-col overflow-hidden rounded-2xl border border-line2/45 bg-panel/85 shadow-panel backdrop-blur-2xl"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.14, ease: "easeOut" }}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start gap-3 border-b border-line/50 bg-white/[0.015] px-5 py-4">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-accent/25 bg-accent/10">
            <Bot size={18} className="text-accent" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-[15px] font-semibold text-ink">{t("online.title")}</h2>
            <p className="mt-0.5 truncate text-[12px] text-muted">
              {title}
              <span className="ml-1.5 font-mono text-dim">· {service.name}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label={t("common.close")}
            className="grid h-7 w-7 shrink-0 place-items-center rounded-md text-dim transition-colors hover:bg-white/[0.07] hover:text-ink"
          >
            <X size={15} />
          </button>
        </div>

        <div className="overflow-y-auto px-5 py-4">
          <section>
            <SectionTitle icon={<Info size={13} />}>{t("online.local")}</SectionTitle>
            <p className="mt-2 text-[12px] leading-relaxed text-muted">{description}</p>

            <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2.5 sm:grid-cols-3">
              <Field label={t("details.serviceName")} value={service.name} mono />
              <Field label={t("online.displayName")} value={title} />
              <Field label={t("details.status")} value={statusLabel} />
              <Field label={t("details.startup")} value={startLabel} />
              <Field
                label={t("details.pid")}
                value={service.pid > 0 ? String(service.pid) : "—"}
                mono
              />
              <Field label={t("details.account")} value={service.account || "—"} mono />
              <Field
                label={t("details.category")}
                value={t(
                  service.isSystem ? "card.categoryWindows" : "card.categoryThirdParty"
                )}
              />
              <Field label={t("online.verdict")} value={t(`verdict.${service.verdict}`)} />
              <div className="col-span-2 sm:col-span-3">
                <Field label={t("details.binary")} value={service.binaryPath || "—"} mono />
              </div>
            </div>

            {note && (
              <div className="mt-3 flex items-start gap-2 rounded-lg border border-line/60 bg-white/[0.025] px-3 py-2 text-[12px] leading-relaxed text-muted">
                <Info size={12} className="mt-[2px] shrink-0 text-dim" />
                <span>{note}</span>
              </div>
            )}
          </section>

          <div className="my-4 h-px bg-line/40" />

          <section>
            <div className="flex flex-wrap items-center gap-2">
              <SectionTitle icon={<Sparkles size={13} />}>
                {t("online.internet")}
              </SectionTitle>
              <span className="ml-auto text-[10.5px] text-dim">{statusText}</span>
            </div>

            {status === "idle" && (
              <div className="mt-3 rounded-xl border border-line/60 bg-white/[0.02] px-3 py-3">
                <p className="text-[12px] leading-relaxed text-muted">
                  {t("online.askAiHint")}
                </p>
                <button
                  onClick={() => setAsked(true)}
                  className="btn btn-ghost mt-3 px-3"
                >
                  <Sparkles size={12} className="text-accent" />
                  {t("online.askAi")}
                </button>
              </div>
            )}

            {status === "loading" && <LookupSkeleton />}

            {status === "ready" && info && (
              <div className="mt-3 flex gap-2.5 rounded-xl border border-line/60 bg-white/[0.02] px-3 py-3">
                <div className="grid h-7 w-7 shrink-0 place-items-center rounded-lg border border-accent/20 bg-accent/10">
                  <Bot size={14} className="text-accent" />
                </div>
                <p className="min-w-0 whitespace-pre-line text-[12px] leading-relaxed text-muted">
                  {info.text}
                </p>
              </div>
            )}

            {status === "empty" && (
              <div className="mt-3 flex items-start gap-2 rounded-xl border border-line/60 bg-white/[0.02] px-3 py-2.5 text-[12px] leading-relaxed">
                <SearchX size={15} className="mt-[1px] shrink-0 text-dim" />
                <div>
                  <p className="font-medium text-ink">{t("online.notFoundTitle")}</p>
                  <p className="mt-0.5 text-muted">{t("online.notFoundText")}</p>
                </div>
              </div>
            )}

            {status === "error" && (
              <div
                className={`mt-3 flex items-start gap-2 rounded-xl border px-3 py-2.5 text-[12px] leading-relaxed ${
                  rateLimited
                    ? "border-warn/25 bg-warn/[0.06]"
                    : "border-bad/25 bg-bad/[0.06]"
                }`}
              >
                {rateLimited ? (
                  <Timer size={15} className="mt-[1px] shrink-0 text-warn" />
                ) : (
                  <WifiOff size={15} className="mt-[1px] shrink-0 text-bad" />
                )}
                <div>
                  <p
                    className={`font-medium ${
                      rateLimited ? "text-warn" : "text-bad"
                    }`}
                  >
                    {t(rateLimited ? "online.busyTitle" : "online.errorTitle")}
                  </p>
                  <p className="mt-0.5 text-muted">
                    {rateLimited
                      ? t("online.busyText", { seconds: retryIn })
                      : t("online.errorText")}
                  </p>
                </div>
              </div>
            )}

            {canRetry && (
              <button
                onClick={() => setAttempt((value) => value + 1)}
                disabled={retryIn > 0}
                className="btn btn-ghost mt-3"
              >
                <RefreshCw size={12} />
                {retryLabel}
              </button>
            )}
          </section>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line/50 bg-white/[0.015] px-5 py-3">
          <p className="text-[11px] text-dim">
            {t("online.offline")}
            {checkedAt && (
              <span className="ml-2 text-dim/70">
                {t("online.checked", {
                  time: new Date(checkedAt).toLocaleTimeString(locale),
                })}
              </span>
            )}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => void openExternal(webSearchUrl(service, lang))}
              data-tip={t("online.searchWebTitle")}
              className="btn btn-ghost h-[30px] px-3 transition-none"
            >
              <Search size={12} />
              {t("online.searchWeb")}
            </button>
            <button onClick={onClose} className="btn btn-ghost h-[30px] px-3.5 transition-none">
              {t("common.close")}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function webSearchUrl(service: ServiceInfo, lang: "ru" | "en"): string {
  const title = displayName(service, lang);
  const query =
    lang === "ru"
      ? `${service.name} ${title} — что это за служба Windows, что она делает и что будет, если её отключить?`
      : `${service.name} ${title} Windows service — what is it, what does it do, and what happens if I disable it?`;
  return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
}

function SectionTitle({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <h3 className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-dim">
      {icon}
      {children}
    </h3>
  );
}

function Field({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="min-w-0">
      <p className="text-[10.5px] uppercase tracking-wider text-dim">{label}</p>
      <p
        className={`mt-0.5 break-all text-[11.5px] leading-relaxed text-muted ${
          mono ? "font-mono" : ""
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function LookupSkeleton() {
  return (
    <div className="mt-3">
      <div className="flex items-center gap-2 text-[12px] text-muted">
        <Loader2 size={14} className="animate-spin text-accent" />
        <span>Pollinations</span>
      </div>
      <div className="mt-3 space-y-2">
        <div className="h-2.5 w-4/5 animate-pulse rounded bg-white/[0.06]" />
        <div className="h-2.5 w-full animate-pulse rounded bg-white/[0.05]" />
        <div className="h-2.5 w-2/3 animate-pulse rounded bg-white/[0.04]" />
      </div>
    </div>
  );
}
