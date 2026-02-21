import { NextRequest, NextResponse } from 'next/server';
import { getGoogleAuthUrl } from '@/lib/oauth';

export async function GET(request: NextRequest) {
  try {
    const redirectUri = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/auth/google/callback`;
    const authUrl = getGoogleAuthUrl(redirectUri);
    
    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error('Google OAuth error:', error);
    return NextResponse.redirect('/login?error=oauth_failed');
  }
}
