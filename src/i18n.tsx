import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

export type Lang = "ru" | "en";

const ru = {
  "window.title": "Servo — службы Windows",
  "window.minimize": "Свернуть",
  "window.maximize": "Развернуть",
  "window.close": "Закрыть",
  "common.close": "Закрыть",
  "common.cancel": "Отмена",
  "lang.title": "Язык интерфейса",
  "lang.ru": "Русский",
  "lang.en": "English",

  "app.subtitle": "Службы Windows",
  "app.admin": "Администратор",
  "app.elevate": "Запустить от администратора",
  "app.elevating": "Запускаем…",
  "app.elevateTitle": "Перезапустить Servo с правами администратора",
  "app.limitedTitle": "Ограниченный режим",
  "app.limitedText":
    "Список служб доступен, но для отключения и запуска нужны права администратора.",
  "app.searchPrefix": "Поиск: «{query}»",
  "app.legend": "Зелёная точка — служба работает, красная — отключена.",
  "app.showing": "Показано",
  "app.of": "из",
  "app.errorTitle": "Не удалось получить службы",
  "app.retry": "Повторить",
  "app.emptyTitle": "Ничего не найдено",
  "app.emptyText":
    "Попробуйте другой запрос или сбросьте фильтр — служба может называться иначе, например по-английски.",
  "app.resetFilters": "Сбросить фильтры",
  "app.loadMore": "Показать ещё {count}",
  "app.footer":
    "Servo читает данные напрямую из диспетчера служб Windows. Отключение критических служб заблокировано.",

  "nav.navigation": "Навигация",
  "nav.all": "Все службы",
  "nav.running": "Работают",
  "nav.stopped": "Остановлены",
  "nav.disabled": "Отключены",
  "nav.system": "Системные",
  "nav.thirdParty": "Сторонние",
  "nav.safe": "Можно отключать",

  "title.all": "Все службы",
  "title.running": "Работающие службы",
  "title.stopped": "Остановленные службы",
  "title.disabled": "Отключённые службы",
  "title.system": "Системные службы",
  "title.thirdParty": "Сторонние службы",
  "title.safe": "Можно отключать",

  "stat.total": "Всего служб",
  "stat.running": "Работают",
  "stat.disabled": "Отключены",
  "stat.safe": "Можно отключать",

  "sidebar.fullAccess": "Полный доступ",
  "sidebar.viewOnly": "Только просмотр",
  "sidebar.fullAccessText": "Можно запускать, останавливать и менять тип запуска служб.",
  "sidebar.viewOnlyText": "Чтобы менять службы, перезапустите Servo от имени администратора.",
  "sidebar.total": "Всего в системе:",
  "sidebar.direct": "Данные читаются напрямую из Windows.",

  "toolbar.searchPlaceholder": "Поиск: название, служба, описание…",
  "toolbar.clear": "Очистить",
  "toolbar.sort": "Сортировка",
  "sort.name": "По названию",
  "sort.status": "Сначала работающие",
  "sort.risk": "Сначала безопасные",

  "status.running": "Работает",
  "status.disabled": "Отключена",
  "status.startPending": "Запускается",
  "status.stopPending": "Останавливается",
  "status.stopped": "Остановлена",
  "status.paused": "Приостановлена",

  "start.auto": "Автоматически",
  "start.manual": "Вручную",
  "start.disabled": "Отключена",
  "start.boot": "Загрузка",
  "start.system": "Система",
  "start.unknown": "Неизвестно",
  "start.delayedSuffix": " (отложенно)",

  "verdict.safe": "Можно отключать",
  "verdict.caution": "С осторожностью",
  "verdict.critical": "Критическая",
  "verdict.unknown": "Нет данных",
  "verdict.hint.safe": "Отключение этой службы безопасно для системы.",
  "verdict.hint.caution": "Отключение может нарушить работу отдельных функций.",
  "verdict.hint.critical": "Критическая служба Windows — отключение заблокировано.",
  "verdict.hint.unknown": "Нет данных о службе — решайте сами.",

  "card.systemAria": "Системная служба Windows",
  "card.criticalAria": "Критическая служба",
  "card.fallbackDesc":
    "Системное описание не указано. Служба «{name}», тип запуска — {start}. Отключайте только если понимаете, за что она отвечает.",
  "card.localizedDesc":
    "Системное описание этой службы недоступно на выбранном языке. Служба «{name}», тип запуска — {start}. Откройте проверку онлайн, чтобы узнать подробности.",
  "card.protected": "Защищена",
  "card.protectedTitle": "Критическая служба Windows — отключение заблокировано",
  "card.enable": "Включить",
  "card.enableTitle": "Включить (запуск вручную)",
  "card.disable": "Отключить",
  "card.disableTitle": "Отключить и остановить службу",
  "card.noAdmin": "Нужны права администратора",
  "card.stop": "Остановить",
  "card.stopTitle": "Остановить службу",
  "card.stopUnsupported": "Служба не поддерживает остановку",
  "card.changeUnsupported": "Служба не поддерживает изменение настроек",
  "card.start": "Запустить",
  "card.startTitle": "Запустить службу",
  "card.startDisabled": "Сначала включите службу",
  "card.collapse": "Свернуть",
  "card.details": "Подробности",
  "card.startupType": "Тип запуска",
  "card.categoryWindows": "Компонент Windows",
  "card.categoryThirdParty": "Сторонняя программа",

  "details.serviceName": "Имя службы",
  "details.status": "Состояние",
  "details.startup": "Тип запуска",
  "details.pid": "PID",
  "details.account": "Учётная запись",
  "details.category": "Категория",
  "details.binary": "Путь к исполняемому файлу",

  "online.button": "Проверить онлайн",
  "online.buttonTitle": "Спросить ИИ об этой службе",
  "online.title": "Информация о службе",
  "online.subtitle": "Локальные данные Windows и объяснение от ИИ.",
  "online.local": "Данные службы",
  "online.internet": "Ответ ИИ",
  "online.askAi": "Спросить у ИИ",
  "online.askAiHint": "ИИ объяснит, что делает служба, что будет при её отключении и какую нагрузку она создаёт.",
  "online.loading": "ИИ думает…",
  "online.notFoundTitle": "ИИ не дал ответ",
  "online.notFoundText": "Бесплатная модель вернула пустой ответ. Попробуйте ещё раз.",
  "online.errorTitle": "Не удалось получить ответ",
  "online.errorText":
    "Бесплатный ИИ не ответил. Проверьте подключение и повторите попытку.",
  "online.busyTitle": "ИИ временно занят",
  "online.busyText": "Следующий бесплатный запрос можно отправить через {seconds} с.",
  "online.retry": "Повторить",
  "online.retryIn": "Повторить через {seconds} с",
  "online.source": "Pollinations · бесплатно",
  "online.emptyShort": "Нет ответа",
  "online.searchWeb": "Искать в интернете",
  "online.searchWebTitle": "Открыть поиск в браузере",
  "online.errorShort": "Ошибка",
  "online.note": "Примечание",
  "online.verdict": "Оценка",
  "online.displayName": "Отображаемое имя",
  "online.checked": "Проверено в {time}",
  "online.offline": "Локальные данные доступны без интернета.",

  "confirm.title": "Отключить системную службу?",
  "confirm.text": "Эта служба входит в состав Windows. Она будет отключена и остановлена.",
  "confirm.willBreak":
    "Может перестать работать функция Windows или программа, которая использует эту службу.",
  "confirm.reversible": "Отключение обратимо: службу можно включить обратно в любой момент.",
  "confirm.ack":
    "Я понимаю, что отключение системной службы может нарушить работу Windows.",
  "confirm.action": "Отключить службу",

  "toast.failed": "Не выполнено",
  "toast.warningTitle": "Выполнено с предупреждением",
  "toast.adminTitle": "Нужны права администратора",
  "toast.adminText":
    "Нажмите «Запустить от администратора» в правом верхнем углу и подтвердите запрос UAC.",
  "toast.criticalTitle": "Служба защищена",
  "toast.criticalText": "Это критическая служба Windows — её отключение нарушит работу системы.",
  "toast.disabledTitle": "Служба отключена",
  "toast.disabledText": "Служба «{name}» отключена.",
  "toast.systemDisabledTitle": "Системная служба отключена",
  "toast.systemDisabledText": "Системная служба «{name}» отключена.",
  "toast.enabledTitle": "Служба включена",
  "toast.enabledText": "Служба «{name}» включена, запуск — вручную.",
  "toast.startedTitle": "Служба запущена",
  "toast.startedText": "Служба «{name}» запущена.",
  "toast.stoppedTitle": "Служба остановлена",
  "toast.stoppedText": "Служба «{name}» остановлена.",
  "toast.startupTitle": "Тип запуска обновлён",
  "toast.startupText": "Тип запуска службы «{name}» обновлён.",
  "toast.startupManualTitle": "Тип запуска: вручную",
  "toast.startupManualText": "Служба «{name}» будет запускаться вручную.",
  "toast.elevateFailedTitle": "Не удалось получить права",

  "error.unknown": "Неизвестная ошибка",
} as const;

