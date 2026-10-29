import { memo, useState } from "react";
import type { ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  ChevronDown,
  Globe,
  Info,
  Lightbulb,
  Loader2,
  Lock,
  Play,
  Power,
  PowerOff,
  ShieldCheck,
  Square,
} from "lucide-react";
import type { ServiceInfo, Verdict } from "../types";
import { useI18n } from "../i18n";
import {
  displayDescription,
  displayName,
  serviceNote,
  startTypeKeys,
} from "../serviceText";
import Dropdown from "./Dropdown";

type StartupKind = "auto" | "auto_delayed" | "manual" | "disabled";

interface Props {
  service: ServiceInfo;
  busy: boolean;
  admin: boolean;
  onDisable: (s: ServiceInfo) => void;
  onEnable: (s: ServiceInfo) => void;
  onStart: (s: ServiceInfo) => void;
  onStop: (s: ServiceInfo) => void;
  onStartup: (s: ServiceInfo, kind: StartupKind) => void;
  onCheckOnline: (s: ServiceInfo) => void;
}

const verdictMeta: Record<
  Verdict,
  { labelKey: string; hintKey: string; className: string; icon: typeof Info }
> = {
  safe: {
    labelKey: "verdict.safe",
    hintKey: "verdict.hint.safe",
    className: "border-ok/20 bg-ok/[0.06] text-ok",
    icon: Lightbulb,
  },
  caution: {
    labelKey: "verdict.caution",
    hintKey: "verdict.hint.caution",
    className: "border-warn/20 bg-warn/[0.06] text-warn",
    icon: AlertTriangle,
  },
  critical: {
    labelKey: "verdict.critical",
    hintKey: "verdict.hint.critical",
    className: "border-bad/25 bg-bad/[0.07] text-bad",
    icon: ShieldCheck,
  },
  unknown: {
    labelKey: "verdict.unknown",
    hintKey: "verdict.hint.unknown",
    className: "border-line bg-white/[0.02] text-dim",
    icon: Info,
  },
};

function dotMeta(service: ServiceInfo) {
  if (service.startType === "disabled") {
    return {
      dot: "bg-bad",
      glow: "shadow-[0_0_10px_rgba(242,109,109,0.75)]",
      bar: "bg-bad/70",
      labelKey: "status.disabled",
      pill: "border-bad/25 bg-bad/[0.08] text-bad",
      ring: "",
    };
  }
  if (service.status === "running") {
    return {
      dot: "bg-ok",
      glow: "shadow-[0_0_10px_rgba(61,220,132,0.8)]",
      bar: "bg-ok/70",
      labelKey: "status.running",
      pill: "border-ok/25 bg-ok/[0.08] text-ok",
      ring: "animate-pulse-ring",
    };
  }
  if (service.status === "start_pending" || service.status === "stop_pending") {
    return {
      dot: "bg-accent",
      glow: "shadow-[0_0_10px_rgba(139,124,246,0.8)]",
      bar: "bg-accent/70",
      labelKey: service.status === "start_pending" ? "status.startPending" : "status.stopPending",
      pill: "border-accent/25 bg-accent/[0.08] text-accent",
      ring: "animate-pulse-ring-accent",
    };
  }
  if (service.status === "paused") {
    return {
      dot: "bg-warn",
      glow: "shadow-[0_0_8px_rgba(245,181,68,0.5)]",
      bar: "bg-warn/60",
      labelKey: "status.paused",
      pill: "border-warn/20 bg-warn/[0.06] text-warn",
      ring: "",
    };
  }
  return {
    dot: "bg-warn",
    glow: "shadow-[0_0_8px_rgba(245,181,68,0.5)]",
    bar: "bg-warn/60",
    labelKey: "status.stopped",
    pill: "border-warn/20 bg-warn/[0.06] text-warn",
    ring: "",
  };
}

function TipWrap({ tip, children }: { tip?: string; children: ReactNode }) {
  if (!tip) return <>{children}</>;
  return (
    <span data-tip={tip} className="inline-flex">
      {children}
    </span>
  );
}

