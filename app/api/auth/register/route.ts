import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { hashPassword, createToken, setAuthCookie } from '@/lib/auth';
import { z } from 'zod';

const registerSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^a-zA-Z0-9]/, 'Password must contain at least one special character'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = registerSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { username, email, password } = validation.data;

    const db = await getDatabase();
    const usersCollection = db.collection('users');

    const existingUser = await usersCollection.findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email or username already exists' },
        { status: 400 }
      );
    }

    const hashedPassword = await hashPassword(password);

    const result = await usersCollection.insertOne({
      username,
      email,
      password: hashedPassword,
      displayName: username,
      photoURL: null,
      selectedAvatar: 'default',
      userTitle: 'Truth Seeker',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const userId = result.insertedId.toString();

    await db.collection('user_stats').insertOne({
      userId,
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

    const token = await createToken({ userId, email, username });
    await setAuthCookie(token);

    return NextResponse.json({
      user: {
        id: userId,
        username,
        email,
        displayName: username,
      },
      access_token: token,
    });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
