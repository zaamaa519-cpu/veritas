import { NextRequest, NextResponse } from 'next/server';
import { getGoogleUserInfo, findOrCreateOAuthUser } from '@/lib/oauth';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    if (error || !code) {
      console.error('Google OAuth error:', error, errorDescription);
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/login?error=oauth_cancelled&provider=google`
      );
    }

    const redirectUri = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/auth/google/callback`;
    
    // Get user info from Google
    const oauthUser = await getGoogleUserInfo(code, redirectUri);
    
    // Find or create user in MongoDB and set auth cookie
    const result = await findOrCreateOAuthUser(oauthUser);

    // Redirect to home page with success indicator
    const response = NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/?oauth_success=true&provider=google`
    );
    
    return response;
  } catch (error: any) {
    console.error('Google OAuth callback error:', error);
    const errorMessage = error?.message || 'oauth_failed';
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/login?error=${encodeURIComponent(errorMessage)}&provider=google`
    );
  }
}
