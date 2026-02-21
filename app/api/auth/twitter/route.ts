import { NextRequest, NextResponse } from 'next/server';
import { getTwitterAuthUrl } from '@/lib/oauth';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const redirectUri = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/auth/twitter/callback`;
    
    // Generate state for CSRF protection
    const state = Math.random().toString(36).substring(7);
    
    // Store state in cookie for verification
    const cookieStore = await cookies();
    cookieStore.set('twitter_oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 10, // 10 minutes
      path: '/',
    });
    
    const authUrl = getTwitterAuthUrl(redirectUri, state);
    
    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error('Twitter OAuth error:', error);
    return NextResponse.redirect('/login?error=oauth_failed');
  }
}
