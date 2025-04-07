// src/app/api/auth/me/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { getUserRepository } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    // Verify authentication
    const authResult = await verifyAuth(req);
    if (!authResult.isAuthenticated) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Get user details
    const userRepo = await getUserRepository();
    const user = await userRepo.findOne({
      where: { id: authResult.user.id },
      relations: ['roles', 'roles.permissions'],
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      id: user.id,
      email: user.email,
      name: user.name,
      roles: user.roles.map((role) => role.name),
      permissions: user.roles.flatMap((role) =>
        role.permissions.map((permission) => permission.name),
      ),
    });
  } catch (error) {
    console.error('Auth me error:', error);
    return NextResponse.json({ error: 'Failed to get user information' }, { status: 500 });
  }
}
