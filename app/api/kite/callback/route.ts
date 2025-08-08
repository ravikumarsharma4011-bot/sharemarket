import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { setCookie } from '../../../lib/cookies'

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const request_token = url.searchParams.get('request_token')
  const error = url.searchParams.get('error')
  if (error) return NextResponse.json({ ok: false, error }, { status: 400 })
  if (!request_token) return NextResponse.json({ ok: false, error: 'Missing request_token' }, { status: 400 })
  const api_key = process.env.KITE_API_KEY || ''
  const api_secret = process.env.KITE_API_SECRET || ''
  if (!api_key || !api_secret) return NextResponse.json({ ok: false, error: 'Server missing API credentials' }, { status: 500 })
  const checksum = crypto.createHash('sha256').update(api_key + request_token + api_secret).digest('hex')
  const res = await fetch('https://api.kite.trade/session/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'X-Kite-Version': '3' },
    body: new URLSearchParams({ api_key, request_token, checksum })
  })
  const json = await res.json()
  if (!res.ok || !json?.data?.access_token) return NextResponse.json({ ok: false, error: json?.message || 'Token exchange failed' }, { status: 400 })
  const accessToken = json.data.access_token as string
  setCookie('kite_access_token', accessToken, 60*60*20)
  return NextResponse.redirect(new URL('/?kite=ok', req.url))
}