function ServiceCard({
  service,
  busy,
  admin,
  onDisable,
  onEnable,
  onStart,
  onStop,
  onStartup,
  onCheckOnline,
}: Props) {
  const [open, setOpen] = useState(false);
  const { t, lang } = useI18n();
  const status = dotMeta(service);
  const statusLabel = t(status.labelKey);
  const verdict = verdictMeta[service.verdict];
  const VerdictIcon = verdict.icon;

  const isDisabled = service.startType === "disabled";
  const running = service.status === "running" || service.status === "start_pending";
  const locked = busy || (admin && !service.canChange);
  const selectable =
    service.startType === "auto" || service.startType === "manual" || service.startType === "disabled";

  const title = displayName(service, lang);
  const startLabel = t(startTypeKeys[service.startType]);
  const delayedLabel =
    service.delayed && service.startType === "auto" ? t("start.delayedSuffix") : "";
  const fullStart = `${startLabel}${delayedLabel}`;

  const description = displayDescription(service, lang, t, fullStart);

  const note = serviceNote(service, lang);

  const noteStyle =
    service.verdict === "safe"
      ? "border-ok/15 bg-ok/[0.04] text-ok/90"
      : service.verdict === "caution"
        ? "border-warn/15 bg-warn/[0.04] text-warn/90"
        : service.verdict === "critical"
          ? "border-bad/15 bg-bad/[0.04] text-bad/90"
          : "border-line bg-white/[0.02] text-muted";

  const changeTip =
    admin && !service.canChange ? t("card.changeUnsupported") : undefined;

  return (
    <article
      className={`panel animate-fade-in relative overflow-hidden px-4 py-3.5 pl-5 transition-colors duration-150 hover:border-line2 ${
        busy ? "opacity-70" : ""
      }`}
    >
      <span className={`absolute inset-y-3 left-0 w-[3px] rounded-full ${status.bar}`} />

      <div className="flex gap-3.5">
        <div className="pt-[7px]">
          <span
            className={`block h-2.5 w-2.5 rounded-full ${status.dot} ${status.glow} ${status.ring}`}
          />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
            <div className="min-w-0">
              <h3 className="flex items-center gap-1.5 text-[14px] font-semibold leading-snug text-ink">
                <span className="truncate">{title}</span>
                {service.isSystem && (
                  <ShieldCheck
                    size={13}
                    className="shrink-0 text-muted/80"
                    aria-label={t("card.systemAria")}
                    data-tip={t("card.systemAria")}
                  />
                )}
                {service.isCritical && (
                  <Lock
                    size={12}
                    className="shrink-0 text-bad/80"
                    aria-label={t("card.criticalAria")}
                    data-tip={t("card.criticalAria")}
                  />
                )}
              </h3>
              <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[11.5px] text-dim">
                <span className="truncate">{service.name}</span>
                {service.pid > 0 && <span className="text-dim/70">PID {service.pid}</span>}
                <span className="text-dim/40">·</span>
                <span>
                  {startLabel}
                  {delayedLabel}
                </span>
              </div>
            </div>

            <span
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-md border px-2 py-[3px] text-[11.5px] font-medium ${status.pill}`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
              {statusLabel}
            </span>
          </div>

          <p
            className={`mt-1.5 text-[12px] leading-relaxed text-muted ${
              open ? "" : "line-clamp-2"
            }`}
          >
            {description}
          </p>

          {note && (
            <div
              className={`mt-2 flex items-start gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11.5px] leading-relaxed ${noteStyle}`}
            >
              <Info size={11} className="mt-[2px] shrink-0" />
              <span>{note}</span>
            </div>
          )}

          <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1.5">
              {service.isCritical ? (
                <TipWrap tip={t("card.protectedTitle")}>
                  <button disabled className="btn btn-ghost">
                    <Lock size={11} />
                    {t("card.protected")}
                  </button>
                </TipWrap>
              ) : isDisabled ? (
                <TipWrap tip={changeTip}>
                  <button
                    onClick={() => onEnable(service)}
                    disabled={locked}
                    className="btn btn-ok"
                  >
                    {busy ? <Loader2 size={12} className="animate-spin" /> : <Power size={12} />}
                    {t("card.enable")}
                  </button>
                </TipWrap>
              ) : (
                <TipWrap tip={changeTip}>
                  <button
                    onClick={() => onDisable(service)}
                    disabled={locked}
                    className="btn btn-danger"
                  >
                    {busy ? <Loader2 size={12} className="animate-spin" /> : <PowerOff size={12} />}
                    {t("card.disable")}
                  </button>
                </TipWrap>
              )}

              {running ? (
                <TipWrap tip={service.canStop ? undefined : t("card.stopUnsupported")}>
                  <button
                    onClick={() => onStop(service)}
                    disabled={locked || !service.canStop}
                    className="btn btn-ghost"
                  >
                    <Square size={10} />
                    {t("card.stop")}
                  </button>
                </TipWrap>
              ) : (
                <TipWrap tip={isDisabled ? t("card.startDisabled") : undefined}>
                  <button
                    onClick={() => onStart(service)}
                    disabled={locked || isDisabled}
                    className="btn btn-ghost"
                  >
                    <Play size={11} />
                    {t("card.start")}
                  </button>
                </TipWrap>
              )}

              {selectable && (
                <Dropdown<StartupKind>
                  value={service.startType as StartupKind}
                  options={[
                    { value: "auto", label: t("start.auto") },
                    { value: "manual", label: t("start.manual") },
                    {
                      value: "disabled",
                      label: t("start.disabled"),
                      disabled: service.isCritical,
                    },
                  ]}
                  onChange={(kind) => onStartup(service, kind)}
                  disabled={locked}
                  ariaLabel={t("card.startupType")}
                  className="min-w-[100px]"
                  menuMinWidth={150}
                />
              )}

              <button
                onClick={() => onCheckOnline(service)}
                className="btn btn-ghost"
              >
                <Globe size={12} />
                {t("online.button")}
              </button>

              <button
                onClick={() => setOpen((v) => !v)}
                className="btn border-transparent bg-transparent px-1.5 text-dim hover:text-ink"
                data-tip={open ? t("card.collapse") : t("card.details")}
                aria-label={open ? t("card.collapse") : t("card.details")}
              >
                <ChevronDown
                  size={13}
                  className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}
                />
              </button>
            </div>

            <span
              className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[11px] font-medium ${verdict.className}`}
              data-tip={t(verdict.hintKey)}
            >
              <VerdictIcon size={10} />
              {t(verdict.labelKey)}
            </span>
          </div>

          <AnimatePresence initial={false}>
            {open && (
              <motion.div
                key="details"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2, ease: "easeInOut" }}
                className="overflow-hidden"
              >
                <div className="mt-3 h-0.5 w-[calc(100%-3rem)] rounded-full bg-line2/70" />
                <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-[11.5px] sm:grid-cols-3">
                  <Detail label={t("details.serviceName")} value={service.name} mono />
                  <Detail label={t("details.status")} value={statusLabel} />
                  <Detail
                    label={t("details.startup")}
                    value={fullStart}
                  />
                  <Detail
                    label={t("details.pid")}
                    value={service.pid > 0 ? String(service.pid) : "—"}
                    mono
                  />
                  <Detail label={t("details.account")} value={service.account || "—"} mono />
                  <Detail
                    label={t("details.category")}
                    value={t(
                      service.isSystem ? "card.categoryWindows" : "card.categoryThirdParty"
                    )}
                  />
                  <div className="col-span-2 sm:col-span-3">
                    <Detail
                      label={t("details.binary")}
                      value={service.binaryPath || "—"}
                      mono
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </article>
  );
}

function Detail({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
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

export default memo(ServiceCard);
