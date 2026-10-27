export type ServiceStatus =
  | "running"
  | "stopped"
  | "start_pending"
  | "stop_pending"
  | "paused"
  | "pause_pending"
  | "continue_pending"
  | "unknown";

export type StartType = "auto" | "manual" | "disabled" | "boot" | "system" | "unknown";

export type Verdict = "safe" | "caution" | "critical" | "unknown";

export interface ServiceInfo {
  name: string;
  displayName: string;
  description: string;
  status: ServiceStatus;
  startType: StartType;
  delayed: boolean;
  pid: number;
  canStop: boolean;
  canChange: boolean;
  isSystem: boolean;
  isCritical: boolean;
  verdict: Verdict;
  note: string;
  noteEn: string;
  binaryPath: string;
  account: string;
}

export interface ActionOutcome {
  ok: boolean;
  message: string;
  warning: string | null;
}

export type FilterKey =
  | "all"
  | "running"
  | "stopped"
  | "disabled"
  | "system"
  | "third-party"
  | "safe";

export type SortKey = "name" | "status" | "risk";

export type ToastKind = "ok" | "error" | "warn" | "info";

export interface Toast {
  id: string;
  kind: ToastKind;
  title: string;
  text?: string;
}
