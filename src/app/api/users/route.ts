// src/app/api/users/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getUserRepository } from '@/lib/db';
import { verifyAuth, hasRole } from '@/lib/auth';
import { cacheApiResponse, invalidateCache } from '@/lib/redis/apiCache';

export async function GET(req: NextRequest) {
  // Verify authentication
  const authResult = await verifyAuth(req);
  if (!authResult.isAuthenticated) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  // Check if user has admin role
  if (!hasRole(authResult.user, 'admin')) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  return cacheApiResponse(req, async () => {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search');

    const skip = (page - 1) * limit;

    const userRepo = await getUserRepository();
    let query = userRepo.createQueryBuilder('user').leftJoinAndSelect('user.roles', 'roles');

    // Apply search filter
    if (search) {
      query = query.where('user.name ILIKE :search OR user.email ILIKE :search', {
        search: `%${search}%`,
      });
    }

    // Get total count for pagination
    const total = await query.getCount();

    // Get paginated results
    const users = await query.orderBy('user.createdAt', 'DESC').skip(skip).take(limit).getMany();

    // Map users to remove sensitive data
    const mappedUsers = users.map((user) => ({
      id: user.id,
      email: user.email,
      name: user.name,
      roles: user.roles.map((role) => role.name),
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }));

    return NextResponse.json({
      data: mappedUsers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  });
}
