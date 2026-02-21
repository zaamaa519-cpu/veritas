import { getDatabase } from '@/lib/mongodb';
import { createToken, setAuthCookie } from '@/lib/auth';
import { ObjectId } from 'mongodb';

export interface OAuthUser {
  id: string;
  email: string;
  name: string;
  picture?: string;
  provider: 'google' | 'twitter';
}

export async function findOrCreateOAuthUser(oauthUser: OAuthUser) {
  const db = await getDatabase();
  const usersCollection = db.collection('users');

  // Check if user exists by email
  let user = await usersCollection.findOne({ email: oauthUser.email });

  if (user) {
    // Update OAuth info if user exists
    await usersCollection.updateOne(
      { _id: user._id },
      {
        $set: {
          [`oauth.${oauthUser.provider}`]: {
            id: oauthUser.id,
            connectedAt: new Date(),
          },
          photoURL: oauthUser.picture || user.photoURL,
          updatedAt: new Date(),
        },
      }
    );
  } else {
    // Create new user
    const username = oauthUser.email.split('@')[0] + '_' + Math.random().toString(36).substring(7);
    
    const result = await usersCollection.insertOne({
      username,
      email: oauthUser.email,
      password: null, // OAuth users don't have passwords
      displayName: oauthUser.name,
      photoURL: oauthUser.picture || null,
      selectedAvatar: 'default',
      userTitle: 'Truth Seeker',
      oauth: {
        [oauthUser.provider]: {
          id: oauthUser.id,
          connectedAt: new Date(),
        },
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Create user stats
    await db.collection('user_stats').insertOne({
      userId: result.insertedId.toString(),
      masteryLevel: 0,
      userLevel: 1,
      analysesCompleted: 0,
      quizScore: 0,
      badgesEarned: 0,
      skills: {
        biasDetection: 0,
        sourceVerification: 0,
        logicalFallacySpotting: 0,
        emotionalLanguageRecognition: 0,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    user = await usersCollection.findOne({ _id: result.insertedId });
  }

  if (!user) {
    throw new Error('Failed to create or find user');
  }

  const userId = user._id.toString();
  const token = await createToken({
    userId,
    email: user.email as string,
    username: user.username as string,
  });

  await setAuthCookie(token);

  return {
    user: {
      id: userId,
      username: user.username,
      email: user.email,
      displayName: user.displayName || user.username,
      photoURL: user.photoURL,
    },
    token,
  };
}

export function getGoogleAuthUrl(redirectUri: string): string {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'offline',
    prompt: 'consent',
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export async function getGoogleUserInfo(code: string, redirectUri: string): Promise<OAuthUser> {
  // Exchange code for tokens
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  });

  if (!tokenResponse.ok) {
    throw new Error('Failed to exchange Google code for token');
  }

  const tokens = await tokenResponse.json();

  // Get user info
  const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });

  if (!userResponse.ok) {
    throw new Error('Failed to get Google user info');
  }

  const userInfo = await userResponse.json();

  return {
    id: userInfo.id,
    email: userInfo.email,
    name: userInfo.name,
    picture: userInfo.picture,
    provider: 'google',
  };
}

export function getTwitterAuthUrl(redirectUri: string, state: string): string {
  const codeChallenge = generateCodeChallenge();
  
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: process.env.TWITTER_CLIENT_ID!,
    redirect_uri: redirectUri,
    scope: 'tweet.read users.read offline.access',
    state,
    code_challenge: codeChallenge,
    code_challenge_method: 'plain',
  });

  return `https://twitter.com/i/oauth2/authorize?${params.toString()}`;
}

export async function getTwitterUserInfo(code: string, redirectUri: string): Promise<OAuthUser> {
  const codeChallenge = generateCodeChallenge();

  // Exchange code for tokens
  const tokenResponse = await fetch('https://api.twitter.com/2/oauth2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${Buffer.from(
        `${process.env.TWITTER_CLIENT_ID}:${process.env.TWITTER_CLIENT_SECRET}`
      ).toString('base64')}`,
    },
    body: new URLSearchParams({
      code,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
      code_verifier: codeChallenge,
    }),
  });

  if (!tokenResponse.ok) {
    const error = await tokenResponse.text();
    throw new Error(`Failed to exchange Twitter code for token: ${error}`);
  }

  const tokens = await tokenResponse.json();

  // Get user info
  const userResponse = await fetch('https://api.twitter.com/2/users/me?user.fields=profile_image_url', {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });

  if (!userResponse.ok) {
    throw new Error('Failed to get Twitter user info');
  }

  const userData = await userResponse.json();
  const user = userData.data;

  return {
    id: user.id,
    email: user.email || `${user.username}@twitter.placeholder.com`, // Twitter OAuth 2.0 might not provide email
    name: user.name,
    picture: user.profile_image_url,
    provider: 'twitter',
  };
}

function generateCodeChallenge(): string {
  // For simplicity, using a static challenge. In production, use PKCE properly
  return 'challenge';
}