type Dict = Record<keyof typeof ru, string>;

const en: Dict = {
  "window.title": "Servo — Windows services",
  "window.minimize": "Minimize",
  "window.maximize": "Maximize",
  "window.close": "Close",
  "common.close": "Close",
  "common.cancel": "Cancel",
  "lang.title": "Interface language",
  "lang.ru": "Russian",
  "lang.en": "English",

  "app.subtitle": "Windows services",
  "app.admin": "Administrator",
  "app.elevate": "Run as administrator",
  "app.elevating": "Starting…",
  "app.elevateTitle": "Restart Servo as administrator",
  "app.limitedTitle": "Limited mode",
  "app.limitedText":
    "You can browse services, but administrator rights are required to change or start them.",
  "app.searchPrefix": "Search: “{query}”",
  "app.legend": "A green dot means running, red means disabled.",
  "app.showing": "Showing",
  "app.of": "of",
  "app.errorTitle": "Couldn't load services",
  "app.retry": "Retry",
  "app.emptyTitle": "Nothing found",
  "app.emptyText":
    "Try another query or reset the filter — the service may have a different name.",
  "app.resetFilters": "Reset filters",
  "app.loadMore": "Show {count} more",
  "app.footer":
    "Servo reads data directly from the Windows Service Control Manager. Disabling critical services is blocked.",

  "nav.navigation": "Navigation",
  "nav.all": "All services",
  "nav.running": "Running",
  "nav.stopped": "Stopped",
  "nav.disabled": "Disabled",
  "nav.system": "System",
  "nav.thirdParty": "Third-party",
  "nav.safe": "Safe to disable",

  "title.all": "All services",
  "title.running": "Running services",
  "title.stopped": "Stopped services",
  "title.disabled": "Disabled services",
  "title.system": "System services",
  "title.thirdParty": "Third-party services",
  "title.safe": "Safe to disable",

  "stat.total": "Total services",
  "stat.running": "Running",
  "stat.disabled": "Disabled",
  "stat.safe": "Safe to disable",

  "sidebar.fullAccess": "Full access",
  "sidebar.viewOnly": "View only",
  "sidebar.fullAccessText": "You can start, stop, and change service startup types.",
  "sidebar.viewOnlyText": "Restart Servo as administrator to change services.",
  "sidebar.total": "Total on this PC:",
  "sidebar.direct": "Data is read directly from Windows.",

  "toolbar.searchPlaceholder": "Search: name, service, description…",
  "toolbar.clear": "Clear",
  "toolbar.sort": "Sort",
  "sort.name": "By name",
  "sort.status": "Running first",
  "sort.risk": "Safe first",

  "status.running": "Running",
  "status.disabled": "Disabled",
  "status.startPending": "Starting",
  "status.stopPending": "Stopping",
  "status.stopped": "Stopped",
  "status.paused": "Paused",

  "start.auto": "Automatic",
  "start.manual": "Manual",
  "start.disabled": "Disabled",
  "start.boot": "Boot",
  "start.system": "System",
  "start.unknown": "Unknown",
  "start.delayedSuffix": " (delayed)",

  "verdict.safe": "Safe to disable",
  "verdict.caution": "Use caution",
  "verdict.critical": "Critical",
  "verdict.unknown": "No data",
  "verdict.hint.safe": "Disabling this service is safe for the system.",
  "verdict.hint.caution": "Disabling it may affect some features.",
  "verdict.hint.critical": "Critical Windows service — disabling is blocked.",
  "verdict.hint.unknown": "No information about this service — use your judgment.",

  "card.systemAria": "Windows system service",
  "card.criticalAria": "Critical service",
  "card.fallbackDesc":
    "No system description provided. Service “{name}”, startup type: {start}. Disable it only if you understand what it does.",
  "card.localizedDesc":
    "The system description for this service is only available in the Windows display language. Service “{name}”, startup type: {start}. Use “Check online” for details.",
  "card.protected": "Protected",
  "card.protectedTitle": "Critical Windows service — disabling is blocked",
  "card.enable": "Enable",
  "card.enableTitle": "Enable (manual startup)",
  "card.disable": "Disable",
  "card.disableTitle": "Disable and stop the service",
  "card.noAdmin": "Administrator rights required",
  "card.stop": "Stop",
  "card.stopTitle": "Stop the service",
  "card.stopUnsupported": "This service does not support stopping",
  "card.changeUnsupported": "This service's settings cannot be changed",
  "card.start": "Start",
  "card.startTitle": "Start the service",
  "card.startDisabled": "Enable the service first",
  "card.collapse": "Collapse",
  "card.details": "Details",
  "card.startupType": "Startup type",
  "card.categoryWindows": "Windows component",
  "card.categoryThirdParty": "Third-party program",

  "details.serviceName": "Service name",
  "details.status": "Status",
  "details.startup": "Startup type",
  "details.pid": "PID",
  "details.account": "Account",
  "details.category": "Category",
  "details.binary": "Executable path",

  "online.button": "Check online",
  "online.buttonTitle": "Ask AI about this service",
  "online.title": "Service information",
  "online.subtitle": "Local Windows data and an AI explanation.",
  "online.local": "Service data",
  "online.internet": "AI answer",
  "online.askAi": "Ask AI",
  "online.askAiHint": "The AI will explain what the service does, what happens if it is disabled, and how much CPU, RAM, disk, and network it uses.",
  "online.loading": "AI is thinking…",
  "online.notFoundTitle": "No AI answer",
  "online.notFoundText": "The free model returned an empty answer. Try again.",
  "online.errorTitle": "Could not get an answer",
  "online.errorText": "The free AI did not respond. Check your connection and try again.",
  "online.busyTitle": "AI is busy",
  "online.busyText": "The next free request can be sent in {seconds}s.",
  "online.retry": "Try again",
  "online.retryIn": "Retry in {seconds}s",
  "online.source": "Pollinations · free",
  "online.emptyShort": "No answer",
  "online.searchWeb": "Search the web",
  "online.searchWebTitle": "Open a web search in the browser",
  "online.errorShort": "Error",
  "online.note": "Note",
  "online.verdict": "Assessment",
  "online.displayName": "Display name",
  "online.checked": "Checked at {time}",
  "online.offline": "Local data is available offline.",

  "confirm.title": "Disable a system service?",
  "confirm.text": "This service is part of Windows. It will be disabled and stopped.",
  "confirm.willBreak":
    "A Windows feature or an app that depends on this service may stop working.",
  "confirm.reversible": "This can be reversed: you can enable the service again at any time.",
  "confirm.ack": "I understand that disabling a system service may affect Windows.",
  "confirm.action": "Disable service",

  "toast.failed": "Action failed",
  "toast.warningTitle": "Completed with a warning",
  "toast.adminTitle": "Administrator rights required",
  "toast.adminText":
    "Click “Run as administrator” in the top-right corner and confirm the UAC prompt.",
  "toast.criticalTitle": "Protected service",
  "toast.criticalText": "This is a critical Windows service — disabling it would break the system.",
  "toast.disabledTitle": "Service disabled",
  "toast.disabledText": "“{name}” has been disabled.",
  "toast.systemDisabledTitle": "System service disabled",
  "toast.systemDisabledText": "System service “{name}” has been disabled.",
  "toast.enabledTitle": "Service enabled",
  "toast.enabledText": "“{name}” is enabled with manual startup.",
  "toast.startedTitle": "Service started",
  "toast.startedText": "“{name}” has been started.",
  "toast.stoppedTitle": "Service stopped",
  "toast.stoppedText": "“{name}” has been stopped.",
  "toast.startupTitle": "Startup type updated",
  "toast.startupText": "Startup type updated for “{name}”.",
  "toast.startupManualTitle": "Startup type: manual",
  "toast.startupManualText": "“{name}” will now start manually.",
  "toast.elevateFailedTitle": "Couldn't get administrator rights",

  "error.unknown": "Unknown error",
};

