import { NextRequest, NextResponse } from 'next/server';
import { getTwitterUserInfo, findOrCreateOAuthUser } from '@/lib/oauth';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    if (error || !code) {
      console.error('Twitter OAuth error:', error, errorDescription);
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/login?error=oauth_cancelled&provider=twitter`
      );
    }

    // Verify state for CSRF protection if state is provided
    if (state) {
      const cookieStore = await cookies();
      const storedState = cookieStore.get('twitter_oauth_state')?.value;
      
      if (storedState && state !== storedState) {
        return NextResponse.redirect(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/login?error=oauth_invalid_state&provider=twitter`
        );
      }

      // Clear state cookie
      cookieStore.delete('twitter_oauth_state');
    }

    const redirectUri = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/auth/twitter/callback`;
    
    // Get user info from Twitter
    const oauthUser = await getTwitterUserInfo(code, redirectUri);
    
    // Find or create user in MongoDB and set auth cookie
    const result = await findOrCreateOAuthUser(oauthUser);

    // Redirect to home page with success indicator
    const response = NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/?oauth_success=true&provider=twitter`
    );
    
    return response;
  } catch (error: any) {
    console.error('Twitter OAuth callback error:', error);
    const errorMessage = error?.message || 'oauth_failed';
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/login?error=${encodeURIComponent(errorMessage)}&provider=twitter`
    );
  }
}
