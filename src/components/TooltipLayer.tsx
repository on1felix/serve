import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";

interface Tip {
  text: string;
  rect: DOMRect;
}

interface Coords {
  left: number;
  top: number;
}

/**
 * Единый слой подсказок в стиле Servo.
 *
 * Подсказка привязывается к любому элементу с атрибутом `data-tip`.
 * Такой подход не добавляет обёрток в разметку и не вызывает дёрганья
 * кнопок при наведении.
 */
export default function TooltipLayer() {
  const [tip, setTip] = useState<Tip | null>(null);
  const [coords, setCoords] = useState<Coords | null>(null);
  const tipRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<number | null>(null);
  const activeRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const clearTimer = () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };

    const hide = () => {
      clearTimer();
      activeRef.current = null;
      setTip(null);
      setCoords(null);
    };

    const schedule = (el: HTMLElement, delay: number) => {
      const text = el.dataset.tip?.trim();
      if (!text) return;
      clearTimer();
      activeRef.current = el;
      timerRef.current = window.setTimeout(() => {
        timerRef.current = null;
        if (!el.isConnected || activeRef.current !== el) return;
        const rect = el.getBoundingClientRect();
        if (rect.width === 0 && rect.height === 0) return;
        setCoords(null);
        setTip({ text, rect });
        // Страховка: подсказка не должна висеть бесконечно, если окно
        // свернули или события мыши потерялись.
        timerRef.current = window.setTimeout(hide, 9000);
      }, delay);
    };

    const findTip = (target: EventTarget | null): HTMLElement | null => {
      if (!(target instanceof Element)) return null;
      return target.closest<HTMLElement>("[data-tip]");
    };

    const onOver = (event: PointerEvent) => {
      const el = findTip(event.target);
      if (!el || el === activeRef.current) return;
      hide();
      schedule(el, 280);
    };

    const onOut = (event: PointerEvent) => {
      const el = findTip(event.target);
      if (!el || activeRef.current !== el) return;
      const next = event.relatedTarget;
      if (next instanceof Node && el.contains(next)) return;
      hide();
    };

    const onFocus = (event: FocusEvent) => {
      const el = findTip(event.target);
      if (el) {
        hide();
        schedule(el, 0);
      }
    };

    const onBlur = () => hide();

    // Если курсор уже не над элементом подсказки (или элемент перерисован),
    // событие pointerout могло не прийти — проверяем по движению мыши.
    const onMove = (event: PointerEvent) => {
      const el = activeRef.current;
      if (!el) return;
      if (!el.isConnected) {
        hide();
        return;
      }
      if (event.target instanceof Node && el.contains(event.target)) return;
      hide();
    };

    const onVisibility = () => {
      if (document.hidden) hide();
    };

    document.addEventListener("pointerover", onOver, true);
    document.addEventListener("pointerout", onOut, true);
    document.addEventListener("pointerdown", hide, true);
    document.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("focusin", onFocus, true);
    document.addEventListener("focusout", onBlur, true);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("scroll", hide, true);
    window.addEventListener("resize", hide);
    window.addEventListener("blur", hide);
    window.addEventListener("focus", hide);

    return () => {
      clearTimer();
      document.removeEventListener("pointerover", onOver, true);
      document.removeEventListener("pointerout", onOut, true);
      document.removeEventListener("pointerdown", hide, true);
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("focusin", onFocus, true);
      document.removeEventListener("focusout", onBlur, true);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("scroll", hide, true);
      window.removeEventListener("resize", hide);
      window.removeEventListener("blur", hide);
      window.removeEventListener("focus", hide);
    };
  }, []);

  useLayoutEffect(() => {
    if (!tip || !tipRef.current) return;
    const box = tipRef.current.getBoundingClientRect();
    const pad = 8;
    const gap = 8;

    let top = tip.rect.top - box.height - gap;
    if (top < pad) top = tip.rect.bottom + gap;
    top = Math.min(top, window.innerHeight - box.height - pad);

    const centered = tip.rect.left + tip.rect.width / 2 - box.width / 2;
    const left = Math.max(pad, Math.min(centered, window.innerWidth - box.width - pad));

    setCoords({ left, top });
  }, [tip]);

  return createPortal(
    <AnimatePresence>
      {tip && (
        <motion.div
          ref={tipRef}
          role="tooltip"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.1, ease: "easeOut" }}
          style={{
            position: "fixed",
            left: coords?.left ?? 0,
            top: coords?.top ?? 0,
            visibility: coords ? "visible" : "hidden",
          }}
          className="pointer-events-none z-[100] max-w-[300px] rounded-lg border border-line2/45 bg-[#23252d]/55 px-2.5 py-1.5 text-center text-[11.5px] font-medium leading-relaxed text-ink/90 shadow-[0_14px_34px_-12px_rgba(0,0,0,0.95)] backdrop-blur-xl"
        >
          {tip.text}
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