export type TKey = keyof typeof ru;

export function format(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (match, key: string) => {
    const value = vars[key];
    return value === undefined ? match : String(value);
  });
}

export function getStoredLang(): Lang {
  try {
    const saved = window.localStorage.getItem("servo_lang");
    if (saved === "ru" || saved === "en") return saved;
  } catch {
    // localStorage may be unavailable — fall through to the system language.
  }
  const system = typeof navigator !== "undefined" ? navigator.language.toLowerCase() : "";
  return system.startsWith("ru") ? "ru" : "en";
}

const hints: Array<[RegExp, string]> = [
  [/доступ запрещён \(нужны права администратора\)/g, "access denied (administrator rights required)"],
  [/служба не существует/g, "the service does not exist"],
  [/служба сейчас не принимает команды/g, "the service is not accepting commands"],
  [/служба не запущена/g, "the service is not running"],
  [/служба помечена для удаления/g, "the service is marked for deletion"],
  [/служба уже запущена/g, "the service is already running"],
  [/ошибка Windows/g, "Windows error"],
  [/код (\d{1,6})/g, "code $1"],
];

const phrases: Array<[RegExp, string]> = [
  [
    /^Для изменения служб нужны права администратора[\s\S]*$/,
    "Administrator rights are required to manage services. Click “Run as administrator” at the top of the window.",
  ],
  [/^Неизвестная ошибка$/, "Unknown error"],
  [
    /^Не удалось открыть менеджер служб: ([\s\S]+)$/,
    "Could not open the service manager: $1",
  ],
  [/^Не удалось открыть службу «([^»]+)»: ([\s\S]+)$/, "Could not open service “$1”: $2"],
  [/^Не удалось получить состояние: ([\s\S]+)$/, "Could not query the service status: $1"],
  [/^Не удалось получить список служб: ([\s\S]+)$/, "Could not enumerate services: $1"],
  [/^Не удалось остановить службу: ([\s\S]+)$/, "Could not stop the service: $1"],
  [/^Не удалось запустить службу: ([\s\S]+)$/, "Could not start the service: $1"],
  [/^Не удалось изменить тип запуска: ([\s\S]+)$/, "Could not change the startup type: $1"],
  [
    /^Не удалось изменить отложенный запуск: ([\s\S]+)$/,
    "Could not change the delayed start: $1",
  ],
  [/^Неизвестный тип запуска: ([\s\S]+)$/, "Unknown startup type: $1"],
  [/^Эта служба не поддерживает остановку$/, "This service does not support stopping."],
  [
    /^Служба отключена\. Сначала включите её, затем запустите\.$/,
    "The service is disabled. Enable it first, then start it.",
  ],
  [/^Превышено время ожидания ответа службы\.?$/, "Timed out waiting for the service."],
  [
    /^Это критическая системная служба[\s\S]*$/,
    "This is a critical system service. Disabling it would break Windows, so the action is blocked.",
  ],
  [
    /^Служба отключена$/,
    "The service is disabled.",
  ],
  [
    /^Служба отключена и остановлена$/,
    "The service is disabled and stopped.",
  ],
  [/^Служба остановлена$/, "The service has been stopped."],
  [/^Служба уже остановлена$/, "The service is already stopped."],
  [/^Служба запущена$/, "The service has been started."],
  [/^Служба уже работает$/, "The service is already running."],
  [/^Команда запуска отправлена$/, "The start command has been sent."],
  [/^Тип запуска: вручную$/, "Startup type: manual."],
  [/^Тип запуска: автоматически$/, "Startup type: automatic."],
  [/^Тип запуска: автоматически \(отложенно\)$/, "Startup type: automatic (delayed)."],
  [
    /^Она перестанет работать после перезагрузки Windows\.?$/,
    "It will stop working after Windows restarts.",
  ],
  [
    /^Проверьте состояние через несколько секунд\.?$/,
    "Check the status in a few seconds.",
  ],
];

