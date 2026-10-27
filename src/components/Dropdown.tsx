import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import type { KeyboardEvent as ReactKeyboardEvent } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronDown } from "lucide-react";

export interface DropdownOption<T extends string> {
  value: T;
  label: string;
  disabled?: boolean;
}

interface Props<T extends string> {
  value: T;
  options: DropdownOption<T>[];
  onChange: (value: T) => void;
  ariaLabel: string;
  disabled?: boolean;
  className?: string;
  menuMinWidth?: number;
  surface?: "default" | "toolbar";
}

interface Layout {
  left: number;
  width: number;
  top?: number;
  bottom?: number;
  maxHeight: number;
}

/**
 * Кастомный выпадающий список в стиле Servo.
 *
 * Меню рендерится в портал: карточки служб имеют `overflow-hidden`,
 * поэтому обычный абсолютный список обрезался бы. Раскрытие и закрытие
 * анимируются по высоте, без масштабирования текста.
 */
export default function Dropdown<T extends string>({
  value,
  options,
  onChange,
  ariaLabel,
  disabled = false,
  className = "",
  menuMinWidth = 148,
  surface = "default",
}: Props<T>) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [layout, setLayout] = useState<Layout | null>(null);
  const [menuHeight, setMenuHeight] = useState(0);

  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef(0);
  const listId = useId();

  const selectedIndex = options.findIndex((option) => option.value === value);
  const selected = selectedIndex >= 0 ? options[selectedIndex] : null;

  const updateLayout = useCallback(() => {
    const trigger = triggerRef.current;
    const menu = menuRef.current;
    if (!trigger || !menu) return;

    const rect = trigger.getBoundingClientRect();
    if (rect.bottom < 0 || rect.top > window.innerHeight) {
      setOpen(false);
      return;
    }

    const margin = 8;
    const gap = 6;
    const width = Math.min(
      Math.max(rect.width, menuMinWidth),
      window.innerWidth - margin * 2
    );
    const maxHeight = Math.max(120, window.innerHeight - margin * 2);
    const contentHeight = Math.min(menu.scrollHeight, maxHeight);
    const spaceBelow = window.innerHeight - rect.bottom - gap - margin;
    const spaceAbove = rect.top - gap - margin;
    const placement =
      spaceBelow >= contentHeight || spaceBelow >= spaceAbove ? "bottom" : "top";
    const left = Math.min(
      Math.max(rect.left, margin),
      window.innerWidth - width - margin
    );

    setMenuHeight((previous) =>
      previous === contentHeight ? previous : contentHeight
    );

    setLayout({
      left,
      width,
      maxHeight,
      top: placement === "bottom" ? rect.bottom + gap : undefined,
      bottom:
        placement === "top" ? window.innerHeight - rect.top + gap : undefined,
    });
  }, [menuMinWidth]);

  const openMenu = useCallback(() => {
    if (disabled) return;
    const index = options.findIndex(
      (option) => option.value === value && !option.disabled
    );
    const fallback = options.findIndex((option) => !option.disabled);
    setActive(index >= 0 ? index : Math.max(0, fallback));
    setLayout(null);
    setOpen(true);
  }, [disabled, options, value]);

  const choose = useCallback(
    (index: number) => {
      const option = options[index];
      if (!option || option.disabled) return;
      onChange(option.value);
      setOpen(false);
      window.requestAnimationFrame(() => triggerRef.current?.focus());
    },
    [onChange, options]
  );

  const moveActive = useCallback(
    (direction: 1 | -1) => {
      if (options.length === 0) return;
      let index = active;
      for (let step = 0; step < options.length; step += 1) {
        index = (index + direction + options.length) % options.length;
        if (!options[index].disabled) {
          setActive(index);
          return;
        }
      }
    },
    [active, options]
  );

  // Значение изменилось извне (например, после автообновления) — меню
  // больше не соответствует данным, закрываем его.
  useEffect(() => {
    setOpen(false);
  }, [value, disabled]);

  useLayoutEffect(() => {
    if (!open) return;
    updateLayout();
  }, [open, updateLayout]);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (triggerRef.current?.contains(target)) return;
      if (wrapRef.current?.contains(target)) return;
      setOpen(false);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
        triggerRef.current?.focus();
      }
    };

    const scheduleLayout = () => {
      if (frameRef.current) return;
      frameRef.current = window.requestAnimationFrame(() => {
        frameRef.current = 0;
        updateLayout();
      });
    };

    const onBlur = () => setOpen(false);

    document.addEventListener("pointerdown", onPointerDown, true);
    document.addEventListener("keydown", onKeyDown, true);
    window.addEventListener("scroll", scheduleLayout, true);
    window.addEventListener("resize", scheduleLayout);
    window.addEventListener("blur", onBlur);

    return () => {
      document.removeEventListener("pointerdown", onPointerDown, true);
      document.removeEventListener("keydown", onKeyDown, true);
      window.removeEventListener("scroll", scheduleLayout, true);
      window.removeEventListener("resize", scheduleLayout);
      window.removeEventListener("blur", onBlur);
      if (frameRef.current) {
        window.cancelAnimationFrame(frameRef.current);
        frameRef.current = 0;
      }
    };
  }, [open, updateLayout]);

  const onTriggerKeyDown = (event: ReactKeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return;

    if (!open) {
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        openMenu();
      }
      return;
    }

    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        moveActive(1);
        break;
      case "ArrowUp":
        event.preventDefault();
        moveActive(-1);
        break;
      case "Home": {
        event.preventDefault();
        const first = options.findIndex((option) => !option.disabled);
        if (first >= 0) setActive(first);
        break;
      }
      case "End": {
        event.preventDefault();
        for (let index = options.length - 1; index >= 0; index -= 1) {
          if (!options[index].disabled) {
            setActive(index);
            break;
          }
        }
        break;
      }
      case "Enter":
      case " ":
        event.preventDefault();
        choose(active);
        break;
      case "Escape":
        event.preventDefault();
        setOpen(false);
        break;
      case "Tab":
        setOpen(false);
        break;
      default:
        break;
    }
  };

  const optionId = (index: number) => `${listId}-option-${index}`;

  const triggerTone =
    surface === "toolbar"
      ? open
        ? "border-line2/55 bg-white/[0.05] text-ink"
        : "border-line/50 bg-white/[0.03] text-muted backdrop-blur-xl hover:border-line2/55 hover:bg-white/[0.05] hover:text-ink"
      : open
        ? "border-line2 bg-panel2/85 text-ink"
        : "border-line bg-panel2/70 text-muted backdrop-blur-xl hover:border-line2 hover:text-ink";

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-activedescendant={open ? optionId(active) : undefined}
        aria-label={ariaLabel}
        onClick={() => (open ? setOpen(false) : openMenu())}
        onKeyDown={onTriggerKeyDown}
        className={`inline-flex items-center justify-between gap-2 rounded-lg border py-1.5 pl-2.5 pr-2 text-xs transition-colors duration-150 focus:outline-none disabled:cursor-not-allowed disabled:opacity-40 ${triggerTone} ${className}`}
      >
        <span className="truncate">{selected?.label ?? value}</span>
        <ChevronDown
          size={12}
          className={`shrink-0 text-dim transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {createPortal(
        <AnimatePresence>
          {open && (
            <motion.div
              ref={wrapRef}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: menuHeight }}
              exit={{ opacity: 0, height: 0 }}
              transition={{
                height: { duration: 0.22, ease: [0.4, 0, 0.2, 1] },
                opacity: { duration: 0.18, ease: "easeOut" },
              }}
              className="overflow-hidden rounded-xl border border-line2/50 bg-panel/60 shadow-[0_24px_60px_-24px_rgba(0,0,0,0.92)] backdrop-blur-xl"
              style={{
                position: "fixed",
                left: layout?.left ?? 0,
                width: layout?.width ?? menuMinWidth,
                top: layout?.top,
                bottom: layout?.bottom,
                maxHeight: layout?.maxHeight ?? 320,
                visibility: layout ? "visible" : "hidden",
                pointerEvents: open && layout ? "auto" : "none",
                zIndex: 95,
              }}
            >
              <div
                ref={menuRef}
                id={listId}
                role="listbox"
                aria-label={ariaLabel}
                style={{
                  maxHeight: layout?.maxHeight ?? 320,
                  overflowY: "auto",
                }}
                className="overscroll-contain p-1"
              >
                {options.map((option, index) => {
                  const isSelected = option.value === value;
                  const isActive = index === active;
                  return (
                    <button
                      key={option.value}
                      id={optionId(index)}
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      aria-disabled={option.disabled || undefined}
                      disabled={option.disabled}
                      tabIndex={-1}
                      onMouseDown={(event) => event.preventDefault()}
                      onMouseEnter={() => setActive(index)}
                      onClick={() => choose(index)}
                      className={`flex w-full items-center justify-between gap-3 rounded-lg px-2.5 py-[7px] text-left text-[12px] transition-colors duration-100 ${
                        option.disabled
                          ? "cursor-not-allowed text-dim/40"
                          : isActive
                            ? "bg-white/[0.07] text-ink"
                            : "text-muted hover:bg-white/[0.05] hover:text-ink"
                      }`}
                    >
                      <span className="truncate">{option.label}</span>
                      <span className="grid h-3 w-3 shrink-0 place-items-center">
                        {isSelected && <Check size={12} className="text-accent" />}
                      </span>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}
