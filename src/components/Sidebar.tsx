import {
  Boxes,
  CircleSlash,
  LayoutGrid,
  Power,
  ShieldCheck,
  ShieldHalf,
  Sparkles,
  Activity,
} from "lucide-react";
import type { FilterKey } from "../types";
import { useI18n } from "../i18n";

interface Props {
  filter: FilterKey;
  onFilter: (key: FilterKey) => void;
  counts: Record<FilterKey, number>;
  total: number;
  admin: boolean;
}

const items: { key: FilterKey; labelKey: string; icon: typeof LayoutGrid }[] = [
  { key: "all", labelKey: "nav.all", icon: LayoutGrid },
  { key: "running", labelKey: "nav.running", icon: Activity },
  { key: "stopped", labelKey: "nav.stopped", icon: Power },
  { key: "disabled", labelKey: "nav.disabled", icon: CircleSlash },
  { key: "system", labelKey: "nav.system", icon: ShieldHalf },
  { key: "third-party", labelKey: "nav.thirdParty", icon: Boxes },
  { key: "safe", labelKey: "nav.safe", icon: Sparkles },
];

export default function Sidebar({ filter, onFilter, counts, total, admin }: Props) {
  const { t } = useI18n();

  return (
    <aside className="relative flex w-[228px] shrink-0 flex-col bg-[#17181c]/60 backdrop-blur">
      <span className="pointer-events-none absolute -right-px bottom-3 top-3 w-0.5 rounded-full bg-line2/80" />
      <div className="px-3 pb-2 pt-4">
        <p className="px-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-dim">
          {t("nav.navigation")}
        </p>
      </div>

      <nav className="flex flex-col gap-0.5 px-2">
        {items.map(({ key, labelKey, icon: Icon }) => {
          const active = filter === key;
          return (
            <button
              key={key}
              onClick={() => onFilter(key)}
              className={`group flex items-center gap-2.5 rounded-lg px-2.5 py-[7px] text-left text-[12.5px] transition-colors ${
                active
                  ? "bg-white/[0.07] text-ink"
                  : "text-muted hover:bg-white/[0.04] hover:text-ink"
              }`}
            >
              <Icon
                size={14}
                className={active ? "text-accent" : "text-dim group-hover:text-muted"}
                strokeWidth={1.9}
              />
              <span className="flex-1 truncate">{t(labelKey)}</span>
              <span
                className={`font-mono text-[11.5px] tabular-nums ${
                  active ? "text-muted" : "text-dim"
                }`}
              >
                {counts[key]}
              </span>
            </button>
          );
        })}
      </nav>

      <div className="mx-4 mt-auto h-0.5 rounded-full bg-line2/70" />

      <div className="space-y-2 p-3">
        <div className="rounded-xl border-2 border-line bg-white/[0.02] p-3">
          <div className="flex items-center gap-1.5 text-[12px] font-medium text-muted">
            {admin ? (
              <ShieldCheck size={13} className="text-ok" />
            ) : (
              <ShieldHalf size={13} className="text-warn" />
            )}
            {admin ? t("sidebar.fullAccess") : t("sidebar.viewOnly")}
          </div>
          <p className="mt-1.5 text-[11.5px] leading-relaxed text-dim">
            {admin ? t("sidebar.fullAccessText") : t("sidebar.viewOnlyText")}
          </p>
        </div>

        <p className="px-1 text-[11px] leading-relaxed text-dim/80">
          {t("sidebar.total")} <span className="font-mono text-muted">{total}</span>
          <br />
          {t("sidebar.direct")}
        </p>
      </div>
    </aside>
  );
}