const warningPhrases: Array<[RegExp, string]> = [
  [/Превышено время ожидания ответа службы\.?/g, "Timed out waiting for the service."],
  [/Проверьте состояние через несколько секунд\.?/g, "Check the status in a few seconds."],
  [
    /Она перестанет работать после перезагрузки Windows\.?/g,
    "It will stop working after Windows restarts.",
  ],
];

/** Переводит сообщения бэкенда, когда интерфейс переключён на английский. */
export function localizeBackend(text: string, lang: Lang): string {
  if (lang === "ru" || !text) return text;
  let result = text.trim();
  for (const [pattern, replacement] of phrases) {
    if (pattern.test(result)) {
      result = result.replace(pattern, replacement);
      break;
    }
  }
  for (const [pattern, replacement] of hints) {
    result = result.replace(pattern, replacement);
  }
  for (const [pattern, replacement] of warningPhrases) {
    result = result.replace(pattern, replacement);
  }
  return result;
}

interface I18nValue {
  lang: Lang;
  locale: string;
  setLang: (lang: Lang) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => getStoredLang());

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    try {
      window.localStorage.setItem("servo_lang", next);
    } catch {
      // Persisting the language is best-effort.
    }
  }, []);

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) => {
      const dictionary = lang === "ru" ? ru : en;
      const template = dictionary[key as TKey] ?? key;
      return format(template, vars);
    },
    [lang]
  );

  useEffect(() => {
    document.documentElement.lang = lang;
    document.title = t("window.title");
  }, [lang, t]);

  const value = useMemo<I18nValue>(
    () => ({
      lang,
      locale: lang === "ru" ? "ru-RU" : "en-GB",
      setLang,
      t,
    }),
    [lang, setLang, t]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const value = useContext(I18nContext);
  if (!value) throw new Error("useI18n must be used inside I18nProvider");
  return value;
}
