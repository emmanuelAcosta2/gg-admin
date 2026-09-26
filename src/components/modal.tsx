"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/** Panel que sube desde abajo en el celular y se centra en escritorio. El contenido se monta solo al abrir. */
export function Modal({
  trigger,
  triggerClassName,
  title,
  children,
}: {
  trigger: ReactNode;
  triggerClassName: string;
  title: string;
  children: (close: () => void) => ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  return (
    <>
      <button type="button" className={triggerClassName} onClick={() => setOpen(true)}>
        {trigger}
      </button>
      <dialog
        ref={ref}
        onClose={() => setOpen(false)}
        onClick={(e) => {
          if (e.target === e.currentTarget) setOpen(false);
        }}
        aria-label={title}
        className="m-auto mb-0 max-h-[92dvh] w-full max-w-[560px] overflow-y-auto rounded-t-2xl border border-line bg-surface p-0 text-fg backdrop:bg-black/70 lg:mb-auto lg:rounded-2xl"
      >
        {open && (
          <div className="flex flex-col gap-4 p-4 pb-[max(16px,env(safe-area-inset-bottom))] lg:p-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-display text-[26px] leading-none font-bold tracking-wide uppercase">{title}</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Cerrar"
                className="grid size-10 place-items-center rounded-[10px] border border-line bg-raised"
              >
                ✕
              </button>
            </div>
            {children(() => setOpen(false))}
          </div>
        )}
      </dialog>
    </>
  );
}
