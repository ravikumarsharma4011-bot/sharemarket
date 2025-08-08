import { cookies } from 'next/headers'
export function setCookie(name: string, value: string, maxAgeSeconds: number) { cookies().set({ name, value, maxAge: maxAgeSeconds, httpOnly: true, sameSite: 'lax', secure: true, path: '/' }) }
export function getCookie(name: string): string | null { const c = cookies().get(name); return c?.value || null }
