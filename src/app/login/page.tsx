'use client';
import { useActionState, useState } from 'react';
import Link from 'next/link';
import { login, register } from './actions';

export default function LoginPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const action = mode === 'login' ? login : register;
  const [state, formAction, pending] = useActionState(
    action,
    null as { error?: string } | null,
  );

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <Link
            href="/"
            className="text-sm font-semibold tracking-tight text-zinc-900"
          >
            Article Studio
          </Link>
          <h1 className="mt-4 text-2xl font-semibold tracking-tight text-zinc-900">
            {mode === 'login' ? 'Welcome back' : 'Create your account'}
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            {mode === 'login'
              ? 'Log in to your article library.'
              : 'Start turning travel notes into articles.'}
          </p>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
          <form action={formAction} className="flex flex-col gap-3">
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-zinc-600">
                Email
              </span>
              <input
                name="email"
                type="email"
                required
                placeholder="you@email.com"
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-400"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-zinc-600">
                Password
              </span>
              <input
                name="password"
                type="password"
                required
                placeholder="At least 8 characters"
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-400"
              />
            </label>
            {state?.error && (
              <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
                {state.error}
              </p>
            )}
            <button
              disabled={pending}
              className="mt-1 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:opacity-50"
            >
              {pending ? '…' : mode === 'login' ? 'Log in' : 'Create account'}
            </button>
          </form>
        </div>

        <p className="mt-4 text-center text-sm text-zinc-500">
          {mode === 'login'
            ? "Don't have an account? "
            : 'Already have an account? '}
          <button
            onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
            className="font-medium text-zinc-900 underline-offset-2 hover:underline"
          >
            {mode === 'login' ? 'Sign up' : 'Log in'}
          </button>
        </p>
      </div>
    </main>
  );
}
