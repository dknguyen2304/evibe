// src/app/api/auth/logout/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth, logoutUser } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    // Verify authentication
    const authResult = await verifyAuth(req);
    if (!authResult.isAuthenticated) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Logout user
    await logoutUser(authResult.user.id);

    return NextResponse.json({
      message: 'Logged out successfully',
    });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json({ error: 'Failed to logout' }, { status: 500 });
  }
}
