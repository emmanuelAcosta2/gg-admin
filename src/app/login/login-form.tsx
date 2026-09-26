"use client";

import { useActionState } from "react";
import { signIn, type LoginState } from "./actions";

const initial: LoginState = {};
const label = "text-[11px] font-semibold tracking-[0.12em] text-muted uppercase";
const input = "min-h-11 w-full rounded-[10px] border border-line bg-raised px-3 py-2.5 text-fg";

export function LoginForm() {
  const [state, action, pending] = useActionState(signIn, initial);

  return (
    <form action={action} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className={label}>Correo</label>
        <input id="email" name="email" type="email" autoComplete="email" required className={input} />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className={label}>Contraseña</label>
        <input id="password" name="password" type="password" autoComplete="current-password" required className={input} />
      </div>
      {state.error && (
        <p role="alert" className="text-sm text-bad">
          {state.error}
        </p>
      )}
      <button
        disabled={pending}
        className="min-h-11 rounded-[10px] bg-brand px-4 font-semibold text-brand-ink disabled:opacity-60"
      >
        {pending ? "Ingresando…" : "Ingresar"}
      </button>
    </form>
  );
}
