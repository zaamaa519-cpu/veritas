import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { getDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function GET(request: NextRequest) {
  try {
    const userPayload = await getUserFromRequest(request);

    if (!userPayload) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const db = await getDatabase();
    const usersCollection = db.collection('users');

    const user = await usersCollection.findOne(
      { _id: new ObjectId(userPayload.userId) },
      { projection: { password: 0 } }
    );

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      user: {
        id: user._id.toString(),
        username: user.username,
        email: user.email,
        displayName: user.displayName || user.username,
        photoURL: user.photoURL,
        selectedAvatar: user.selectedAvatar || 'default',
        userTitle: user.userTitle || 'Truth Seeker',
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const userPayload = await getUserFromRequest(request);

    if (!userPayload) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { displayName, selectedAvatar, userTitle } = body;

    const db = await getDatabase();
    const usersCollection = db.collection('users');

    const updateFields: any = {
      updatedAt: new Date(),
    };

    if (displayName !== undefined) {
      updateFields.displayName = displayName;
    }
    if (selectedAvatar !== undefined) {
      updateFields.selectedAvatar = selectedAvatar;
    }
    if (userTitle !== undefined) {
      updateFields.userTitle = userTitle;
    }

    const result = await usersCollection.updateOne(
      { _id: new ObjectId(userPayload.userId) },
      { $set: updateFields }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const updatedUser = await usersCollection.findOne(
      { _id: new ObjectId(userPayload.userId) },
      { projection: { password: 0 } }
    );

    return NextResponse.json({
      message: 'Profile updated successfully',
      user: {
        id: updatedUser!._id.toString(),
        username: updatedUser!.username,
        email: updatedUser!.email,
        displayName: updatedUser!.displayName || updatedUser!.username,
        photoURL: updatedUser!.photoURL,
        selectedAvatar: updatedUser!.selectedAvatar || 'default',
        userTitle: updatedUser!.userTitle || 'Truth Seeker',
      },
    });
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
