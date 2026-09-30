"use client";

import { useActionState } from "react";
import { loginAction, type LoginState } from "../actions";

export function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(loginAction, {});

  return (
    <form className="admin-form" action={action}>
      {state.error && (
        <p className="admin-alert" role="alert">
          {state.error}
        </p>
      )}
      <div className="admin-field">
        <label htmlFor="email">Е-мейл</label>
        <input id="email" name="email" type="email" autoComplete="username" required defaultValue={state.email} />
      </div>
      <div className="admin-field">
        <label htmlFor="password">Пароль</label>
        <input id="password" name="password" type="password" autoComplete="current-password" required />
      </div>
      <button className="btn" type="submit" disabled={pending}>
        {pending ? "Вхід…" : "Увійти"}
      </button>
    </form>
  );
}
