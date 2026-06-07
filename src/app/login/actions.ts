'use server';
import { redirect } from 'next/navigation';
import { registerSchema, loginSchema } from '@/server/validations/auth.schema';
import { userService } from '@/server/services/user.service';
import { setSessionCookie, clearSessionCookie } from '@/server/auth';

export async function login(_: unknown, formData: FormData) {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: 'Enter a valid email and password' };
  try {
    const user = await userService.login(
      parsed.data.email,
      parsed.data.password,
    );
    await setSessionCookie({ userId: user.id, email: user.email });
  } catch (e) {
    return { error: (e as Error).message };
  }
  redirect('/');
}

export async function register(_: unknown, formData: FormData) {
  const parsed = registerSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  try {
    const user = await userService.register(
      parsed.data.email,
      parsed.data.password,
    );
    await setSessionCookie({ userId: user.id, email: user.email });
  } catch (e) {
    return { error: (e as Error).message };
  }
  redirect('/');
}

export async function logout() {
  await clearSessionCookie();
  redirect('/login');
}
