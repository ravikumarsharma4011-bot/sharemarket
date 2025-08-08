import { NextResponse } from 'next/server'
import { getCookie } from '../../../../lib/cookies'
export async function GET(){ const token=getCookie('kite_access_token'); return NextResponse.json({ok:Boolean(token)}) }
