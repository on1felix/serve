import { startTransition, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { AnimatePresence } from "framer-motion";
import { getCurrentWindow } from "@tauri-apps/api/window";
import {
  Activity,
  AlertTriangle,
  CircleSlash,
  Loader2,
  Power,
  RefreshCw,
  Search,
  SearchX,
  ShieldAlert,
  Sparkles,
  X,
} from "lucide-react";

import { api, isTauri } from "./api";
import type { ActionOutcome, FilterKey, ServiceInfo, SortKey, Toast } from "./types";
import TitleBar from "./components/TitleBar";
import Sidebar from "./components/Sidebar";
import ServiceCard from "./components/ServiceCard";
import ConfirmDialog from "./components/ConfirmDialog";
import ServiceInfoDialog from "./components/ServiceInfoDialog";
import Toasts from "./components/Toasts";
import TooltipLayer from "./components/TooltipLayer";
import Dropdown from "./components/Dropdown";
import { localizeBackend, useI18n } from "./i18n";
import { displayName, serviceSearchText } from "./serviceText";

const PAGE = 80;

// Автообновление должно быть заметным, но не мешать: держим иконку
// вращающейся не меньше одного полного оборота.
const AUTO_SPIN_MS = 1000;

const filterTitleKeys: Record<FilterKey, string> = {
  all: "title.all",
  running: "title.running",
  stopped: "title.stopped",
  disabled: "title.disabled",
  system: "title.system",
  "third-party": "title.thirdParty",
  safe: "title.safe",
};

const statusRank: Record<string, number> = {
  running: 0,
  start_pending: 1,
  stop_pending: 2,
  stopped: 3,
  paused: 4,
};

const riskRank: Record<string, number> = { safe: 0, caution: 1, unknown: 2, critical: 3 };

function sameService(a: ServiceInfo, b: ServiceInfo): boolean {
  return (
    a.name === b.name &&
    a.displayName === b.displayName &&
    a.description === b.description &&
    a.status === b.status &&
    a.startType === b.startType &&
    a.delayed === b.delayed &&
    a.pid === b.pid &&
    a.canStop === b.canStop &&
    a.canChange === b.canChange &&
    a.isSystem === b.isSystem &&
    a.isCritical === b.isCritical &&
    a.verdict === b.verdict &&
    a.note === b.note &&
    a.noteEn === b.noteEn &&
    a.binaryPath === b.binaryPath &&
    a.account === b.account
  );
}

export default function App() {
  const { t, lang, locale } = useI18n();

  const [services, setServices] = useState<ServiceInfo[]>([]);
  const [admin, setAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [autoRefreshing, setAutoRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [elevating, setElevating] = useState(false);

  const [filter, setFilter] = useState<FilterKey>("all");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("name");
  const [visible, setVisible] = useState(PAGE);

  const [pending, setPending] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<ServiceInfo | null>(null);
  const [checking, setChecking] = useState<ServiceInfo | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [updatedAt, setUpdatedAt] = useState<number | null>(null);
  const [stuck, setStuck] = useState(false);

  const searchRef = useRef<HTMLInputElement>(null);
  const mainRef = useRef<HTMLElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const busyRef = useRef(false);
  const toastSeq = useRef(0);
  const servicesRef = useRef<ServiceInfo[]>([]);

  const pushToast = useCallback((toast: Omit<Toast, "id">) => {
    toastSeq.current += 1;
    const id = `t${toastSeq.current}`;
    setToasts((prev) => [...prev.slice(-3), { ...toast, id }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5600);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const load = useCallback(async (showSpinner: boolean, auto = false) => {
    const startedAt = performance.now();
    if (showSpinner) setLoading(true);
    else if (auto) setAutoRefreshing(true);
    else setRefreshing(true);
    try {
      const [list, isAdmin] = await Promise.all([api.listServices(), api.isAdmin()]);

      // Сохраняем ссылки на неизменившиеся службы: memo-карточки не
      // перерисовываются, и автообновление не вызывает рывков.
      const previous = servicesRef.current;
      const byName = new Map(previous.map((service) => [service.name, service]));
      const merged = list.map((service) => {
        const old = byName.get(service.name);
        return old && sameService(old, service) ? old : service;
      });
      const changed =
        merged.length !== previous.length || merged.some((service, i) => service !== previous[i]);

      servicesRef.current = merged;
      setAdmin(isAdmin);
      setError(null);

      if (!changed) {
        setUpdatedAt(Date.now());
      } else {
        const apply = () => {
          setServices(merged);
          setUpdatedAt(Date.now());
        };
        if (showSpinner) apply();
        else startTransition(apply);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
      if (auto) {
        const remain = AUTO_SPIN_MS - (performance.now() - startedAt);
        if (remain > 0) {
          await new Promise((resolve) => window.setTimeout(resolve, remain));
        }
        setAutoRefreshing(false);
      } else {
        setRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    void load(true);
  }, [load]);

  useEffect(() => {
    if (!isTauri()) return;
    const win = getCurrentWindow();
    void win.show().then(() => win.setFocus()).catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!isTauri()) return;
    void getCurrentWindow().setTitle(t("window.title")).catch(() => undefined);
  }, [t]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible" && !busyRef.current && !confirming && !checking) {
        void load(false, true);
      }
    }, 12_000);
    return () => window.clearInterval(timer);
  }, [load, confirming, checking]);

  useEffect(() => {
    busyRef.current = pending !== null;
  }, [pending]);

  useEffect(() => {
    setVisible(PAGE);
  }, [filter, query, sort]);

  useEffect(() => {
    const main = mainRef.current;
    const bar = barRef.current;
    if (!main || !bar) return;

    let frame = 0;
    const update = () => {
      frame = 0;
      setStuck(bar.getBoundingClientRect().top <= main.getBoundingClientRect().top + 1);
    };
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };

    update();
    main.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      main.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchRef.current?.focus();
        searchRef.current?.select();
      }
      if (e.key === "Escape") {
        setConfirming(null);
        setChecking(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const counts = useMemo(() => {
    const base: Record<FilterKey, number> = {
      all: services.length,
      running: 0,
      stopped: 0,
      disabled: 0,
      system: 0,
      "third-party": 0,
      safe: 0,
    };
    for (const s of services) {
      if (s.status === "running") base.running += 1;
      if (s.status !== "running" && s.startType !== "disabled") base.stopped += 1;
      if (s.startType === "disabled") base.disabled += 1;
      if (s.isSystem) base.system += 1;
      if (!s.isSystem) base["third-party"] += 1;
      if (s.verdict === "safe") base.safe += 1;
    }
    return base;
  }, [services]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = services.filter((s) => {
      if (filter === "running" && s.status !== "running") return false;
      if (filter === "stopped" && (s.status === "running" || s.startType === "disabled")) return false;
      if (filter === "disabled" && s.startType !== "disabled") return false;
      if (filter === "system" && !s.isSystem) return false;
      if (filter === "third-party" && s.isSystem) return false;
      if (filter === "safe" && s.verdict !== "safe") return false;
      if (!q) return true;
      return serviceSearchText(s, lang).includes(q);
    });

    list.sort((a, b) => {
      if (sort === "status") {
        const d = (statusRank[a.status] ?? 9) - (statusRank[b.status] ?? 9);
        if (d !== 0) return d;
      }
      if (sort === "risk") {
        const d = (riskRank[a.verdict] ?? 9) - (riskRank[b.verdict] ?? 9);
        if (d !== 0) return d;
      }
      return displayName(a, lang).localeCompare(displayName(b, lang), locale);
    });
    return list;
  }, [services, filter, query, sort, locale, lang]);

  const runAction = useCallback(
    async (
      name: string,
      action: () => Promise<ActionOutcome>,
      successTitleKey: string,
      successTextKey: string,
      vars?: Record<string, string | number>
    ) => {
      setPending(name);
      try {
        const res = await action();
        if (res.warning) {
          pushToast({
            kind: "warn",
            title: t("toast.warningTitle"),
            text: localizeBackend(res.warning, lang),
          });
        } else {
          pushToast({
            kind: "ok",
            title: t(successTitleKey),
            text: t(successTextKey, vars),
          });
        }
        await load(false);
      } catch (e) {
        pushToast({
          kind: "error",
          title: t("toast.failed"),
          text: localizeBackend(e instanceof Error ? e.message : String(e), lang),
        });
      } finally {
        setPending(null);
      }
    },
    [lang, load, pushToast, t]
  );

  const requireAdmin = useCallback(() => {
    if (admin) return true;
    pushToast({
      kind: "warn",
      title: t("toast.adminTitle"),
      text: t("toast.adminText"),
    });
    return false;
  }, [admin, pushToast, t]);

  const handleDisable = useCallback(
    (s: ServiceInfo) => {
      if (!requireAdmin()) return;
      if (s.isCritical) {
        pushToast({
          kind: "error",
          title: t("toast.criticalTitle"),
          text: t("toast.criticalText"),
        });
        return;
      }
      if (s.isSystem) {
        setConfirming(s);
        return;
      }
      const vars = { name: displayName(s, lang) };
      void runAction(
        s.name,
        () => api.disable(s.name),
        "toast.disabledTitle",
        "toast.disabledText",
        vars
      );
    },
    [requireAdmin, runAction, pushToast, t, lang]
  );

  const confirmDisable = useCallback(() => {
    if (!confirming) return;
    const target = confirming;
    setConfirming(null);
    const vars = { name: displayName(target, lang) };
    void runAction(
      target.name,
      () => api.disable(target.name),
      "toast.systemDisabledTitle",
      "toast.systemDisabledText",
      vars
    );
  }, [confirming, runAction, lang]);

  const handleEnable = useCallback(
    (s: ServiceInfo) => {
      if (!requireAdmin()) return;
      void runAction(
        s.name,
        () => api.enable(s.name),
        "toast.enabledTitle",
        "toast.enabledText",
        { name: displayName(s, lang) }
      );
    },
    [requireAdmin, runAction, lang]
  );

  const handleStart = useCallback(
    (s: ServiceInfo) => {
      if (!requireAdmin()) return;
      void runAction(
        s.name,
        () => api.start(s.name),
        "toast.startedTitle",
        "toast.startedText",
        { name: displayName(s, lang) }
      );
    },
    [requireAdmin, runAction, lang]
  );

  const handleStop = useCallback(
    (s: ServiceInfo) => {
      if (!requireAdmin()) return;
      void runAction(
        s.name,
        () => api.stop(s.name),
        "toast.stoppedTitle",
        "toast.stoppedText",
        { name: displayName(s, lang) }
      );
    },
    [requireAdmin, runAction, lang]
  );

  const handleStartup = useCallback(
    (s: ServiceInfo, kind: "auto" | "auto_delayed" | "manual" | "disabled") => {
      if (!requireAdmin()) return;
      if (kind === "disabled") {
        handleDisable(s);
        return;
      }
      const vars = { name: displayName(s, lang) };
      if (kind === "manual") {
        void runAction(
          s.name,
          () => api.setStartup(s.name, kind),
          "toast.startupManualTitle",
          "toast.startupManualText",
          vars
        );
      } else {
        void runAction(
          s.name,
          () => api.setStartup(s.name, kind),
          "toast.startupTitle",
          "toast.startupText",
          vars
        );
      }
    },
    [requireAdmin, runAction, handleDisable, lang]
  );

  const elevate = useCallback(async () => {
    setElevating(true);
    try {
      await api.restartAsAdmin();
    } catch (e) {
      setElevating(false);
      pushToast({
        kind: "error",
        title: t("toast.elevateFailedTitle"),
        text: localizeBackend(e instanceof Error ? e.message : String(e), lang),
      });
    }
  }, [pushToast, t, lang]);

  const runningCount = counts.running;
  const disabledCount = counts.disabled;
  const safeCount = counts.safe;

  const shown = filtered.slice(0, visible);
  const checkedService = checking
    ? services.find((service) => service.name === checking.name) ?? checking
    : null;

  return (
    <div className="relative z-10 flex h-full flex-col">
      <TitleBar admin={admin} onElevate={() => void elevate()} elevating={elevating} />

      <div className="flex min-h-0 flex-1">
        <Sidebar
          filter={filter}
          onFilter={setFilter}
          counts={counts}
          total={services.length}
          admin={admin}
        />

        <main ref={mainRef} className="min-h-0 flex-1 overflow-y-auto">
          <div className="mx-auto max-w-[1120px] px-6 pb-20 pt-5">
            {!admin && !loading && (
              <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-warn/25 bg-warn/[0.05] px-4 py-3">
                <ShieldAlert size={17} className="shrink-0 text-warn" />
                <div className="min-w-0 flex-1">
                  <p className="text-[12px] font-medium text-warn">{t("app.limitedTitle")}</p>
                  <p className="mt-0.5 text-[12px] leading-relaxed text-muted">
                    {t("app.limitedText")}
                  </p>
                </div>
                <button onClick={() => void elevate()} disabled={elevating} className="btn btn-ok">
                  {elevating ? <Loader2 size={12} className="animate-spin" /> : <ShieldAlert size={12} />}
                  {t("app.elevate")}
                </button>
              </div>
            )}

            <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
              <div>
                <h1 className="text-[20px] font-semibold tracking-tight text-ink">
                  {t(filterTitleKeys[filter])}
                </h1>
                <p className="mt-0.5 text-[12px] text-dim">
                  {query ? t("app.searchPrefix", { query }) : t("app.legend")}
                </p>
              </div>
              <p className="text-[11.5px] text-dim">
                {updatedAt
                  ? t("app.updatedAt", {
                      time: new Date(updatedAt).toLocaleTimeString(locale),
                    })
                  : t("app.loading")}
              </p>
            </div>

            <div className="mb-4 grid grid-cols-2 gap-2 lg:grid-cols-4">
              <StatCard
                icon={<Sparkles size={14} className="text-accent" />}
                label={t("stat.total")}
                value={services.length}
              />
              <StatCard
                icon={<Activity size={14} className="text-ok" />}
                label={t("stat.running")}
                value={runningCount}
                accent="text-ok"
              />
              <StatCard
                icon={<CircleSlash size={14} className="text-bad" />}
                label={t("stat.disabled")}
                value={disabledCount}
                accent="text-bad"
              />
              <StatCard
                icon={<Power size={14} className="text-warn" />}
                label={t("stat.safe")}
                value={safeCount}
                accent="text-warn"
              />
            </div>

            <div
              ref={barRef}
              className="sticky top-0 z-20 -mx-6 mb-3 px-6 py-3"
            >
              {stuck && (
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-x-3 bottom-0 top-0 rounded-2xl border border-line/40 bg-[#15161a]/55 backdrop-blur-2xl"
                />
              )}

              <div className="relative z-10 flex flex-wrap items-center gap-2">
                <div className="relative min-w-[240px] flex-1">
                  <Search
                    size={14}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-dim"
                  />
                  <input
                    ref={searchRef}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={t("toolbar.searchPlaceholder")}
                    className="h-9 w-full rounded-xl border border-line/50 bg-white/[0.03] pl-9 pr-20 text-[12px] text-ink backdrop-blur-xl transition-colors duration-150 placeholder:text-dim hover:border-line2/55 focus:border-line2/60 focus:bg-white/[0.045] focus:outline-none"
                  />
                  {query ? (
                    <button
                      onClick={() => setQuery("")}
                      className="absolute right-2 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-md text-dim hover:bg-white/[0.07] hover:text-ink"
                      aria-label={t("toolbar.clear")}
                    >
                      <X size={13} />
                    </button>
                  ) : (
                    <kbd className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 rounded border border-line/50 bg-white/[0.03] px-1.5 py-0.5 font-mono text-[10.5px] text-dim">
                      Ctrl K
                    </kbd>
                  )}
                </div>

                <Dropdown<SortKey>
                  value={sort}
                  options={[
                    { value: "name", label: t("sort.name") },
                    { value: "status", label: t("sort.status") },
                    { value: "risk", label: t("sort.risk") },
                  ]}
                  onChange={setSort}
                  ariaLabel={t("toolbar.sort")}
                  className="h-9 min-w-[132px]"
                  menuMinWidth={200}
                  surface="toolbar"
                />

                <button
                  onClick={() => void load(false)}
                  disabled={refreshing}
                  className="btn btn-toolbar h-9 px-3"
                >
                  <RefreshCw
                    size={13}
                    className={refreshing || autoRefreshing ? "animate-spin" : ""}
                  />
                  <span className="hidden sm:inline">{t("toolbar.refresh")}</span>
                </button>
              </div>

              <div className="relative z-10 mt-2 flex items-center justify-between text-[11.5px] text-dim">
                <span>
                  {t("app.showing")}{" "}
                  <span className="font-mono text-muted">{shown.length}</span> {t("app.of")}{" "}
                  <span className="font-mono text-muted">{filtered.length}</span>
                </span>
                <span className="hidden sm:inline">{t("app.autoRefresh")}</span>
              </div>
              <span className="divider pointer-events-none absolute inset-x-6 bottom-0" />
            </div>

            {error && (
              <div className="panel flex flex-wrap items-center gap-3 border-bad/25 bg-bad/[0.04] p-4">
                <AlertTriangle size={17} className="text-bad" />
                <div className="min-w-0 flex-1">
                  <p className="text-[12px] font-medium text-bad">{t("app.errorTitle")}</p>
                  <p className="mt-0.5 break-words text-[12px] text-muted">
                    {localizeBackend(error, lang)}
                  </p>
                </div>
                <button onClick={() => void load(true)} className="btn btn-ghost">
                  {t("app.retry")}
                </button>
              </div>
            )}

            {loading ? (
              <div className="space-y-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="panel animate-pulse p-4 pl-5">
                    <div className="flex items-center gap-3">
                      <div className="h-2.5 w-2.5 rounded-full bg-white/10" />
                      <div className="h-3.5 w-52 rounded bg-white/[0.08]" />
                      <div className="ml-auto h-5 w-20 rounded-md bg-white/[0.05]" />
                    </div>
                    <div className="ml-[22px] mt-3 h-2.5 w-3/4 rounded bg-white/[0.05]" />
                    <div className="ml-[22px] mt-2 h-2.5 w-1/2 rounded bg-white/[0.04]" />
                  </div>
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="panel flex flex-col items-center justify-center gap-2 px-6 py-16 text-center">
                <SearchX size={26} className="text-dim" />
                <p className="text-[13px] font-medium text-muted">{t("app.emptyTitle")}</p>
                <p className="max-w-[360px] text-[12px] leading-relaxed text-dim">
                  {t("app.emptyText")}
                </p>
                <button
                  onClick={() => {
                    setQuery("");
                    setFilter("all");
                  }}
                  className="btn btn-ghost mt-2"
                >
                  {t("app.resetFilters")}
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {shown.map((service) => (
                  <ServiceCard
                    key={service.name}
                    service={service}
                    busy={pending === service.name}
                    admin={admin}
                    onDisable={handleDisable}
                    onEnable={handleEnable}
                    onStart={handleStart}
                    onStop={handleStop}
                    onStartup={handleStartup}
                    onCheckOnline={setChecking}
                  />
                ))}
              </div>
            )}

            {!loading && filtered.length > shown.length && (
              <div className="mt-4 flex justify-center">
                <button onClick={() => setVisible((v) => v + PAGE)} className="btn btn-ghost px-4 py-2">
                  {t("app.loadMore", { count: Math.min(PAGE, filtered.length - shown.length) })}
                </button>
              </div>
            )}

            <p className="mt-8 text-center text-[11px] leading-relaxed text-dim/70">
              {t("app.footer")}
            </p>
          </div>
        </main>
      </div>

      <AnimatePresence>
        {confirming && (
          <ConfirmDialog
            key={confirming.name}
            service={confirming}
            busy={pending === confirming.name}
            onCancel={() => setConfirming(null)}
            onConfirm={confirmDisable}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {checkedService && (
          <ServiceInfoDialog
            key={checkedService.name}
            service={checkedService}
            onClose={() => setChecking(null)}
          />
        )}
      </AnimatePresence>

      <Toasts toasts={toasts} onDismiss={dismissToast} />
      <TooltipLayer />
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  accent,
}: {
  icon: ReactNode;
  label: string;
  value: number;
  accent?: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-line/50 bg-white/[0.03] px-3.5 py-2.5 shadow-[0_14px_38px_-28px_rgba(0,0,0,0.9)] backdrop-blur-xl">
      <div className="grid h-8 w-8 place-items-center rounded-lg border border-line/50 bg-white/[0.04]">
        {icon}
      </div>
      <div className="min-w-0">
        <p className={`text-[17px] font-semibold leading-none tabular-nums ${accent ?? "text-ink"}`}>
          {value}
        </p>
        <p className="mt-1 truncate text-[11px] uppercase tracking-wider text-dim">{label}</p>
      </div>
    </div>
  );
}
