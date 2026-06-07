'use client';
import { useActionState, useState } from 'react';
import { login, register } from './actions';

export default function LoginPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const action = mode === 'login' ? login : register;
  const [state, formAction, pending] = useActionState(
    action,
    null as { error?: string } | null,
  );
  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-4 p-6">
      <h1 className="text-xl font-semibold">
        {mode === 'login' ? 'Log in' : 'Create account'}
      </h1>
      <form action={formAction} className="flex flex-col gap-3">
        <input
          name="email"
          type="email"
          required
          placeholder="you@email.com"
          className="rounded border p-2"
        />
        <input
          name="password"
          type="password"
          required
          placeholder="Password (min 8)"
          className="rounded border p-2"
        />
        {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
        <button
          disabled={pending}
          className="rounded bg-black p-2 text-white disabled:opacity-50"
        >
          {pending ? '…' : mode === 'login' ? 'Log in' : 'Sign up'}
        </button>
      </form>
      <button
        onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
        className="text-sm text-gray-600 underline"
      >
        {mode === 'login'
          ? 'Need an account? Sign up'
          : 'Have an account? Log in'}
      </button>
    </main>
  );
}
